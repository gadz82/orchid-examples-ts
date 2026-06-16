# examples-ts — TypeScript examples for orchid-ts + orchid-api-ts

Worked examples for `@orchid-ai/orchid` and `@orchid-ai/orchid-api`.
Mirrors the Python `examples/` folder one-for-one with the same agents,
lifecycle and demo data, adapted to the TypeScript / Node.js ecosystem.

## Layout

```
examples-ts/
├── README.md               (this file)
├── embedded/               Programmatic library usage — Orchid.fromConfigPath() & friends
├── basketball/             Multi-agent YAML demo (mirrors Python examples/basketball/)
├── custom-storage/         Custom OrchidChatStorage backend (MySQL skeleton)
├── embedded-api/           Use @orchid-ai/orchid inside your own Fastify app
└── api-extensions/         Extend @orchid-ai/orchid-api with custom Fastify routes
```

## Library examples (`@orchid-ai/orchid`)

| Folder | What it shows |
|---|---|
| [`embedded/`](./embedded) | Five focused scripts: minimal / multi-turn / streaming / inline-config / custom-runtime |
| [`basketball/`](./basketball) | Two GenericAgents + six built-in tools + cross-agent skills + guardrails (no MCP, no Qdrant) |
| [`custom-storage/`](./custom-storage) | Implementing `OrchidChatStorage` against MySQL via `<modulePath>#<ExportName>` |

## API examples (`@orchid-ai/orchid-api`)

| Folder | What it shows |
|---|---|
| [`embedded-api/`](./embedded-api) | Skip the orchid-api process — call `Orchid.invoke()` directly from your own Fastify app |
| [`api-extensions/`](./api-extensions) | Keep the full orchid-api REST surface and add custom routes to the same Fastify instance |

## Choosing between embedded-api and api-extensions

```
       ┌────────────────────────────────────────────────┐
       │ Need the full orchid-api REST surface          │
       │ (chats CRUD, multipart upload, SSE, HITL,      │
       │ MCP gateway, MCP per-server OAuth, …)?         │
       └────────────────────────────────────────────────┘
                    │ yes                        │ no
                    ▼                            ▼
              api-extensions/              embedded-api/
              ───────────────              ──────────────
              keeps every built-in         tiny — just imports the
              orchid-api endpoint and      framework library and
              lets you add your own        wires `client.invoke()`
              routes alongside.            into a custom route.
```

## Running any example

Each folder is self-contained with its own `package.json`. The
`@orchid-ai/orchid` (and `@orchid-ai/orchid-api`) dependencies are linked
locally via `file:../../orchid-ts` / `file:../../orchid-api-ts`, so changes
in either package are picked up after running their own `npm run build`.

```bash
# 1. Build the framework once (only needed when orchid-ts source changes):
cd orchid-ts && npm install && npm run build

# 2. (For API examples only) Build orchid-api-ts as well:
cd ../orchid-api-ts && npm install && npm run build

# 3. Run any example:
cd ../examples-ts/embedded
npm install
npm run minimal              # see each example's package.json scripts
```

## Prerequisites

- Node.js 20+ (ESM, top-level await).
- A reachable LLM provider — by default the examples target Ollama on
  `http://localhost:11434` with `llama3.2`. Override `default_model` in
  each example's `orchid.yml` (or the `defaultModel` arg to
  `Orchid.fromObject(...)`) to switch to OpenAI / Anthropic / Gemini.
- For RAG-heavy demos, a running Qdrant. The provided examples disable
  RAG by default so this is not required.

## Domain-neutral content

The `embedded/` and `custom-storage/` examples use a *library / books*
domain. The `basketball/` example mirrors the Python `examples/basketball/`
demo. Neither references any specific vendor or platform — adapt freely.
