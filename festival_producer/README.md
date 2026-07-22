# Festival Producer — Multi-Agent + rag_augmented Demo

Three GenericAgents (artist booking, logistics, marketing) with cross-agent orchestrator skills, backed by **rag_augmented** conversation memory — Orchid's advanced summarization pipeline.

## What it does

Plans a music festival by coordinating artist booking, venue logistics, and marketing. Past decisions and budget discussions are retrieved from Qdrant across sessions via `rag_augmented` memory. The `full_production_review` skill runs all three agents sequentially.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | artist-booking, logistics, marketing |
| `rag_augmented` memory | Past turns retrieved from Qdrant |
| Orchestrator skills | `full_production_review` (3 agents), `budget_optimization`, `stage_planning` |
| Structured JSON entities | Artists, venues, budgets with dedup |
| Middle truncation | Long rider specs preserved start+end |
| Per-agent prompt overrides | Custom `summary_compression_*` via `prompt_sections` |

## Agents

| Agent | Tools | Expertise |
|-------|-------|-----------|
| `artist-booking` | `lookup_artist`, `list_available_artists`, `get_rider_details`, `compare_artists` | Artist availability, fee negotiation, lineup curation |
| `logistics` | `check_venue_availability`, `get_schedule_overview`, `estimate_power_budget`, `get_crew_requirements` | Stage specs, power grids, scheduling, crew |
| `marketing` | `analyze_demographics`, `get_pricing_strategy`, `recommend_channels`, `project_attendance` | Demographics, ticket pricing, channel mix |

## Example prompts

```
I need a headliner for Saturday night. Budget is $100K.
→ artist-booking: lookup_artist + list_available_artists

Can the Main Stage handle Solar Eclipse Collective's 32A three-phase power?
→ logistics: check_venue_availability + estimate_power_budget

What's our projected revenue if Neon Cathedral headlines Saturday?
→ budget_optimization skill: booking + marketing collaborate

Give me a full production review for the current lineup.
→ full_production_review skill: booking → logistics → marketing

What did we decide about the VIP stage placement last session?
→ RAG retrieves past discussions from Qdrant
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/festival_producer
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant.
