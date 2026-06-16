/**
 * Education multi-agent demo entry point (TypeScript port).
 *
 * Three agents: quiz_master (quiz generation), curriculum_designer (lesson plans),
 * content_analyst (content analysis). Demonstrates educational AI use cases.
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
  "Analyze educational content with ID EDU-2024-001",
] as const;

async function main(): Promise<void> {
  const client = await Orchid.fromConfigPath(CONFIG);
  try {
    let chatId: string | undefined;
    for (const message of QUERIES) {
      console.log(`\n>>> ${message}`);
      const result = await client.invoke({ message, chatId, userId: "teacher", tenantId: "school" });
      chatId = result.chatId;
      console.log(`(${result.agentsUsed.join(" + ") || "direct"})`);
      console.log(result.response);
    }
  } finally {
    await client.close();
  }
}
main().catch((err) => { console.error(err); process.exit(1); });
