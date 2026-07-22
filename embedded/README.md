# Embedded — calling Orchid from any Node.js code

Use **`Orchid`** when you want to invoke the agent graph directly from a script, an Express/Fastify route, a queue worker, or a notebook — no API HTTP, no CLI. The client owns the full lifecycle: loads `orchid.yml`, builds the reader, chat storage, MCP token store, optional checkpointer, and compiled graph.

## What it does

Five focused scripts showing every way to use `Orchid`: one-shot invoke, multi-turn conversations (same `chatId` auto-loads history), token-level streaming, fully inline config (no YAML files), and injecting custom runtime dependencies.

## What it uses

| Feature | Usage |
|---------|-------|
| `Orchid.fromConfigPath()` | Load config + build graph from YAML |
| `Orchid.fromObject()` | Build graph from plain TS objects (no YAML) |
| `client.invoke()` | Single-turn and multi-turn invocation |
| `client.stream()` | Token-level SSE-style streaming |
| `client.resume()` | HITL approval resume |
| `LiteLLM` integration | Pluggable chat model |
| Built-in tools | YAML-declared with `<modulePath>#<ExportName>` |
| SQLite persistence | Auto-created on first run |

## Files

| File | What it shows |
|------|---------------|
| `orchid.yml` | Shared config — points at the librarian agent + SQLite chat storage |
| `agents.yaml` | One generic *librarian* agent + two built-in tools |
| `tools.ts` | The two built-in tool handlers (`lookupBook`, `recommendBooks`) |
| `01-minimal.ts` | One request, one response |
| `02-multi-turn.ts` | Same `chatId` across turns — history auto-loaded |
| `03-streaming.ts` | Token-level streaming via `client.stream(...)` |
| `04-inline-config.ts` | Build agents + tools entirely in TypeScript (no YAML) |
| `05-custom-runtime.ts` | Inject your own chat model / reader / MCP factory |

## Running

```bash
# From the orchid repo root, build the framework first:
cd orchid-ts
npm install
npm run build

# Then in this folder:
cd ../examples-ts/embedded
npm install
npm run minimal
npm run multi-turn
npm run streaming
npm run inline
npm run custom-runtime
```

The default LLM target is `ollama/llama3.2` on `http://localhost:11434`. Switch to OpenAI / Anthropic / Gemini by changing `default_model` in `orchid.yml` (or `defaultModel` in the inline-config example) and exporting the relevant API key.

## Example prompts

Each script in this folder showcases a different usage pattern:

```
01-minimal.ts:    "Recommend a science book."
                  → one-shot invoke, returns response

02-multi-turn.ts: "Recommend a science book." → "Tell me more."
                  → same chatId: history auto-loaded from persistence

03-streaming.ts:  "Explain RAG in simple terms."
                  → process.stdout.write for each token

04-inline-config.ts: "What's the weather in Tokyo?"
                     → agents built from plain TS objects, no YAML

05-custom-runtime.ts: "Tell me a fun fact."
                     → inject custom chat model + reader
```

## The public surface

```ts
import {Orchid, type OrchidInvokeResult} from '@orchid-ai/orchid';
```

### Construction

```ts
// Highest-level — loads everything from orchid.yml and owns resources:
const client = await Orchid.fromConfigPath('orchid.yml');
try { /* … */ } finally { await client.close(); }

// From a parsed config (e.g. loaded from a database):
const client2 = await Orchid.fromConfig(config, {chatModel, reader});

// Programmatic — agents config built as a plain object:
const client3 = await Orchid.fromObject({version: '1', agents: {…}});
```

### Invocation

```ts
const result: OrchidInvokeResult = await client.invoke({
    message: 'Hello',
    chatId: '…',             // reuse to continue a conversation (history auto-loaded)
    userId: 'alice',
    tenantId: 'acme',
    accessToken: '…',        // forwarded to MCP servers (passthrough mode)
    auth: orchidAuthContext, // or pass a fully-formed OrchidAuthContext
    history: [{role: 'user', content: 'earlier turn'}], // explicit history (skips persistence lookup)
    persist: true,           // save user+assistant messages to chatRepo
});

result.response;             // string
result.chatId;               // generated if not provided
result.agentsUsed;           // string[]
```

### Streaming

```ts
for await (const event of client.stream({message: '…', userId: '…'})) {
    if (event.type === 'token') process.stdout.write(String(event.data));
    if (event.type === 'done') console.log(event.data);
}
```

### Human-in-the-loop

When an agent tool is flagged with `requires_approval: true` in `agents.yaml`, `invoke()` returns with `result.interrupted == true`. Collect a decision, then:

```ts
const result = await client.resume({
    chatId,
    approved: true,
    auth: orchidAuthContext,
});
```

A checkpointer must be configured (`checkpointer:` section in `orchid.yml`, or a checkpointer arg on `fromConfigPath`) for resume to work — without it the pause state cannot be persisted between calls.

## When to use this vs the other entry points

- **`Orchid`** (this example) — in-process Node.js, no HTTP boundary. Best for background jobs, Fastify/Express routes, CLIs that embed orchid.
- **`orchid-api` (`@orchid-ai/orchid-api`)** — when other services / browsers need the full REST surface (chats CRUD, multipart upload, SSE streaming, HITL resume, MCP gateway). See `examples-ts/api-extensions/`.
- **`embedded-api`** (`examples-ts/embedded-api/`) — call `Orchid.invoke()` from your own Fastify app without the full orchid-api surface. A thinner slice than api-extensions.

All three share the same underlying runtime. Switching between them is a matter of which adapter you expose.

## Differences from the Python `embedded-python` examples

- **No `async with`** — TypeScript uses `try` / `finally` with `client.close()`. Use [`using`](https://github.com/tc39/proposal-explicit-resource-management) (TC39 Stage 3) once broadly supported.
- **`fromObject` instead of constructing the schema directly** — TS port pre-validates with zod; integrators pass plain objects and the framework normalises.
- **`registerTool` signature is `(name, handler, description?, parameters?)`** — `parameters:` is mandatory in YAML for built-in tools (no JS `inspect` equivalent).
