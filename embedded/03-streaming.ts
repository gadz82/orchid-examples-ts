/**
 * Token-level streaming.
 *
 * `client.stream(...)` yields `{type: 'token' | 'status' | 'done', data}`
 * events as the graph progresses. Render `token` events to the user;
 * use `status` for progress UI; `done` carries the final response and
 * `agentsUsed` array.
 *
 * Usage:
 *     cd examples-ts/embedded
 *     npm run streaming
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {Orchid} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, 'orchid.yml');

async function main(): Promise<void> {
    const client = await Orchid.fromConfigPath(CONFIG);

    try {
        process.stdout.write('Assistant: ');

        const stream = await client.stream({
            messages: [{role: 'user', content: 'Recommend two science books for a weekend read.'}],
            userId: 'carol',
            tenantId: 'acme',
        } as any);
        for await (const [type, data] of stream) {
            if (type === 'token') {
                process.stdout.write(String(data));
            } else if (type === 'done') {
                process.stdout.write('\n');
                const doneData = data as { agentsUsed?: string[] };
                console.log(`(agents used: ${JSON.stringify(doneData.agentsUsed ?? [])})`);
            }
        }
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
