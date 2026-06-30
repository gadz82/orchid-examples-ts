/**
 * Education multi-agent demo entry point (TypeScript port).
 *
 * Mirrors the Python `examples/education` fleet: content analysis,
 * quiz generation, lesson planning, and multi-format exports.
 *
 * Usage:
 *     cd examples-ts/education
 *     npm install && npm start
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Orchid } from "@orchid-ai/orchid";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, "orchid.yml");

const QUERIES = [
    "Generate a beginner-level quiz about photosynthesis",
    "Create a 45-minute lesson plan on the American Revolution",
    "Build a full teaching package on cell biology",
] as const;

async function main(): Promise<void> {
    const client = await Orchid.fromConfigPath(CONFIG);
    try {
        let chatId: string | undefined;
        for (const message of QUERIES) {
            console.log(`\n>>> ${message}`);
            const result = await client.invoke({
                messages: [{ role: "human", content: message }],
                chatId,
                userId: "teacher",
                tenantId: "school",
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
