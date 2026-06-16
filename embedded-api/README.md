# Embedded API — call Orchid from your own Fastify app

The TypeScript-native way to embed Orchid into an existing HTTP server is to
import the `@orchid-ai/orchid` framework library directly and call
`client.invoke()` from your custom routes — no separate orchid-api process.

## When to use

- You already have a Fastify (or Express, or Koa, …) app with your own routes,
  middleware and lifespan, and want to add an AI chat endpoint.
- A single-process / single-deployment is preferable to running the full
  orchid-api as a sibling service.
- You only need a thin chat slice — not the full orchid-api REST surface
  (chats CRUD, sharing, MCP gateway, indexing, …).

If you DO need the full REST surface, see [`../api-extensions/`](../api-extensions/)
which keeps every orchid-api endpoint and lets you append your own routes
to the same Fastify instance.

## What's in this example

| File | Role |
|---|---|
| `main.ts` | Builds a Fastify app with both a `/products` route AND `/ai/ask` |
| `agents.yaml` | Trivial single-agent config (focus is on integration, not topology) |
| `orchid.yml` | SQLite chat storage, Ollama default model |

## Running

```bash
# From the orchid repo root, build the framework once:
cd orchid-ts && npm install && npm run build

cd ../examples-ts/embedded-api
npm install
npm start                   # listens on :8000
```

In another terminal:

```bash
# Existing app routes:
curl http://localhost:8000/healthz
curl http://localhost:8000/products

# AI chat (keep `chatId` from one response and pass it back to continue):
curl -X POST http://localhost:8000/ai/ask \
     -H 'Content-Type: application/json' \
     -d '{"message": "Recommend a science book."}'
```

## The pattern

```ts
import Fastify from 'fastify';
import {Orchid} from '@orchid-ai/orchid';

const app = Fastify();

// 1. Build the Orchid handle once, reuse on every request:
const orchid = await Orchid.fromConfigPath('orchid.yml');
app.addHook('onClose', async () => { await orchid.close(); });

// 2. Add your own routes:
app.get('/products', /* … */);

// 3. Add an AI route that calls into Orchid:
app.post('/ai/ask', async (req) => {
    const result = await orchid.invoke({
        message: req.body.message,
        chatId: req.body.chatId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
    });
    return result;
});

await app.listen({port: 8000});
```

## Things this pattern does NOT give you

- File upload + parse-once ingestion (`POST /chats/{id}/messages` multipart
  handler in orchid-api).
- HITL resume endpoints (`POST /chats/{id}/resume`).
- SSE streaming endpoint (`POST /chats/{id}/messages/stream`).
- Chat sharing, MCP gateway state, MCP per-server OAuth callback, …

If you need any of those, either:

- Use [`../api-extensions/`](../api-extensions/) to keep the orchid-api surface
  and add your routes alongside, **or**
- Reach into the framework directly — `client.stream()` for streaming,
  `client.resume()` for HITL — and assemble the HTTP shape yourself.
