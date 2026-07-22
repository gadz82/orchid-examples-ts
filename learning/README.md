# Learning Example — Cron-Driven Fan-Out

A personalized weekly learning digest system demonstrating **Pollen + Bloom** scheduled triggers: a custom `WeeklyDigestFanoutProducer` enumerates active learners at cron time and emits one signal per `(tenant, user)`, each triggering a Bloom run that generates a personalized digest under the `addressed_to` identity flavour.

## What it does

The custom `WeeklyDigestFanoutProducer` enumerates active learners across tenants and emits one `weekly-digest.due` signal per learner. Each signal triggers a Bloom run that generates a personalized learning digest. All runs execute in parallel but are isolated per user via the `addressed_to` identity and default `addressed` visibility.

## What it uses

| Feature | Usage |
|---------|-------|
| Custom producer | `WeeklyDigestFanoutProducer` enumerates learners, emits signals |
| `addressed_to` identity | Each Bloom runs scoped to a specific user |
| Default visibility `addressed` | Each user sees only their own digest |
| In-memory queue | Signal queue with visibility timeout |
| Async-pool processor | Concurrent signal processing |
| Retry policy | Exponential backoff on failure |

## Example prompts

The system runs automatically via the producer — no direct user prompts. Output per user:

```
Your Weekly Learning Digest — Week 23

Topics covered this week:
- Advanced RAG strategies (multi-query, HyDE)
- MCP OAuth flow with DCR
- LangGraph checkpointer patterns

Recommended next topics:
- GraphRAG retrieval
- Pollen + Bloom event producers

Progress: 45% through Module 3
```

Manual signal emission (bypass producer):

```bash
curl -X POST http://localhost:8000/signals \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weekly-digest.due",
    "tenant_key": "learning-demo",
    "user_id": "u-alice",
    "payload": {"week_iso": 23, "year": 2026}
  }'
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/learning
npm install
npm test          # run producer unit tests
npm start         # run the example
```

Requires: Node.js 20+, Ollama with `llama3.2`.

## Files

```
examples-ts/learning/
├── orchid.yml                        # Runtime config (SQLite storage)
├── agents.yaml                       # Agent + events configuration
├── producers/
│   └── weeklyDigest.ts               # Custom signal producer (fan-out logic)
├── tests/
│   └── weeklyDigest.test.ts          # Producer unit tests
├── main.ts                           # Sample driver
├── vitest.config.ts                  # Test configuration
├── Dockerfile
├── docker-compose.yml
└── package.json
```
