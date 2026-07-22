# Wiki RAG example

A two-agent knowledge-base demo showcasing Orchid's RAG pipeline with different ingestion and retrieval strategies per agent, plus per-tool RAG overrides.

## What it does

Answers documentation questions by routing to two agents. The `docs` agent uses `headered` chunking and `hybrid` retrieval (BM25 + dense) for long-form documents. The `faq` agent uses `recursive` chunking and `simple` retrieval for short Q&A snippets. A glossary tool caches results into a separate namespace with `semantic` chunking.

## What it uses

| Feature | Usage |
|---------|-------|
| `headered` ingestion | Docs chunks carry markdown heading context |
| `recursive` ingestion | FAQ inherits default character-based splitting |
| `hybrid` retrieval | Dense + BM25 fused via RRF |
| `simple` retrieval | Single dense vector query |
| Per-tool RAG override (ADR-024) | Glossary tool uses separate namespace + strategy |
| `semantic` ingestion | Glossary entries chunked by semantic boundaries |
| Two agents, two namespaces | `wiki_docs` (docs) + `wiki_faq` (faq) |

## Example prompts

```
How does hybrid retrieval work?
→ docs agent: headered chunks + hybrid (BM25+RRF) retrieval

How do I disable RAG?
→ faq agent: recursive chunks + simple retrieval

What does the term "scope promotion" mean?
→ lookup_glossary tool: per-tool RAG override → glossary_cache namespace

What are the five levels of the RAG scope hierarchy?
→ docs agent: hybrid retrieval on headered chunks

When should I use multi_query over hyde?
→ faq agent: simple retrieval on FAQ corpus
```

## Files

```
examples-ts/wiki/
├── agents.yaml        (two agents + one built-in tool with per-tool RAG override)
├── orchid.yml         (runtime config + startup hook wiring)
├── hooks/             (seeds wiki_docs + wiki_faq corpora)
└── tools/             (lookup_glossary handler)
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/wiki
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Qdrant for vector search, Ollama with `nomic-embed-text`.
