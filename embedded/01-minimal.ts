/**
 * Minimal invocation — one request, one response.
 *
 * Usage:
 *     cd examples-ts/embedded
 *     npm run minimal
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {Orchid} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, 'orchid.yml');

async function main(): Promise<void> {
    const client = await Orchid.fromConfigPath(CONFIG);
    try {
        const result = await client.invoke({
            messages: [{role: 'user', content: 'Tell me about The Pragmatic Programmer.'}],
            userId: 'alice',
            tenantId: 'acme',
        } as any);

        console.log('─── Response ' + '─'.repeat(48));
        console.log(result.response);
        console.log('─'.repeat(60));
        console.log(`chatId      = ${result.chatId}`);
        console.log(`agentsUsed  = ${JSON.stringify(result.agentsUsed)}`);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
