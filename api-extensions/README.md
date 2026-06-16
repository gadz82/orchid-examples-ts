# API Extensions — extend orchid-api with your own routes

Keep every built-in orchid-api endpoint AND add your own routes to the same
Fastify instance. Useful when you want a single deployment but need both
the AI surface and your own domain endpoints.

## When to use

- You need the full orchid-api REST surface (chats CRUD, multipart upload,
  SSE streaming, HITL resume, MCP gateway, …) AND your own routes.
- You want one process, one port, one deployment.
- You need request-level hooks (auth, logging, rate-limit) shared between
  both groups.

If you only need a thin chat slice, see [`../embedded-api/`](../embedded-api/) — it
skips orchid-api entirely.

## What's in this example

| File | Role |
|---|---|
| `main.ts` | Calls `buildApp({settings})`, then registers `/custom/*` routes before `listen()` |
| `agents.yaml` | Trivial single-agent config |
| `orchid.yml` | SQLite chat storage, `dev_auth_bypass: true` so the example is hittable |

## Running

```bash
# From the orchid repo root, build both packages once:
cd orchid-ts && npm install && npm run build
cd ../orchid-api-ts && npm install && npm run build

cd ../examples-ts/api-extensions
npm install
npm start                    # listens on :8000
```

In another terminal:

```bash
# Built-in orchid-api endpoints (Bearer dev-token works because dev_auth_bypass=true):
curl http://localhost:8000/health
curl http://localhost:8000/chats -H 'Authorization: Bearer dev-token'

# Your custom endpoints (no auth required because we didn't gate them):
curl http://localhost:8000/custom/ping
curl http://localhost:8000/custom/orders
curl http://localhost:8000/custom/orders/42
```

## The pattern

```ts
import {buildApp, getSettings} from '@orchid-ai/orchid-api';

const settings = getSettings();
const app = await buildApp({settings});

// 1. Custom routes — registered BEFORE listen() so Fastify wires them in.
app.get('/custom/ping', async () => ({pong: true}));

// 2. Custom plugins / hooks work too.
app.addHook('onRequest', async (req) => req.log.info({path: req.url}, 'hit'));

// 3. Listen.
await app.listen({port: settings.port, host: settings.host});
```

## Design notes

- **Run order matters.** All `app.get(...)`, `app.post(...)`, `app.register(...)`
  calls must happen before `listen()`. After listen, Fastify rejects further
  registrations.
- **Hooks are global by default.** `app.addHook('onRequest', …)` fires for
  every request, including built-in orchid-api routes. Scope hooks via
  `app.register(plugin, {prefix: '/custom'})` if you want them to apply to
  only your routes.
- **CORS is set globally inside `buildApp`.** Adjust via the `corsAllowedOrigins`
  setting (env var `CORS_ALLOWED_ORIGINS`); don't re-register `@fastify/cors`.
- **Auth applies to your routes too if you opt in.** Use the exported
  `getAuthContext` (from `@orchid-ai/orchid-api`) inside your handlers to
  get an `OrchidAuthContext` resolved from the request's Bearer token.
