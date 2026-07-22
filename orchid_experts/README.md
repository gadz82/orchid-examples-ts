# Orchid Experts — RAG-powered Knowledge Base Example

A self-contained demo deploying a **fleet of ten RAG-powered expert agents**, each the chief of knowledge for one orchid-* package or cross-cutting concept. Every agent is a `GenericAgent` (zero custom agent code) that answers deep questions from pre-ingested markdown knowledge files.

## What it does

Answers questions about every Orchid package: framework ABCs, RAG, MCP, auth, events, API, CLI, frontend, and production deployment. Cross-agent skills chain multiple experts for multi-domain questions (e.g., "How do I secure my Orchid deployment?" chains orchid → auth → ai-integration).

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | 10 agents, YAML + Markdown only |
| RAG with Qdrant | 10 namespaces, 86 knowledge files |
| Cross-agent skills | 9 sequential agent chains |
| Guardrails | Global input/output + per-agent `topic_restriction` |
| Startup hook | Auto-seeds knowledge into Qdrant |

## Agents

| Agent | Purpose | RAG Namespace |
|-------|---------|---------------|
| `orchid` | Core framework ABCs, config, GenericAgent, supervisor | `orchid-framework` |
| `rag` | RAG scopes, ingestion, retrieval, backends | `rag-system` |
| `tools-skills` | Tools & skills: strategies, skill execution | `tools-skills` |
| `mcp` | MCP protocol, auth modes, gateway | `mcp-system` |
| `auth` | OAuth, OIDC, DCR, identity resolution | `auth-system` |
| `bloom` | Pollen+Bloom events, signals, triggers, schedules | `bloom-events` |
| `orchid-api` | FastAPI routers, streaming, endpoints, plugins | `orchid-api-pkg` |
| `orchid-cli` | CLI commands, interactive mode, indexing | `orchid-cli-pkg` |
| `orchid-frontend` | Next.js UI, components, SSE proxy, theming | `orchid-frontend-pkg` |
| `ai-integration` | Production deployment, LLM selection, scaling | `ai-integration` |

## Example prompts

```
What ABCs does orchid define?
→ orchid agent: lists OrchidAgent, OrchidIdentityResolver, OrchidChatStorage, etc.

Explain the 5-level RAG scope hierarchy.
→ rag agent: root → tenant → user → chat → agent

How do I set up OAuth with the frontend?
→ frontend-auth-flow skill: orchid-frontend → auth

How do I secure my Orchid deployment?
→ secure-deployment skill: orchid → auth → ai-integration

Which LLM provider should I use in production?
→ ai-integration agent: quality vs cost vs latency vs privacy analysis

How does Pollen+Bloom event processing work?
→ bloom agent: signals, triggers, schedules, jobs

How do I create a custom agent with custom tools?
→ framework-extend skill: orchid → tools-skills
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/orchid_experts
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant.

## Files

```
examples-ts/orchid_experts/
├── orchid.yml                    # Runtime config (Qdrant, SQLite, Ollama)
├── agents.yaml                   # 10 agents + supervisor + skills + guardrails
├── hooks/                        # Seeds knowledge → Qdrant
└── knowledge/                    # 10 directories of markdown knowledge files
```
