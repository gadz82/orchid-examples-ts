# Learning Example — Cron-Driven Fan-Out

A personalized weekly learning digest system demonstrating **Pollen + Bloom** scheduled triggers: a single cron tick fans out into parallel Bloom runs, one per active learner, each generating a personalized digest under the `addressed_to_user` identity.

## What it does

A cron schedule fires every Monday at 06:00 UTC. A custom `WeeklyDigestFanoutProducer` enumerates active learners and emits one signal per learner. Each signal triggers a Bloom run that generates a personalized learning digest — all runs execute in parallel but are isolated per user.

## What it uses

| Feature | Usage |
|---------|-------|
| APScheduler cron | Weekly trigger at Monday 06:00 UTC |
| Custom producer | `WeeklyDigestFanoutProducer` enumerates learners, emits signals |
| `addressed_to_user` identity | Service account acts on behalf of each learner |
| `parallelism: per_user` | Isolated parallel execution per learner |
| Visibility filtering | Each user sees only their own digest (404 for others) |
| SQLite event storage | Persistent signal/queue/store |

## Example prompts

The system runs automatically via cron — no direct user prompts. Output per user:

```
Your Weekly Learning Digest — Week 23

Topics covered this week:
• Advanced RAG strategies (multi-query, HyDE)
• MCP OAuth flow with DCR
• LangGraph checkpointer patterns

Recommended next topics:
• GraphRAG retrieval
• Pollen + Bloom event producers

Progress: 45% through Module 3
```

Manual signal emission (bypass cron):

```bash
curl -X POST http://localhost:8000/signals \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weekly-digest.due",
    "tenant_key": "demo-tenant",
    "user_id": "alice@example.com",
    "payload": {"learner_id": "alice", "week": 23}
  }'
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/learning
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2`.

## Files

```
examples-ts/learning/
├── orchid.yml              # Runtime config (SQLite, scheduler)
├── agents.yaml             # Agent + events configuration
├── producers/              # Custom signal producer (fan-out logic)
└── main.ts                 # Sample driver
```
