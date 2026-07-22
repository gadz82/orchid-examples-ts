# GraphRAG knowledge-base example

Single-agent demo showing the `graph_rag` retrieval strategy backed by Orchid's `InMemoryGraphStore`. The startup hook seeds a tiny org-chart corpus + companion vector chunks so the agent can answer multi-hop organisational queries.

## What it does

Answers questions about who reports to whom, what projects a team works on, and org-chart traversal. The graph store finds seed entities by name, walks configured relations up to 2 hops, fuses results with vector search when configured.

## What it uses

| Feature | Usage |
|---------|-------|
| `graph_rag` retrieval | Graph store → entity walk → fused with vector hits |
| `InMemoryGraphStore` | Org-chart entities + edges seeded via startup hook |
| `max_hops: 2` | Traverses `reports_to`, `works_on`, `manages` relations |
| `fuse_with_vectors: true` | Graph results fused with dense retrieval |
| Per-scope isolation | Seed uses `__shared__` tenant; real deployments scope per-tenant |

## Example prompts

```
Who reports to Alice?
→ graph walk: finds Alice, follows reports_to edges, returns direct reports

Which projects does Bob's team work on?
→ graph walk: finds Bob, follows works_on and manages edges

Who is two hops up the chain from Dave?
→ graph walk: Dave → manager → skip-level manager

What team does Carol manage and who is on it?
→ combination of manages and reports_to traversal

Who works with Dave on the Q3 release?
→ works_on relation traversal from Dave's node
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/graph_kb
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`.

## Production notes

Swap the in-memory graph store for Neo4j:

```yaml
rag:
  graph_store_backend: neo4j
  neo4j_url: bolt://neo4j:7687
```

The agent's YAML stays unchanged — `graph_rag` works the same regardless of which `OrchidGraphStore` is wired.

## Files

```
examples-ts/graph_kb/
├── agents.yaml        (single org_chart agent + graph_rag config)
├── orchid.yml         (runtime config + startup hook wiring)
└── hooks/             (seeds InMemoryGraphStore + vector chunks)
```
