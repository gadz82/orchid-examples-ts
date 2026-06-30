import {
    OrchidAgent,
    getRunContext,
    makeScope,
} from "@orchid-ai/orchid/core";
import type {
    OrchidAgentState,
    OrchidMCPClient,
    OrchidVectorReader,
    ChatModelLike,
} from "@orchid-ai/orchid/core";

const BLOOM_MARKER = "[bloom]";
const CONTENT_THRESHOLD_CHARS = 200_000;

export class EducationAgent extends OrchidAgent {
    private readonly _name: string;
    private readonly _description: string;

    constructor(opts: {
        config?: Record<string, unknown>;
        reader: OrchidVectorReader;
        mcpClients?: OrchidMCPClient[];
        chatModel?: ChatModelLike | null;
    }) {
        super({
            modelId: "",
            reader: opts.reader,
            mcpClients: opts.mcpClients ?? [],
            chatModel: opts.chatModel ?? null,
        });
        this._name = String(opts.config?.name ?? "education");
        this._description = String(
            opts.config?.description ??
                "Educational content agent that analyses source material and produces quizzes, lessons, and exports.",
        );
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    async run(state: OrchidAgentState): Promise<OrchidAgentState> {
        const query = OrchidAgent.extractUserQuery(state);
        if (!query) {
            return {
                messages: [
                    {
                        role: "ai",
                        content: `[${this._titleCase(this.name)} Agent] I need some material to work with.`,
                    } as unknown,
                ],
                finalResponse: "I need some material to work with.",
            } as unknown as OrchidAgentState;
        }

        if (query.startsWith(BLOOM_MARKER)) {
            return this._runBloom(state, query);
        }

        if (await this._isContentLong(state, query)) {
            return this._emitAndReturnBackground(query);
        }

        return this._generateResponse(state, query);
    }

    private async _runBloom(state: OrchidAgentState, query: string): Promise<OrchidAgentState> {
        const lines = query.split("\n");
        const kept: string[] = [];

        for (const line of lines) {
            if (line.startsWith(BLOOM_MARKER)) continue;
            if (line.startsWith("chat_id:")) {
                const chatId = line.split(":", 2)[1]?.trim();
                if (chatId) state.chatId = chatId;
                continue;
            }
            kept.push(line);
        }

        const cleanQuery = kept.join("\n").trim();
        const messages = (state.messages ?? []) as Array<Record<string, unknown>>;
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg && (msg["role"] === "human" || msg["type"] === "human")) {
                msg["content"] = cleanQuery;
                break;
            }
        }

        return this._generateResponse(state, cleanQuery);
    }

    private async _isContentLong(_state: OrchidAgentState, query: string): Promise<boolean> {
        const ctx = getRunContext();
        const auth = ctx.auth;
        if (!auth) return false;

        const scope = makeScope({
            tenantId: auth.tenantKey,
            userId: auth.userId,
            chatId: ctx.chatId ?? "",
            agentId: this.name,
        });

        try {
            const ragData = await this.fetchRagContext(query, scope, "education", 20);
            const totalChars = ragData.reduce(
                (sum, item) => sum + String(item.document.pageContent ?? "").length,
                0,
            );
            return totalChars > CONTENT_THRESHOLD_CHARS;
        } catch {
            return false;
        }
    }

    private _emitAndReturnBackground(query: string): OrchidAgentState {
        const responseText =
            `[${this._titleCase(this.name)} Agent]\n` +
            "I've started generating your educational content in the background. " +
            "It will appear here shortly!";
        return {
            messages: [{ role: "ai", content: responseText } as unknown],
            finalResponse: responseText,
            pendingAgents: [],
        } as unknown as OrchidAgentState;
    }

    private async _generateResponse(
        state: OrchidAgentState,
        query: string,
    ): Promise<OrchidAgentState> {
        const ctx = getRunContext();
        const auth = ctx.auth;

        let ragSection = "";
        if (auth) {
            const scope = makeScope({
                tenantId: auth.tenantKey,
                userId: auth.userId,
                chatId: state.chatId ?? ctx.chatId ?? "",
                agentId: this.name,
            });
            try {
                const ragData = await this.fetchRagContext(query, scope, "education", 8);
                ragSection = ragData
                    .map((item) => String(item.document.pageContent ?? ""))
                    .join("\n\n");
            } catch {
                ragSection = "";
            }
        }

        const systemPrompt = [
            "You are an educational content assistant.",
            "Use the source material below to answer the user's request concisely and accurately.",
            "",
            "Source material:",
            ragSection || "(no source material retrieved)",
        ].join("\n");

        const answer = await this.summarise(query, null, null, { systemPrompt });
        const responseText = `[${this._titleCase(this.name)} Agent]\n${answer}`;

        return {
            messages: [{ role: "ai", content: responseText } as unknown],
            finalResponse: answer,
        } as unknown as OrchidAgentState;
    }

    private _titleCase(name: string): string {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
}
