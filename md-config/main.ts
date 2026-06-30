import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Orchid } from "@orchid-ai/orchid";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(HERE, "orchid.md");

async function main(): Promise<void> {
  const client = await Orchid.fromConfigPath(CONFIG);
  try {
    const result = await client.invoke({
      messages: [{
        role: "user",
        content: "Hello! Introduce yourself and tell me what you can help with.",
      }],
      chatId: "demo-chat",
      userId: "demo-user",
      tenantId: "demo",
    } as any);
    console.log("[" + ((result.agentsUsed ?? []).join(", ") || "direct") + "]");
    console.log(result.response);
  } finally {
    await client.close();
  }
}
main().catch((err) => { console.error(err); process.exit(1); });
