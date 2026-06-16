/**
 * Restaurant multi-agent demo entry point (TypeScript port).
 *
 * Three agents: menu (dish/category/recipe expert), orders (order tracking),
 * reviews (customer feedback analysis). Demonstrates GenericAgent with built-in
 * tools and cross-agent skills.
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
  "How do you make the Mushroom Risotto?",
  "Check order #ORD-1234 status",
  "What are people saying about the Grilled Ribeye Steak?",
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
        userId: "guest",
        tenantId: "restaurant",
      });
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
