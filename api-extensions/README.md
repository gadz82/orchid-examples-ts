# API Extensions — custom Fastify routes on orchid-api

Keep every built-in orchid-api endpoint AND add your own routes to the same Fastify instance. Useful when you want a single deployment with both the AI surface and your own domain endpoints.

## What it does

Takes the full `@orchid-ai/orchid-api` Fastify instance returned by `buildApp()` and adds custom routes, hooks, and plugins before calling `listen()`. The built-in endpoints (`/health`, `/chats`, `/chats/{id}/messages`, etc.) remain fully functional alongside custom routes.

## What it uses

| Feature | Usage |
|---------|-------|
| `buildApp()` | Returns fully-configured Fastify instance |
| `getSettings()` | Loads env/YAML settings |
| Fastify route registration | `app.get()`, `app.post()` after `buildApp()` |
| Fastify hooks | `app.addHook('onRequest', ...)` for global logging/auth |
| `getAuthContext()` | Resolve Bearer token → `OrchidAuthContext` in custom handlers |
| Shared CORS + auth | Built-in orchid-api middleware applies globally |

## When to use

- You need the full orchid-api REST surface (chats CRUD, multipart upload, SSE streaming, HITL resume, MCP gateway, per-server OAuth, …) AND your own routes
- You want one process, one port, one deployment
- You need shared request-level hooks (auth, logging, rate-limit) between both groups

If you only need a thin chat slice, see `examples-ts/embedded-api/` — it skips orchid-api entirely and calls `Orchid.invoke()` directly from your own Fastify app.

## Example prompts

```
Built-in endpoints:  curl http://localhost:8000/health
                     curl http://localhost:8000/chats \
                       -H 'Authorization: Bearer dev-token'
                     curl http://localhost:8000/chats/{id}/messages \
                       -H 'Authorization: Bearer dev-token'

Custom endpoints:    curl http://localhost:8000/custom/ping
                     curl http://localhost:8000/custom/orders
                     curl http://localhost:8000/custom/orders/42

Access framework:    curl http://localhost:8000/custom/stats
                     → uses getAuthContext() to resolve user identity
```

## How it works

`@orchid-ai/orchid-api` exports `buildApp()` which returns a fully-configured Fastify instance. The instance is open for extension — register additional routes, hooks, or plugins before calling `listen()` and they'll live alongside every built-in orchid-api endpoint.

```ts
import {buildApp, getSettings} from '@orchid-ai/orchid-api';

const settings = getSettings();
const app = await buildApp({settings});

// Your custom routes — registered BEFORE listen():
app.get('/custom/ping', async () => ({pong: true}));

await app.listen({port: settings.port, host: settings.host});
```

## What's in this example

| File | Role |
|------|------|
| `main.ts` | Calls `buildApp({settings})`, registers `/custom/*` routes, then `listen()` |
| `agents.yaml` | Trivial single-agent config |
| `orchid.yml` | SQLite chat storage, `dev_auth_bypass: true` so the example is hittable without real auth |

The custom endpoints in this example:

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/custom/ping` | Health-style check |
| `GET`  | `/custom/orders` | List all orders |
| `GET`  | `/custom/orders/:id` | Get order by ID |

All built-in orchid-api endpoints remain available at their standard paths (`/health`, `/chats`, `/chats/{id}/messages`, …).

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

# Your custom endpoints:
curl http://localhost:8000/custom/ping
curl http://localhost:8000/custom/orders
curl http://localhost:8000/custom/orders/42
```

## How custom routes access orchid-api internals

In the TS port, custom routes registered after `buildApp()` share the same Fastify instance and can access framework internals via the `@orchid-ai/orchid-api` exports:

```ts
import {getAuthContext} from '@orchid-ai/orchid-api';

app.get('/custom/stats', async (req) => {
    const auth = await getAuthContext(req);      // Bearer token → OrchidAuthContext
    // Access the chat repo, reader, etc. through the Orchid handle...
    return {userId: auth.userId};
});
```

## Design notes

- **Run order matters.** All `app.get()`, `app.post()`, `app.register()` calls must happen before `listen()`. After listen, Fastify rejects further registrations.
- **Hooks are global by default.** `app.addHook('onRequest', …)` fires for every request, including built-in orchid-api routes. Scope hooks via `app.register(plugin, {prefix: '/custom'})` to apply them only to your routes.
- **CORS is set globally inside `buildApp`.** Adjust via the `corsAllowedOrigins` setting (env var `CORS_ALLOWED_ORIGINS`); don't re-register `@fastify/cors`.
- **Auth applies to your routes too if you opt in.** Use the exported `getAuthContext()` to resolve `OrchidAuthContext` from the request's Bearer token inside your custom handlers.
- **No entry-point plugin system** (unlike Python's `[project.entry-points."orchid_api.routers"]`). In the TS port, routes are always registered imperatively after `buildApp()`.
