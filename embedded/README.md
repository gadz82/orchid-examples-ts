# Embedded — calling Orchid from any Node.js code

Use **`Orchid`** when you want to invoke the agent graph directly from a
script, an Express/Fastify route, a queue worker, or a notebook — no API
HTTP, no CLI. The client owns the full lifecycle: loads `orchid.yml`,
builds the reader, chat storage, MCP token store, optional checkpointer,
and compiled graph.

## Files

| File | What it shows |
|---|---|
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

The default LLM target is `ollama/llama3.2` on `http://localhost:11434`.
Switch to OpenAI / Anthropic / Gemini by changing `default_model` in
`orchid.yml` (or `defaultModel` in the inline-config example) and exporting
the relevant API key.

## The public surface

```ts
import {Orchid, type OrchidInvokeResult} from '@orchid-ai/orchid';
```

### Construction

```ts
// Highest-level — loads everything from orchid.yml and owns resources:
const client = await Orchid.fromConfigPath('orchid.yml');
try {
    /* … */
} finally {
    await client.close();
}

// From a parsed config (e.g. loaded from a database):
const client2 = await Orchid.fromConfig(config, {chatModel, reader});

// Programmatic — agents config built as a plain object:
const client3 = await Orchid.fromObject({version: '1', agents: {…}});
```

### Invocation

```ts
const result: OrchidInvokeResult = await client.invoke({
    message: 'Hello',
    chatId: '…',                  // reuse to continue a conversation
    userId: 'alice',
    tenantId: 'acme',
    accessToken: '…',             // forwarded to MCP servers (passthrough mode)
    auth: orchidAuthContext,      // or pass a fully-formed OrchidAuthContext
    history: [{role: 'user', content: 'earlier turn'}],
    persist: true,                // save user+assistant messages to chatRepo
});

result.response;                  // string
result.chatId;                    // generated if not provided
result.agentsUsed;                // string[]
```

### Streaming

```ts
for await (const event of client.stream({message: '…', userId: '…'})) {
    if (event.type === 'token') process.stdout.write(String(event.data));
    if (event.type === 'done') console.log(event.data);
}
```

### HITL resume

```ts
// After a tool with `requires_approval: true` triggers an interrupt:
const result = await client.resume({
    chatId,
    approved: true,
    auth: orchidAuthContext,
});
```

## Differences from the Python `embedded-python` examples

- **No `async with`** — TypeScript uses `try` / `finally` with `client.close()`. Use [`using`](https://github.com/tc39/proposal-explicit-resource-management) (TC39 Stage 3) once it's broadly supported.
- **`fromObject` instead of constructing the schema directly** — TS port pre-validates with zod; integrators pass plain objects and the framework normalises.
- **`registerTool` signature is `(name, handler, description?, parameters?)`** — `parameters:` is mandatory in YAML for built-in tools (no JS `inspect` equivalent).
- **No HITL example here yet** — see `Orchid.resume()` in the README for the API. A worked example will be added once the upstream LangGraph checkpointer integration lands.
