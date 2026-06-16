/**
 * Smoke-test driver for the MySQL chat storage skeleton.
 *
 * Steps:
 *   1. `npx tsc -p tsconfig.json` to emit `./dist/mysqlStorage.js`
 *   2. `npm start` — loads orchid.yml which references `./dist/mysqlStorage.js#MySQLChatStorage`
 *
 * The skeleton uses a no-op pool, so this script will succeed without a
 * real MySQL server. Replace the placeholder pool inside `mysqlStorage.ts`
 * with mysql2 to point at a live DB.
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
            message: 'Just verifying the storage wiring — say hi.',
            userId: 'tester',
            tenantId: 'demo',
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
