# RAG-strategies showcase

Four agents share a small dated knowledge base (release notes seeded by the startup hook) but each picks a different `OrchidRetrievalStrategy`. Compare results from the same query to build intuition for which strategy fits which workload.

## What it does

Lets you ask the same question against 4 different retrieval strategies and compare results. The knowledge base is a set of release notes with dates — ideal for showing how strategy choice affects recall, latency, and recency bias.

## What it uses

| Feature | Usage |
|---------|-------|
| `simple` retrieval | Single dense vector query (baseline) |
| `multi_query` retrieval | N paraphrase queries → fused results |
| `hyde` retrieval | N hypothetical documents → dense queries |
| `recency_simple` (custom) | Oversample → re-rank by `published_at` |
| `registerRetrievalStrategy()` | Custom strategy registration |
| Startup hook | Seeds release notes + registers custom strategy |

## Strategy comparison

| Agent | Strategy | Latency | Recall | When to use |
|-------|----------|---------|--------|-------------|
| `simple_searcher` | `simple` | Fastest (1 query) | Baseline | Short, well-formed questions; near-verbatim matches |
| `multi_query_searcher` | `multi_query` | 1 + N paraphrases | High | Users phrase the same intent many ways |
| `hyde_searcher` | `hyde` | 1 + N hypotheticals | High for off-distribution | Vocabulary mismatch between user and corpus |
| `recency_searcher` | `recency_simple` (custom) | Same as simple | Baseline + time-bias | Time-sensitive corpus (release notes, news) |

## Example prompts

```
what changed about MCP auth?
→ hyde and multi_query shine on vague phrasing

release 5.4
→ simple matches the literal release ID instantly

latest changes
→ recency_searcher surfaces the newest note even if older notes score higher semantically

how do I configure OAuth for MCP servers?
→ multi_query generates paraphrases; hyde generates hypothetical docs

what was the most recent update to RAG scopes?
→ recency_searcher re-ranks by published_at date
```

## The custom `recency_simple` strategy

`strategies/recency.ts` subclasses `OrchidRetrievalStrategy` and:
1. Oversamples dense retrieval (pulls `2 * k` candidates)
2. Re-ranks by `published_at` (configurable metadata field) descending
3. Returns top `k` after re-rank

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/rag-strategies
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Qdrant, Ollama with `nomic-embed-text`.

## Adapting

To register your own retrieval strategy:
1. Subclass `OrchidRetrievalStrategy`
2. Implement `retrieve(...)` matching the ABC signature
3. Call `registerRetrievalStrategy("my_strategy", MyStrategy)` from a startup hook
4. Reference it from YAML: `agents.<name>.rag.retrieval.strategy: my_strategy`

## Files

```
examples-ts/rag-strategies/
├── orchid.yml                     # startup hook + LLM + storage
├── agents.yaml                    # 4 agents, one per strategy
├── hooks/                         # registers recency_simple + seeds corpus
└── strategies/
    └── recency.ts                 # custom OrchidRetrievalStrategy
```
