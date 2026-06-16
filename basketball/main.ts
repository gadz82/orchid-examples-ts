/**
 * Basketball multi-agent demo entry point.
 *
 * Loads orchid.yml, builds the graph (two GenericAgents + supervisor) and
 * sends a few sample queries that exercise:
 *   - the basketball agent's tool-calling
 *   - the psychologist agent's tool-calling
 *   - the cross-agent skill `player_performance_review`
 *
 * Usage:
 *     cd examples-ts/basketball
 *     npm install
 *     npm start
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {Orchid} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, 'orchid.yml');

const QUERIES = [
    "What are LeBron James' current stats?",
    'Compare Stephen Curry and Luka Doncic.',
    'Run a player_performance_review on Giannis Antetokounmpo.',
    'My shooting confidence is gone — any advice?',
] as const;

async function main(): Promise<void> {
    const client = await Orchid.fromConfigPath(CONFIG);

    try {
        let chatId: string | undefined;
        for (const message of QUERIES) {
            console.log(`\n>>> ${message}`);
            const result = await client.invoke({
                message,
                chatId,
                userId: 'coach',
                tenantId: 'demo',
            });
            chatId = result.chatId;
            console.log(`(${result.agentsUsed.join(' + ') || 'direct'})`);
            console.log(result.response);
        }
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
