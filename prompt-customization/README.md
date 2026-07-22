# Prompt customization showcase

Demonstrates **every prompt-customization extension point** Orchid exposes through configuration. Intentionally small — a single `legal_advisor` agent — so the comparison with built-in defaults stays focused on the prompts themselves.

## What it does

Overrides every customizable prompt field in the framework: supervisor prompts, agent system prompt, RAG/MCP/resource headers, summarization prompts, transformer prompts, and mini-agent prompts. Shows how defaults inherit from `defaults.*` to per-agent overrides.

## What it uses

| Feature | Usage |
|---------|-------|
| `supervisor.assistant_name` | Brand name in supervisor prompts |
| `supervisor.routing_system_prompt` | Custom routing decision prompt |
| `supervisor.synthesis_system_prompt` | Custom synthesis prompt |
| `agents.<name>.prompt` | Primary system prompt |
| `agents.<name>.prompt_sections.*` | RAG/MCP/resource headers |
| `agents.<name>.rag.retrieval.transformer_prompts.*` | Multi-query, HyDE, decompose, reformulate |
| `agents.<name>.mini_agent.*` | Sub-task prompts for Pollen forks |
| Inheritance | Defaults → per-agent override cascade |

## What gets overridden

| Field | Default → Custom |
|-------|------------------|
| `supervisor.routing_system_prompt` | "You are a routing assistant" → legal-domain routing |
| `supervisor.synthesis_system_prompt` | "You are a synthesis assistant" → case-law synthesis |
| `agents.legal-advisor.prompt_sections.rag_header` | `\n=== CONTEXT ===` → `\n=== SOURCE CITATIONS ===` |
| `agents.legal-advisor.rag.retrieval.transformer_prompts.multi_query` | Generic → "Generate {n} legal phrasings..." |
| `agents.legal-advisor.mini_agent.decomposer_prompt` | Generic → "Break into legal sub-issues..." |

## Example prompts

```
What does GDPR say about data retention periods?
→ legal-advisor agent with custom RAG header "SOURCE CITATIONS" and custom HyDE prompt

Summarize the key liability clauses in this service agreement.
→ custom routing prompt, custom synthesis prompt

Compare GDPR and CCPA requirements for user consent.
→ multi_query transformer reformulates into legal phrasings

What precedents exist for data breach liability in the EU?
→ HyDE generates hypothetical legal analysis, then retrieves
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/prompt-customization
npm install
npx tsc -p tsconfig.json
npm start
```

Reuses the basketball example's SQLite chat storage (see `orchid.yml`), so no extra infrastructure beyond Ollama + Qdrant.

## Placeholder contracts

Custom templates MUST keep the default placeholders:

- `mcp_prompt_template` → `{name}`, `{text}`
- `skipped_prompt_template` → `{name}`, `{description}`, `{required_args}`
- `resource_template` → `{name}`, `{content}`
- `summarise_user_template` → `{query}`, `{rag_section}`, `{mcp_data}`
