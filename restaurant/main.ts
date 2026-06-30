/**
 * Restaurant multi-agent demo entry point (TypeScript port).
 *
 * Three agents: menu (dish/category expert), orders (order tracking and billing),
 * reviews (customer feedback analysis with custom OrchidAgent subclass).
 * Demonstrates GenericAgent with built-in tools, custom agent classes,
 * cross-agent skills, and RAG-backed review analysis.
 *
 * Usage:
 *     cd examples-ts/restaurant
 *     npm install
 *     npm start
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { Orchid } from "@orchid-ai/orchid";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, "orchid.yml");

const QUERIES = [
    "What's on the menu today?",
    "What vegetarian options do you have?",
    "Place an order for Margherita Pizza and Tiramisu for table 5",
    "Check status of ORD-001",
    "The truffle risotto was delicious but the service was terribly slow.",
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
                userId: "guest",
                tenantId: "restaurant",
            } as any);
            chatId = result.chatId;
            console.log(`(${result.agentsUsed.join(" + ") || "direct"})`);
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
