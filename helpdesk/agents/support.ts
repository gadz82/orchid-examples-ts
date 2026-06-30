/**
 * Support Agent — agentic tool-calling loop for technical support.
 *
 * Custom OrchidAgent subclass that handles technical support queries using
 * a multi-turn LLM loop. The agent:
 *
 * 1. Retrieves relevant knowledge base articles via RAG
 * 2. Calls built-in tools (classify_ticket, search_kb, get_ticket_status)
 *    through the LLM's function-calling interface
 * 3. Loops until the LLM produces a final text response
 * 4. Returns a comprehensive support response
 */

import {
    OrchidAgent,
    getRunContext,
    makeScope,
} from "@orchid-ai/orchid";
import type {
    OrchidAgentState,
    OrchidAuthContext,
    OrchidVectorReader,
    ChatModelLike,
} from "@orchid-ai/orchid";
import { classifyTicket, getTicketStatus, searchKB } from "../tools/tickets.js";

const MAX_TOOL_ROUNDS = 8;

interface ToolDef {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
}

const BUILTIN_TOOLS: ToolDef[] = [
    {
        type: "function",
        function: {
            name: "classify_ticket",
            description:
                "Classify a support ticket by priority and category. " +
                "Returns priority level, category, confidence score, and suggested agent.",
            parameters: {
                type: "object",
                properties: {
                    description: {
                        type: "string",
                        description: "The ticket description or problem statement to classify",
                    },
                },
                required: ["description"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_kb",
            description:
                "Search the knowledge base for articles relevant to a technical issue. " +
                "Returns matching articles with content and relevance scores.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query describing the technical issue",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_ticket_status",
            description: "Look up the current status, priority, and details of an existing support ticket.",
            parameters: {
                type: "object",
                properties: {
                    ticket_id: {
                        type: "string",
                        description: "The ticket identifier, e.g. 'TK-1001'",
                    },
                },
                required: ["ticket_id"],
            },
        },
    },
];

interface SupportAgentOpts {
    config?: Record<string, unknown>;
    reader: OrchidVectorReader;
    mcpClients?: unknown[] | null;
    chatModel?: ChatModelLike | null;
}

export class SupportAgent extends OrchidAgent {
    private config: Record<string, unknown>;

    constructor(opts: SupportAgentOpts) {
        super({
            reader: opts.reader,
            mcpClients: opts.mcpClients ?? undefined,
            chatModel: opts.chatModel ?? undefined,
        });
        this.config = opts.config ?? {};
    }

    get name(): string {
        return "support";
    }

    get description(): string {
        return (
            "Technical support agent. Handles troubleshooting, diagnostics, " +
            "and resolution of customer issues. Can classify tickets, search " +
            "the knowledge base, and check ticket status. Use for any technical " +
            "support question or issue that needs investigation."
        );
    }

    get ragNamespace(): string {
        return "knowledge_base";
    }

    async run(state: OrchidAgentState): Promise<OrchidAgentState> {
        const ctx = getRunContext();
        const auth: OrchidAuthContext | null = ctx.auth;
        if (!auth) {
            return {
                messages: [{ content: `[${this.name}] Missing auth_context.`, role: "assistant" }],
                mcpContext: {},
                ragContext: {},
            } as unknown as OrchidAgentState;
        }

        let userQuery = OrchidAgent.extractUserQuery(state);

        const skillInstructions = state.skillInstructions ?? {};
        if (this.name in skillInstructions) {
            const instruction = skillInstructions[this.name];
            userQuery = `${userQuery}\n\n[Orchestrator instruction: ${instruction}]`;
        }

        const scope = makeScope({
            tenantId: auth.tenantKey,
            userId: auth.userId,
            chatId: state.chatId ?? "",
            agentId: this.name,
        });

        const ragData = await this.fetchRagContext(userQuery, scope, this.ragNamespace, 5);
        const conversationHistory = OrchidAgent.extractConversationHistory(state, {
            maxTurns: 10,
            maxChars: 1000,
        });

        const [responseText, toolResults] = await this.agenticLoop({
            userQuery,
            ragData,
            conversationHistory,
        });

        return {
            messages: [{ content: `[Support Agent]\n${responseText}`, role: "assistant" }],
            mcpContext: { support: toolResults },
            ragContext: { support: ragData },
        } as unknown as OrchidAgentState;
    }

    private async agenticLoop(opts: {
        userQuery: string;
        ragData: { document: { pageContent: string; metadata: Record<string, unknown> }; score: number }[];
        conversationHistory: import("@orchid-ai/orchid").ConversationMessage[];
    }): Promise<[string, Record<string, unknown>]> {
        const chatModel = this._chatModel;
        if (!chatModel) {
            return ["No chat model available for support agent.", {}];
        }

        const systemPrompt = this.buildSystemPrompt(opts.ragData);
        const messages: Array<Record<string, unknown>> = [
            { role: "system", content: systemPrompt },
            ...(opts.conversationHistory.length > 0
                ? opts.conversationHistory.map((m) => ({ role: m.role, content: m.content }))
                : []),
            { role: "user", content: opts.userQuery },
        ];

        const toolResults: Record<string, unknown> = {};
        const boundModel = (chatModel as any).bindTools?.(BUILTIN_TOOLS);
        if (!boundModel) {
            return ["Chat model does not support tool calling.", {}];
        }

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            let aiMsg: any;
            try {
                aiMsg = await boundModel.invoke(messages, { temperature: 0.2 });
            } catch (exc: unknown) {
                const msg = exc instanceof Error ? exc.message : String(exc);
                return [`I encountered an error while processing your request: ${msg.slice(0, 200)}. Please try again later.`, toolResults];
            }

            messages.push({
                role: "assistant",
                content: aiMsg.content ?? "",
                tool_calls: aiMsg.tool_calls ?? [],
            });

            const toolCalls = aiMsg.tool_calls ?? [];
            if (toolCalls.length === 0) {
                return [aiMsg.content ?? "", toolResults];
            }

            for (const tc of toolCalls) {
                const fnName = tc.function?.name ?? tc.name ?? "";
                let fnArgs: Record<string, unknown> = {};
                try {
                    const raw = tc.function?.arguments ?? tc.args ?? {};
                    fnArgs = typeof raw === "string" ? JSON.parse(raw) : { ...raw };
                } catch {
                    fnArgs = {};
                }

                let result: Record<string, unknown>;
                try {
                    result = await this.dispatchTool(fnName, fnArgs);
                } catch (exc: unknown) {
                    result = { error: exc instanceof Error ? exc.message : String(exc) };
                }

                toolResults[fnName] = result;
                messages.push({
                    role: "tool",
                    content: JSON.stringify(result),
                    tool_call_id: tc.id ?? "",
                });
            }
        }

        return [this.fallbackSummary(opts.userQuery, toolResults, opts.ragData), toolResults];
    }

    private async dispatchTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
        switch (name) {
            case "classify_ticket":
                return classifyTicket(args);
            case "search_kb":
                return searchKB(args);
            case "get_ticket_status":
                return getTicketStatus(args);
            default:
                return { error: `Unknown tool '${name}'` };
        }
    }

    private buildSystemPrompt(
        ragData: { document: { pageContent: string; metadata: Record<string, unknown> }; score: number }[],
    ): string {
        const parts = [
            "You are the Support Agent for the Helpdesk AI system.",
            "You handle technical support queries by investigating issues,",
            "searching the knowledge base, and providing clear resolutions.",
            "",
            "You have access to the following tools:",
            "- classify_ticket: Classify issues by priority and category",
            "- search_kb: Search the knowledge base for relevant articles",
            "- get_ticket_status: Look up existing ticket details",
            "",
            "Workflow:",
            "1. First, classify the issue to understand its priority and category",
            "2. Search the knowledge base for relevant solutions",
            "3. If a ticket ID is mentioned, look up its current status",
            "4. Synthesize all findings into a clear, actionable response",
            "",
            "Guidelines:",
            "- Always classify the issue before searching for solutions",
            "- Reference specific KB article IDs when citing solutions",
            "- If the issue is critical or cannot be resolved, recommend escalation",
            "- Be empathetic, professional, and thorough",
            "- Include step-by-step instructions when applicable",
        ];

        if (ragData.length > 0) {
            parts.push("\n--- Background Knowledge (RAG) ---");
            parts.push(
                JSON.stringify(
                    ragData.map((d) => ({ content: d.document.pageContent, score: d.score })),
                    null,
                    2,
                ).slice(0, 3000),
            );
        }

        return parts.join("\n");
    }

    private fallbackSummary(
        query: string,
        toolResults: Record<string, unknown>,
        ragData: { document: { pageContent: string; metadata: Record<string, unknown> }; score: number }[],
    ): string {
        const parts = [`Query: ${query}`, ""];
        if (Object.keys(toolResults).length > 0) {
            parts.push("Investigation results:");
            for (const [name, value] of Object.entries(toolResults)) {
                parts.push(`  ${name}: ${JSON.stringify(value).slice(0, 500)}`);
            }
        }
        if (ragData.length > 0) {
            parts.push(`\nKnowledge base context: ${ragData.length} article(s) retrieved`);
        }
        parts.push(
            "\nNote: I was unable to complete the full analysis. " +
                "Please consider escalating this issue for human review.",
        );
        return parts.join("\n");
    }
}
