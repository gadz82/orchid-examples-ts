/**
 * PostgreSQL storage demo entry point (TypeScript port).
 *
 * Demonstrates chat persistence using PostgreSQL via @orchid-ai/orchid-storage-postgres.
 * Creates chats, stores messages, and verifies retrieval.
 *
 * Usage:
 *     cd examples-ts/postgres-storage
 *     npm install && npm start
 */
import { OrchidPostgresChatStorage } from "@orchid-ai/orchid-storage-postgres";

async function main(): Promise<void> {
  const pgUrl = process.env["DATABASE_URL"] || process.env["CHAT_DB_DSN"] || "postgresql://orchid:orchid@localhost:5432/orchid";

  console.log("Connecting to PostgreSQL:", pgUrl);

  const storage = new OrchidPostgresChatStorage({ dsn: pgUrl });
  await storage.initDb();

  try {
    // Create a chat session
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
  } finally {
    await storage.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
