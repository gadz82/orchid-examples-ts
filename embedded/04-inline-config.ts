/**
 * Configuration built entirely in TypeScript — no orchid.yml, no agents.yaml.
 *
 * This is the "purest" embedded form: agents, prompts and tools are assembled
 * as plain objects, and `Orchid.fromObject` constructs the framework around
 * them. No persistence is configured, so the caller passes `persist: false`
 * (or supplies an explicit `chatStorage` via OrchidFromConfigOptions).
 *
 * When to use this shape:
 *   - Generating agents dynamically (one per tenant, A/B bucket, feature flag).
 *   - Embedding Orchid in a larger app where config lives in a database.
 *   - Test fixtures — spin up a graph with exactly the agents the test needs.
 *
 * Usage:
 *     cd examples-ts/embedded
 *     npm run inline
 */

import {Orchid, registerTool} from '@orchid-ai/orchid';

// ── 1. In-process tool handler ──────────────────────────────────

interface WeatherArgs {
    city?: string;
}

function lookupWeather(args: Record<string, unknown>): string {
    const city = String((args as WeatherArgs).city ?? '').toLowerCase();
    const table: Record<string, string> = {
        paris: '19°C, cloudy',
        tokyo: '26°C, humid',
        nyc: '21°C, partly sunny',
    };
    return table[city] ?? `No data for ${JSON.stringify(city)}.`;
}

// Register before fromObject() so any agent that lists this tool by name
// can resolve it. No module path needed — the handler is captured here.
registerTool('weather', lookupWeather, 'Current conditions for a city.', {
    city: {
        name: 'city',
        type: 'string',
        description: 'City name (paris, tokyo, nyc).',
        required: true,
        default: '',
    },
});

// ── 2. Agents config built as plain objects ────────────────────

const config = {
    version: '1',
    defaults: {
        llm: {model: 'ollama/llama3.2', temperature: 0.1},
        rag: {enabled: false},
    },
    agents: {
        weatherman: {
            description: "Answers questions about today's weather.",
            prompt:
                'You are a concise weather assistant. ' +
                'Use the `weather` tool for any city the user asks about.',
            rag: {enabled: false},
            tools: ['weather'],
        },
    },
};

// ── 3. Invoke ──────────────────────────────────────────────────

async function main(): Promise<void> {
    const client = await Orchid.fromObject(config, {defaultModel: 'ollama/llama3.2'});

    try {
        const result = await client.invoke({
            message: "What's the weather in Tokyo right now?",
            userId: 'finn',
            tenantId: 'demo',
            persist: false,
        });
        console.log(result.response);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
