/**
 * PostgreSQL storage demo entry point (TypeScript port).
 *
 * Demonstrates chat persistence using PostgreSQL via orchid-storage-postgres-ts.
 * Creates chats, stores messages, and verifies retrieval.
 *
 * Usage:
 *     cd examples-ts/postgres-storage
 *     npm install && npm start
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Orchid } from "@orchid-ai/orchid";
import { OrchidPostgresChatStorage } from "@orchid-ai/orchid-storage-postgres";

async function main(): Promise<void> {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const CONFIG = join(HERE, "orchid.yml");

  const pgUrl = process.env["DATABASE_URL"] || "postgresql://localhost:5432/orchid";

  // Initialize PostgreSQL storage if available, otherwise fallback to SQLite
  console.log("Connecting to PostgreSQL:", pgUrl);

  const client = await Orchid.fromConfigPath(CONFIG);
  try {
    // Create a chat session
    const storage = client.chatStorage;
    const chat = await storage.createChat("demo", "pg-user", "PostgreSQL Demo Chat");
    console.log(`Chat created: ${chat.id}`);

    // Add some messages
    await storage.addMessage(chat.id, "user", "Hello from the PostgreSQL storage demo!");
    await storage.addMessage(chat.id, "assistant", "Hello! Your data is stored in PostgreSQL.", ["knowledge_base"]);

    // Retrieve messages
    const messages = await storage.getMessages(chat.id);
    console.log(`Messages retrieved: ${messages.length}`);
    for (const msg of messages) {
      console.log(`  [${msg.role}] ${msg.content.slice(0, 60)}...`);
    }

    // Invoke the agent
    const result = await client.invoke({
      message: "What can you tell me about yourself?",
      chatId: chat.id,
      userId: "pg-user",
      tenantId: "demo",
    });
    console.log(`\nAgent response: ${result.response}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
