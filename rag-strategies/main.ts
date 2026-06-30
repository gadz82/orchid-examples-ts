import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Orchid } from "@orchid-ai/orchid";
import { registerRetrievalStrategy } from "@orchid-ai/orchid/rag";
import { bootstrapRagStrategies, RecencySimpleRetrieval } from "./hooks/startup.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, "orchid.yml");

async function main(): Promise<void> {
  // Register the custom strategy before the graph is built so the
  // `recency_searcher` agent can use it.
  registerRetrievalStrategy("recency_simple", RecencySimpleRetrieval);

  const client = await Orchid.fromConfigPath(CONFIG);
  try {
    await bootstrapRagStrategies(client);
    const result = await client.invoke({
      messages: [{ role: "user", content: "Hello! Introduce yourself and tell me what you can help with." }],
      chatId: "demo-chat",
    } as any);
    console.log("[" + (result.agentsUsed.join(", ") || "direct") + "]");
    console.log(result.response);
  } finally {
    await client.close();
  }
}
main().catch((err) => { console.error(err); process.exit(1); });
