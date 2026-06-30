/**
 * Configuration built entirely in TypeScript — no orchid.yml, no agents.yaml.
 *
 * This is the "purest" embedded form: agents, prompts and tools are assembled
 * as plain objects, and `Orchid.fromConfig` constructs the framework around
 * them. No persistence is configured, so the caller passes `persist: false`.
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

import {Orchid} from '@orchid-ai/orchid';

// ── 1. Agents config built as plain objects ────────────────────

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
            tools: [
                {
                    name: 'weather',
                    handler: './tools/weather.ts#lookupWeather',
                    description: 'Current conditions for a city.',
                    parameters: {
                        city: {
                            type: 'string',
                            description: 'City name (paris, tokyo, nyc).',
                            required: true,
                        },
                    },
                },
            ],
        },
    },
};

// ── 2. Invoke ──────────────────────────────────────────────────

async function main(): Promise<void> {
    const client = await Orchid.fromConfig(config, {defaultModel: 'ollama/llama3.2'});

    try {
        const result = await client.invoke({
            messages: [{role: 'user', content: "What's the weather in Tokyo right now?"}],
            userId: 'finn',
            tenantId: 'demo',
            persist: false,
        } as any);
        console.log(result.response);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
