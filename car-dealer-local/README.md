# Car Dealer — Local File Content Source Example

A car dealership agent that searches and reads vehicle specification documents from a local filesystem directory. No database or vector store needed — the agent uses filesystem tools to find answers.

## What it does

Answers questions about vehicle specs by searching the `data/` directory. The agent is prompted to first search for relevant files, then read them, then answer. All data lives as markdown/text files on disk.

## What it uses

| Feature | Usage |
|---------|-------|
| `LocalFileContentSource` | Built-in filesystem content source |
| Content source tools | `list_content_files`, `search_content_files`, `read_content_file` |
| Agentic tool-calling | Agent searches before answering |

## Example prompts

```
What's the fuel economy of the Toyota Camry?
→ agent searches data/, finds camry-2025-specs.md, reads and answers

Compare the Camry and the Golf — which has better MPG?
→ agent searches and reads both spec files, compares

What engine options does the F-150 offer?
→ agent reads f150-2025-specs.md, extracts engine options

Does the Audi A4 have all-wheel drive?
→ agent reads audi-a4-2025-specs.md, finds AWD info
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/car-dealer-local
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2`.
