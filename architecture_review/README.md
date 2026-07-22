# Architecture Review Board — Multi-Agent + rag_augmented Demo

Three GenericAgents forming a virtual design review board: structural engineering, cost estimation, and sustainability consulting. Cross-agent orchestrator skills run sequential pipelines (design → cost → sustainability) with each agent seeing prior output via `mcp_context`. Backed by **rag_augmented** memory.

## What it does

Answers architecture/engineering questions by routing to domain specialists. Past design decisions and material comparisons are retrieved from Qdrant across sessions via `rag_augmented` memory.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | structural, cost, sustainability |
| `rag_augmented` memory | Past decisions retrieved from Qdrant each turn |
| Orchestrator skills | `full_design_review` (3 agents), `material_selection` (2 agents) |
| Structured JSON entities | Materials, jurisdictions, certifications with dedup |
| Middle truncation | Long code compliance lists preserved start+end |
| Per-agent prompt overrides | Custom `summary_compression_*` prompts |
| SQLite persistence | Summaries survive restarts |

## Agents

| Agent | Tools | Expertise |
|-------|-------|-----------|
| `structural` | `analyze_structure`, `check_code_compliance`, `compare_materials`, `get_fire_strategy` | Load analysis, material selection, Eurocode/IBC/ASCE |
| `cost` | `estimate_construction_cost`, `compare_lifecycle_costs`, `get_market_rates` | Construction budgets, lifecycle economics |
| `sustainability` | `evaluate_certification`, `calculate_embodied_carbon`, `get_sustainability_strategies`, `compare_carbon_footprints` | BREEAM/LEED/DGNB, green strategies |

## Example prompts

```
Review a 6-story office building in Berlin, 8000m², targeting LEED Gold.
→ full_design_review skill: structural → cost → sustainability

What if we switch to all-timber construction?
→ material_selection skill: structural + sustainability

Compare the carbon footprints of all three structural options we discussed.
→ sustainability agent with RAG from past sessions

How does CLT compare to steel for a 12m span?
→ structural agent with RAG-retrieved past material comparisons
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/architecture_review
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant.
