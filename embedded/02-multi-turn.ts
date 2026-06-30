/**
 * Multi-turn conversation reusing a chatId.
 *
 * Because `persist: true` is the default and chat storage is auto-configured
 * from orchid.yml, subsequent calls with the same `chatId` pick up the prior
 * history from SQLite automatically.
 *
 * Usage:
 *     cd examples-ts/embedded
 *     npm run multi-turn
 */

import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {Orchid} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, 'orchid.yml');

async function main(): Promise<void> {
    const chatId = randomUUID();
    const client = await Orchid.fromConfigPath(CONFIG);

    try {
        const turn1 = await client.invoke({
            messages: [{role: 'user', content: 'Do you have anything by Martin Kleppmann?'}],
            chatId,
            userId: 'bob',
            tenantId: 'acme',
        } as any);
        console.log(`Turn 1: ${turn1.response}\n`);

        const turn2 = await client.invoke({
            messages: [{role: 'user', content: 'What year was that published?'}],
            chatId,                       // same chat — history auto-loaded
            userId: 'bob',
            tenantId: 'acme',
        } as any);
        console.log(`Turn 2: ${turn2.response}\n`);

        const turn3 = await client.invoke({
            messages: [{role: 'user', content: 'Recommend something similar.'}],
            chatId,
            userId: 'bob',
            tenantId: 'acme',
        } as any);
        console.log(`Turn 3: ${turn3.response}\n`);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
