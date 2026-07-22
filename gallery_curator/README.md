# Gallery Curator — Conversation Summarization Demo

An AI assistant for art gallery curators that remembers artists, exhibitions, sales results, and visitor feedback **across sessions** using Orchid's layered conversation memory system. No custom agent classes — everything is `GenericAgent` driven by YAML.

## What it does

Helps a gallery team plan exhibitions, track artists, and manage budgets across multiple conversations. Uses incremental running summaries (O(n) instead of O(n²)), structured JSON entity extraction, and RAG-augmented semantic retrieval to remember past discussions.

## What it uses

| Feature | Usage |
|---------|-------|
| Incremental running summary | Extends summary per turn, never re-summarizes from scratch |
| Structured JSON entities | Artists, venues, sales tracked as typed entities |
| RAG-augmented retrieval | Past turns retrieved from Qdrant `__memory__` namespace |
| Configurable compression prompts | Gallery-specific `summary_compression_*` overrides |
| Smart truncation (middle) | Auction listings preserved start+end |
| SQLite persistence | Summaries survive restarts |
| Graceful degradation | Falls back to summary-only if Qdrant unavailable |

## Example prompts

```
I'm planning the spring exhibition. Who are our confirmed artists?
→ first turn — no prior context yet

What was the budget for Ruth Asawa's shipping?
→ running summary covers earlier turns; RAG retrieves financially relevant past turns

Remind me of all the decisions we made about Venice.
→ RAG retrieves 5 most relevant past turns about "Venice"; incremental summary covers context

Who did we exhibit in the 2024 autumn show?
→ structured entities track past exhibitions with dates

Add Olafur Eliasson to the Q1 2028 program, budget $45K.
→ running summary extended; new entity created
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/gallery_curator
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`. Qdrant optional — degrades gracefully.

## Files

```
examples-ts/gallery_curator/
├── orchid.yml             # Infrastructure: SQLite, Qdrant, Ollama
└── agents.yaml            # Gallery curator + supervisor config + memory
```
