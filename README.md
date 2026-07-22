# examples-ts — TypeScript examples for orchid-ts + orchid-api-ts

Worked examples for `@orchid-ai/orchid` and `@orchid-ai/orchid-api`.
Mirrors the Python `examples/` folder one-for-one with the same agents,
lifecycle and demo data, adapted to the TypeScript / Node.js ecosystem.

---

## Examples

### Library examples (`@orchid-ai/orchid`)

| Example | What it shows | Storage |
|---------|---------------|---------|
| [basketball](./basketball/) | Two GenericAgents (NBA stats + psychologist), six built-in tools, cross-agent skills, guardrails | SQLite |
| [embedded](./embedded/) | Five focused scripts: minimal / multi-turn / streaming / inline-config / custom-runtime | SQLite |
| [custom-storage](./custom-storage/) | Custom `OrchidChatStorage` implementation (MySQL skeleton) via `<modulePath>#<ExportName>` | MySQL |

### API examples (`@orchid-ai/orchid-api`)

| Example | What it shows |
|---------|---------------|
| [embedded-api](./embedded-api/) | Call `Orchid.invoke()` directly from your own Fastify app — no separate orchid-api process |
| [api-extensions](./api-extensions/) | Keep the full orchid-api REST surface and add custom Fastify routes alongside |

---

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
in either package are picked up after running their own build.

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

## Docker-ready (standalone)

Examples that ship a `Dockerfile` and `docker-compose.yml` can be run
independently as full-stack Docker stacks:

```bash
cd examples-ts/basketball
cp .env.example .env   # fill in GEMINI_API_KEY etc.
docker compose up --build

# API: http://localhost:8080  UI: http://localhost:3000  MCP: http://localhost:9000/mcp
```

Or via the workspace Makefile:

```bash
make run-basketball        # standalone Docker stack
make demo-basketball       # shared dev compose (infrastructure only, run locally)
```

## Prerequisites

- **Node.js 20+** (ESM, top-level await).
- **Docker** — for the Docker-ready examples
- **API key** — Gemini (free tier at [aistudio.google.com](https://aistudio.google.com/apikey)), or Groq / Anthropic / OpenAI
- **Ollama** (optional) — for fully local inference (`ollama pull llama3.2 nomic-embed-text`)

By default the examples target Ollama on `http://localhost:11434` with
`llama3.2`. Override `default_model` in each example's `orchid.yml`
(or the `defaultModel` arg to `Orchid.fromObject(...)`) to switch to
OpenAI / Anthropic / Gemini.

## Shared Docker helpers

The `_docker/` directory contains Dockerfiles shared across all Docker-ready examples:

| File | Purpose |
|------|---------|
| `_docker/Dockerfile.frontend` | Clones and runs [orchid-frontend](https://github.com/gadz82/orchid-frontend) |
| `_docker/Dockerfile.mcp` | Runs the MCP gateway via `npm install @orchid-ai/mcp` |

## Domain-neutral content

The `embedded/` and `custom-storage/` examples use a library / books domain.
The `basketball/` example mirrors the Python `examples/basketball/` demo.
Neither references any specific vendor or platform — adapt freely.
