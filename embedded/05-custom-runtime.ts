/**
 * Lower-level usage: build your own `OrchidRuntime` and inject it.
 *
 * Use this shape when you need to override defaults the `fromConfigPath`
 * factory hides — e.g. a pre-configured ChatOpenAI with custom retry rules,
 * a specific Qdrant client, or a custom MCP client factory.
 *
 * Construction here uses `Orchid.fromConfig(config, {chatModel, ...})`
 * because the runtime knobs (chatModel, reader, mcpClientFactory) are
 * exposed as `OrchidFromConfigOptions` — Orchid wires them into the
 * runtime internally.
 *
 * Usage:
 *     cd examples-ts/embedded
 *     npm run custom-runtime
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {Orchid, loadConfig} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, 'agents.yaml');

async function main(): Promise<void> {
    const config = await loadConfig(CONFIG);

    // Build a chat model however you like — the example uses the framework
    // factory, but any LangChain BaseChatModel works (pass it directly).
    //
    // Example:
    //   import {ChatOpenAI} from '@langchain/openai';
    //   const chatModel = new ChatOpenAI({model: 'gpt-4o-mini', temperature: 0.1});
    //
    // Here we leave chatModel unset and let the default factory build one
    // from defaultModel — the goal of this script is to show *how* to inject.

    const client = await Orchid.fromConfig(config, {
        defaultModel: 'ollama/llama3.2',
        // chatModel,                    // ← inject your own here
        // reader: myQdrantReader,       // ← inject a vector reader here
        // mcpClientFactory: cfg => …,   // ← inject custom MCP transports
    });

    try {
        const result = await client.invoke({
            message: 'Recommend a curiosity-driven non-fiction book.',
            userId: 'erin',
            tenantId: 'acme',
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
