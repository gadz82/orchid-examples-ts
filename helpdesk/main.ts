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
  "Look up ticket TKT-001 and check its SLA status",
  "I forgot my password and can't log in. Search the knowledge base for help.",
  "Ticket TKT-003 is critical — escalate to infrastructure team immediately",
] as const;

async function main(): Promise<void> {
  const client = await Orchid.fromConfigPath(CONFIG);
  try {
    let chatId: string | undefined;
    for (const message of QUERIES) {
      console.log(`\n>>> ${message}`);
      const result = await client.invoke({ message, chatId, userId: "agent", tenantId: "helpdesk" });
      chatId = result.chatId;
      console.log(`(${result.agentsUsed.join(" + ") || "direct"})`);
      console.log(result.response);
    }
  } finally {
    await client.close();
  }
}
main().catch((err) => { console.error(err); process.exit(1); });
