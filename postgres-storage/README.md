# PostgreSQL Storage Demo

Demonstrates the **PostgreSQL** plugin for production-grade persistence: chat storage, LangGraph checkpointer, and Qdrant RAG.

## What it does

Replaces the default SQLite backend with PostgreSQL for chat sessions, messages, and checkpoints. Shows how to wire the `@orchid-ai/storage-postgres` plugin, run migrations, and verify data in the database.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidPostgresChatStorage` | Async PostgreSQL connection pooling |
| PostgreSQL checkpointer | LangGraph state persistence across agent turns |
| Qdrant RAG | Vector search via the Qdrant plugin |
| `chat_storage_class: postgres` | YAML wiring for the plugin |
| Cross-agent skill | Echo + reverse routing |

## Example prompts

```
Hello, can you echo this message?
→ echo agent responds by repeating the message

Now reverse it.
→ reverse agent: calls reverse tool on the previous response

What did I say in my first message?
→ checkpointer preserves conversation state across turns
```

After running, verify persistence in PostgreSQL:

```sql
SELECT id, title, user_id, created_at FROM chat_sessions;
SELECT session_id, count(*) AS messages FROM chat_messages GROUP BY session_id;
SELECT count(*) FROM checkpoints;
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../orchid-storage-postgres-ts && npm install && npm run build
cd ../examples-ts/postgres-storage
npm install
npx tsc -p tsconfig.json

# Requires a running PostgreSQL instance
DATABASE_URL=postgres://user:pass@localhost:5432/orchid npm start
```

## Plugin dependencies

Install `@orchid-ai/storage-postgres` and `@orchid-ai/rag-qdrant` from npm (or link via `file:../..` in this monorepo).
