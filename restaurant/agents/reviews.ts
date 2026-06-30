/**
 * Custom ReviewsAgent — analyzes customer reviews using RAG context + LLM.
 *
 * Demonstrates:
 * - Custom OrchidAgent subclass (when YAML-only GenericAgent isn't enough)
 * - RAG retrieval for historical review context
 * - Direct built-in tool invocation (analyzeSentiment)
 * - Combining RAG context with live tool results in LLM summarisation
 *
 * Referenced in agents.yaml as:
 *     class: ./agents/reviews.ts#ReviewsAgent
 */

import { OrchidAgent, getRunContext, makeScope } from "@orchid-ai/orchid/core";
import type {
    OrchidAgentState,
    OrchidAuthContext,
    OrchidMCPClient,
    OrchidVectorReader,
    OrchidSearchResult,
    ChatModelLike,
} from "@orchid-ai/orchid/core";

import { analyzeSentiment } from "../tools/reviews.js";

interface ReviewsAgentOpts {
    config?: Record<string, unknown>;
    reader: OrchidVectorReader;
    mcpClients?: OrchidMCPClient[] | null;
    chatModel?: ChatModelLike | null;
}

function ragDataToRecord(ragData: OrchidSearchResult[]): Record<string, unknown> {
    return { reviews: ragData.map((d) => ({ content: d.document.pageContent, score: d.score })) };
}

export class ReviewsAgent extends OrchidAgent {
    private config: Record<string, unknown>;

    constructor(opts: ReviewsAgentOpts) {
        super({
            reader: opts.reader,
            mcpClients: opts.mcpClients ?? undefined,
            chatModel: opts.chatModel ?? undefined,
        });
        this.config = opts.config ?? {};
    }

    get name(): string {
        return "reviews";
    }

    get description(): string {
        return (
            "Analyzes customer reviews and feedback. Performs sentiment analysis, " +
            "identifies trends, and provides actionable insights for restaurant improvement. " +
            "Use for review analysis, feedback summaries, and satisfaction metrics."
        );
    }

    get ragNamespace(): string {
        return "reviews";
    }

    async run(state: OrchidAgentState): Promise<OrchidAgentState> {
        const query = OrchidAgent.extractUserQuery(state);
        if (!query) {
            return {
                messages: [
                    { content: "I need a review or question about reviews to analyze.", role: "assistant" },
                ],
                mcpContext: {},
                ragContext: {},
            } as unknown as OrchidAgentState;
        }

        const ctx = getRunContext();
        const auth: OrchidAuthContext | null = ctx.auth;

        // Step 1: retrieve historical review context from RAG
        let ragDocs: OrchidSearchResult[] = [];
        if (auth) {
            const scope = makeScope({
                tenantId: auth.tenantKey,
                userId: auth.userId,
                chatId: state.chatId ?? "",
                agentId: this.name,
            });
            ragDocs = await this.fetchRagContext(query, scope, this.ragNamespace, 5);
        }

        // Step 2: run sentiment analysis on the query text directly
        let sentimentResult: Record<string, unknown>;
        try {
            sentimentResult = await analyzeSentiment({ text: query });
        } catch (exc: unknown) {
            sentimentResult = { error: exc instanceof Error ? exc.message : String(exc) };
        }

        // Step 3: merge into context for downstream use
        const mcpContext = state.mcpContext ?? {};
        const ragContext = state.ragContext ?? {};

        const updatedMcpContext = {
            ...mcpContext,
            [this.name]: {
                sentiment_analysis: sentimentResult,
                rag_context_count: ragDocs.length,
            },
        };
        const updatedRagContext = {
            ...ragContext,
            [this.name]: ragDocs,
        };

        // Step 4: LLM summarisation
        const systemPrompt =
            "You are a Restaurant Review Analyst. Analyze customer feedback and provide " +
            "actionable insights. Consider sentiment scores, recurring themes, and specific " +
            "praise or complaints. When historical review data is available, identify trends " +
            "and compare the current review against past patterns.\n\n" +
            "Structure your response with:\n" +
            "- Sentiment summary (positive/negative/mixed)\n" +
            "- Key themes identified\n" +
            "- Specific feedback highlights\n" +
            "- Actionable recommendations for the restaurant";

        let summary: string;
        try {
            summary = await this.summarise(
                query,
                { sentiment: sentimentResult },
                ragDataToRecord(ragDocs),
                { systemPrompt },
            );
        } catch (exc: unknown) {
            summary =
                `**Sentiment Analysis Result:**\n` +
                `\`\`\`json\n${JSON.stringify(sentimentResult, null, 2)}\n\`\`\`\n\n` +
                `Historical context: ${ragDocs.length} related reviews found.`;
        }

        return {
            messages: [{ content: `[Review Analyst]\n${summary}`, role: "assistant" }],
            mcpContext: updatedMcpContext,
            ragContext: updatedRagContext,
        } as unknown as OrchidAgentState;
    }
}
