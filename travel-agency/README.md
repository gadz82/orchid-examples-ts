# Travel Agency — Multi-Agent Orchid Example

A multi-agent travel planner demonstrating most Orchid enhancements in a single cohesive domain: custom agent subclass, HITL tool approval, checkpointer, multi-query RAG, guardrails, and orchestrator skills.

## What it does

Plans trips by searching flights and hotels, building itineraries, and booking with human approval. The `plan_trip` skill chains flights → hotels → itinerary. The `book_my_trip` skill handles flight+hotel booking with HITL approval interrupts. A checkpointer persists conversation state so interrupted flows can be resumed.

## What it uses

| Feature | Usage |
|---------|-------|
| Custom `OrchidAgent` subclass | Itinerary agent reads sibling results from state |
| HITL tool approval | `book_flight`, `book_hotel`, `cancel_booking` — `requires_approval: true` |
| LangGraph checkpointer | SQLite checkpointer persists state for resume |
| Multi-query retriever | `defaults.rag.retrieval.strategy: multi_query` |
| Grounding guardrails | Anti-hallucination on flights and hotels |
| Orchestrator skills | `plan_trip` (search + itinerary), `book_my_trip` (flight+hotel booking) |
| LLM fallback + retry | `fallback_model: ollama/llama3.2`, `retry_attempts: 2` |
| Response caching | `defaults.cache_enabled: true` |

## Example prompts

```
I need a flight from JFK to London, economy, under $800.
→ flights agent: search_flights with budget filter

Find me a 4-star hotel in Paris under $300/night with a bar.
→ hotels agent: search_hotels with star + price + amenity filters

Plan me a 5-day London trip leaving from JFK on May 10. Budget-friendly, interested in museums.
→ plan_trip skill: flights → hotels → itinerary (custom agent)

Book flight AA101 for John Doe.
→ book_flight tool triggers HITL interrupt:
   {"status": "interrupted", "approvals_needed": [{...}]}
   → POST /resume {"approved": true} to continue

Estimate the budget for 5 nights at $210/night with $720 flights.
→ custom tool registered by startup hook

Cancel my hotel booking for the Paris trip.
→ cancel_booking tool with HITL approval
```

## Files

```
examples-ts/travel-agency/
├── agents.yaml          # agent definitions, tools, skills, guardrails
├── orchid.yml           # runtime: LLM, storage, checkpointer, startup hook
├── agents/              # custom OrchidAgent subclass
├── tools/               # flights, hotels, bookings handlers
└── hooks/               # seeds destination RAG + registers custom tool
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/travel-agency
npm install
npx tsc -p tsconfig.json

# Requires Qdrant for destination RAG
npm start
```

## Extending

- **Add a new city** — edit tool datasets
- **Add a new agent** — define in `agents.yaml` (no TS needed for config-only agents)
- **Swap checkpointer to PostgreSQL** — install plugin and change `checkpointer.type`
