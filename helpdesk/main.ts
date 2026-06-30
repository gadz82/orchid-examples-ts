/**
 * Helpdesk multi-agent demo entry point (TypeScript port).
 *
 * Three agents: triage (ticket categorization), support (KB-based resolution),
 * escalation (critical routing). Demonstrates ticket lifecycle management.
 *
 * Usage:
 *     cd examples-ts/helpdesk
 *     npm install && npm start
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Orchid } from "@orchid-ai/orchid";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, "orchid.yml");

const QUERIES = [
    "I cannot login after resetting my password. Can you help?",
    "What is the status of ticket TK-1002?",
    "This is critical — our production API is returning 500 errors and users cannot enroll.",
] as const;

async function main(): Promise<void> {
    const client = await Orchid.fromConfigPath(CONFIG);
    try {
        let chatId = "";
        for (const message of QUERIES) {
            console.log(`\n>>> ${message}`);
            const result = await client.invoke({
                messages: [{ role: "user", content: message }],
                chatId,
                userId: "demo-user",
                tenantId: "helpdesk",
            } as any);
            chatId = result.chatId;
            console.log(`(${result.agentsUsed.join(" + ") || "direct"})`);
            console.log(result.response);
        }
    } finally {
        await client.close();
    }
}
main().catch((err) => { console.error(err); process.exit(1); });
