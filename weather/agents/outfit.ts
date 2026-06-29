/**
 * OutfitAdvisorAgent — custom OrchidAgent subclass demonstrating:
 *
 *   - Subclassing OrchidAgent (not GenericAgent)
 *   - Custom run() logic that reads weather data from sibling agents
 *   - Reusing inherited helpers (extractUserQuery, fetchRagContext,
 *     extractConversationHistory, summarise)
 *   - Accessing mcpContext (results from sibling agents) in state
 *   - RAG-augmented clothing recommendations
 *
 * This agent does NOT call MCP tools directly. Instead, it reads weather results
 * already gathered by the weather-forecast agent (via state.mcpContext)
 * and synthesises outfit recommendations grounded in weather data + RAG knowledge.
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

const OUTFIT_PROMPT =
    "You are an expert outfit advisor AI assistant.\n\n" +
    "CRITICAL GROUNDING RULES:\n" +
    "- ONLY recommend clothing that matches the weather data provided below.\n" +
    "- NEVER suggest outfits without temperature, precipitation, and wind data.\n" +
    "- Consider the full day: morning, midday, and evening conditions.\n" +
    "- Mention layering options for temperature swings.\n" +
    "- If the user has a specific activity, adapt the outfit accordingly.\n\n" +
    "Produce a concise outfit recommendation that:\n" +
    "- Opens with a one-line weather summary (temp, conditions, wind)\n" +
    "- Lists each clothing category with specific items and reasoning\n" +
    "- Includes essential accessories (umbrella, sunscreen, etc.)\n" +
    "- Notes any weather-related cautions (e.g. 'dress in layers for the 10°C drop at night')\n" +
    "- Ends with a quick-check list for the user\n";

const NO_DATA_MSG =
    "[Outfit Advisor] I can recommend an outfit once I know the weather conditions. " +
    "Please ask the weather-forecast agent to get the forecast first, or use the " +
    "'prepare_for_day' skill for a complete morning briefing.";

interface OutfitAgentOpts {
    config?: Record<string, unknown>;
    reader: OrchidVectorReader;
    mcpClients?: unknown[] | null;
    chatModel?: ChatModelLike | null;
}

export class OutfitAdvisorAgent extends OrchidAgent {
    private config: Record<string, unknown>;

    constructor(opts: OutfitAgentOpts) {
        super({
            reader: opts.reader,
            mcpClients: opts.mcpClients ?? undefined,
            chatModel: opts.chatModel ?? undefined,
        });
        this.config = opts.config ?? {};
    }

    get name(): string {
        return "outfit-advisor";
    }

    get description(): string {
        return (
            "Outfit advisor. Recommends clothing, footwear, and accessories based on " +
            "weather conditions (temperature, precipitation, wind, UV). Uses weather " +
            "data from sibling agents and RAG clothing guides. Use after getting the " +
            "weather forecast."
        );
    }

    get ragNamespace(): string {
        return "clothing-guides";
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

        const weatherData = this.extractWeatherData(siblingData);

        if (!weatherData) {
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
        const ragData = await this.fetchRagContext(query, scope, this.ragNamespace, 3);

        const history = OrchidAgent.extractConversationHistory(state, {
            maxTurns: 10,
            maxChars: 1000,
        });

        const summary = await this.summarise(query, weatherData, ragDataToRecord(ragData), {
            systemPrompt: OUTFIT_PROMPT,
            conversationHistory: history.length > 0 ? history : undefined,
        });

        return {
            messages: [{ content: summary, role: "assistant", name: this.name }],
            mcpContext: { [this.name]: { outfit_recommendation: summary } },
            ragContext: { [this.name]: ragData },
        } as unknown as OrchidAgentState;
    }

    private extractWeatherData(siblingData: Record<string, unknown>): Record<string, unknown> | null {
        if (Object.keys(siblingData).length === 0) return null;

        const weatherInfo: Record<string, unknown> = {};

        for (const data of Object.values(siblingData)) {
            if (data === null || typeof data !== "object") continue;

            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item === null || typeof item !== "object") continue;
                const result = (item as Record<string, unknown>).result ?? item;
                if (result === null || typeof result !== "object") continue;

                const r = result as Record<string, unknown>;

                for (const key of ["temperature_c", "temperature", "temp_c", "current_temp"]) {
                    if (key in r) {
                        weatherInfo["temperature_c"] = r[key];
                        break;
                    }
                }
                for (const key of ["precipitation_chance", "precip_pct", "rain_chance", "precipitation_probability"]) {
                    if (key in r) {
                        weatherInfo["precipitation_chance"] = r[key];
                        break;
                    }
                }
                for (const key of ["wind_speed_kmh", "wind_speed", "wind_kmh"]) {
                    if (key in r) {
                        weatherInfo["wind_speed_kmh"] = r[key];
                        break;
                    }
                }
                for (const key of ["weather_condition", "condition", "weather_code", "summary"]) {
                    if (key in r) {
                        weatherInfo["condition"] = r[key];
                        break;
                    }
                }
                for (const key of ["uv_index", "uv"]) {
                    if (key in r) {
                        weatherInfo["uv_index"] = r[key];
                        break;
                    }
                }
                for (const key of ["humidity", "relative_humidity"]) {
                    if (key in r) {
                        weatherInfo["humidity"] = r[key];
                        break;
                    }
                }
                for (const key of ["forecast", "daily", "daily_forecast"]) {
                    if (key in r) {
                        weatherInfo["forecast"] = r[key];
                        break;
                    }
                }
                for (const key of ["city", "location", "location_name"]) {
                    if (key in r) {
                        weatherInfo["location"] = r[key];
                        break;
                    }
                }
            }
        }

        if (!("temperature_c" in weatherInfo) && !("forecast" in weatherInfo)) {
            return null;
        }
        return weatherInfo;
    }
}

function ragDataToRecord(
    ragData: { document: { pageContent: string; metadata: Record<string, unknown> }; score: number }[],
): Record<string, unknown> {
    return { chunks: ragData.map((d) => ({ content: d.document.pageContent, score: d.score })) };
}
