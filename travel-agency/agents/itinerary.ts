/**
 * ItineraryAgent — custom OrchidAgent subclass.
 *
 * Synthesises a day-by-day travel plan from sibling agent results
 * (flights + hotels) and destination RAG context. Does not call tools
 * directly; it reads results already gathered by the flights and hotels
 * agents via state.mcpContext.
 */

import { OrchidAgent, getRunContext, makeScope } from "@orchid-ai/orchid/core";
import type {
    OrchidAgentState,
    OrchidAuthContext,
    OrchidVectorReader,
    OrchidMCPClient,
    ChatModelLike,
} from "@orchid-ai/orchid/core";

const ITINERARY_PROMPT =
    "You are an expert travel itinerary planner.\n\n" +
    "CRITICAL GROUNDING RULES:\n" +
    "- ONLY reference flights, hotels, prices, and dates that appear in " +
    "the 'Sibling agent data' section below.\n" +
    "- NEVER invent flight numbers, hotel names, IDs, or prices.\n" +
    "- If information is missing, say so explicitly and suggest what to " +
    "ask the user next.\n\n" +
    "Produce a concise, day-by-day plan that:\n" +
    "- Opens with a one-line summary (destination + dates + budget estimate)\n" +
    "- Lists each day with activities matching the traveller's interests\n" +
    "- Cites flight numbers and hotel IDs verbatim from the source data\n" +
    "- Ends with a booking checklist (flights, hotels, activities)\n";

const NO_DATA_MSG =
    "[Itinerary] I can build you a plan once we have flight and " +
    "hotel options. Please search those first.";

interface ItineraryAgentOpts {
    config?: Record<string, unknown>;
    reader: OrchidVectorReader;
    mcpClients?: OrchidMCPClient[] | null;
    chatModel?: ChatModelLike | null;
}

export class ItineraryAgent extends OrchidAgent {
    private config: Record<string, unknown>;

    constructor(opts: ItineraryAgentOpts) {
        super({
            reader: opts.reader,
            mcpClients: opts.mcpClients ?? undefined,
            chatModel: opts.chatModel ?? undefined,
        });
        this.config = opts.config ?? {};
    }

    get name(): string {
        return "itinerary";
    }

    get description(): string {
        return (
            "Itinerary planner. Synthesises a day-by-day travel plan grounded " +
            "in flight and hotel search results from sibling agents, plus " +
            "destination RAG context. Use after flight/hotel search is complete."
        );
    }

    get ragNamespace(): string {
        return "destinations";
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

        const query = OrchidAgent.extractUserQuery(state);

        const mcpContext = state.mcpContext ?? {};
        const siblingData: Record<string, unknown> = {};
        for (const [agent, data] of Object.entries(mcpContext)) {
            if (agent !== this.name) siblingData[agent] = data;
        }

        if (Object.keys(siblingData).length === 0) {
            return {
                messages: [{ content: NO_DATA_MSG, role: "assistant", name: this.name }],
                mcpContext: {},
                ragContext: {},
            } as unknown as OrchidAgentState;
        }

        const scope = makeScope({
            tenantId: auth.tenantKey,
            userId: auth.userId,
            chatId: state.chatId ?? "",
            agentId: this.name,
        });
        const ragData = await this.fetchRagContext(query, scope, this.ragNamespace, 5);

        const history = OrchidAgent.extractConversationHistory(state, {
            maxTurns: 5,
            maxChars: 800,
        });

        const summary = await this.summarise(query, siblingData, ragDataToRecord(ragData), {
            systemPrompt: ITINERARY_PROMPT,
            conversationHistory: history.length > 0 ? history : undefined,
        });

        return {
            messages: [{ content: summary, role: "assistant", name: this.name }],
            mcpContext: { [this.name]: { itinerary: summary } },
            ragContext: { [this.name]: ragData },
        } as unknown as OrchidAgentState;
    }
}

function ragDataToRecord(
    ragData: { document: { pageContent: string; metadata: Record<string, unknown> }; score: number }[],
): Record<string, unknown> {
    return { chunks: ragData.map((d) => ({ content: d.document.pageContent, score: d.score })) };
}
