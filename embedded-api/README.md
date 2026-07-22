# Embedded API — call Orchid from your own Fastify app

This example shows the **opposite direction** of `examples-ts/api-extensions/`: instead of adding custom endpoints to orchid-api's built-in Fastify instance, you keep YOUR existing app and import the framework library directly to add an AI chat endpoint.

## What it does

Takes an existing Fastify app with product catalog routes and adds an AI chat endpoint. The `Orchid` handle is built once at startup, reused across requests, and closed on shutdown. Demonstrates how to add AI capabilities to any Node.js HTTP server with minimal code.

## What it uses

| Feature | Usage |
|---------|-------|
| `Orchid.fromConfigPath()` | Build handle once, reuse across requests |
| `client.invoke()` | AI chat from Fastify route handler |
| Fastify lifecycle | `onClose` hook for clean shutdown |
| Shared port | AI routes live alongside existing routes |
| Custom auth | Read Bearer token → pass as `accessToken` to `invoke()` |

## When to use

- You already have a Fastify (or Express, or Koa, …) app with your own routes, middleware, and lifespan, and want to add an AI chat layer
- A single-process / single-deployment is preferable to running the full orchid-api as a sibling service
- You only need a thin chat slice — not the full orchid-api REST surface (chats CRUD, sharing, MCP gateway, indexing, …)

If you DO need the full REST surface, see `examples-ts/api-extensions/` which keeps every orchid-api endpoint and lets you append your own routes to the same Fastify instance.

## Example prompts

```
AI chat:             curl -X POST http://localhost:8000/ai/ask \
                       -H 'Content-Type: application/json' \
                       -d '{"message": "Recommend a science book."}'
                     → client.invoke() → response

Multi-turn:          curl -X POST http://localhost:8000/ai/ask \
                       -d '{"message": "Tell me more", "chatId": "<id>"}'
                     → same chatId: history auto-loaded

Existing routes:     curl http://localhost:8000/products
                     curl http://localhost:8000/healthz
                     → your app's routes still work alongside AI
```

## How it works

The Node.js ecosystem pattern is to import the framework library directly and call `client.invoke()` from your custom route — no separate orchid-api process needed.

`@orchid-ai/orchid` exports the `Orchid` facade which handles the full lifecycle:

```ts
import {Orchid} from '@orchid-ai/orchid';

const orchid = await Orchid.fromConfigPath('orchid.yml');
// reuse `orchid` across requests, close on shutdown
```

`Orchid.fromConfigPath()` loads the config, builds the graph, initialises storage, the reader, the MCP token store, and the optional checkpointer.

## What's in this example

| File | Role |
|------|------|
| `main.ts` | Builds a Fastify app with both existing routes (`/products`, `/healthz`) AND an `/ai/ask` chat endpoint |
| `agents.yaml` | Trivial single-agent config (focus is on integration, not topology) |
| `orchid.yml` | SQLite chat storage, Ollama default model |

### Example code

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

## Running

```bash
# From the orchid repo root, build the framework once:
cd orchid-ts
npm install
npm run build

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

## What you can customise

- **Route prefix** — use any path (e.g. `/v1/ai`, `/agents`, or no prefix at all)
- **Which framework features** — use only what you need: `client.invoke()` for simple Q&A, `client.stream()` for SSE, `client.resume()` for HITL
- **Middleware, CORS** — use your own; the framework doesn't impose any on your app
- **Auth** — read a Bearer token from the request and pass it as `accessToken` to `client.invoke()` for MCP passthrough; or build an `OrchidAuthContext` and pass it as `auth`

## Things this pattern does NOT give you

- File upload + parse-once ingestion (`POST /chats/{id}/messages` multipart handler)
- SSE streaming endpoint — you'd wire `client.stream()` yourself
- HITL resume endpoints — you'd wire `client.resume()` yourself
- Chat sharing, MCP gateway state, MCP per-server OAuth callback, admin endpoints, diagnostics

If you need any of those, use `examples-ts/api-extensions/` to keep the full orchid-api surface and add your routes alongside.

## Caveats

- `Orchid` is a singleton handle — only one instance per process. That is fine for embedding but means you cannot run two differently-configured orchids in the same Node.js process.
- `Orchid.fromConfigPath()` must complete before any AI route is called. Always await it at app startup, never inline in a request handler.
