# Restaurant Multi-Agent Demo (TypeScript)

Three-agent restaurant demo: menu expert, order tracker, and review analyst.

## Quick Start

```bash
cd examples-ts/restaurant
npm install
npm start
```

## Agents

- **menu** — Knows every dish, recipe, dietary info. Tools: get_menu, lookup_recipe
- **orders** — Tracks order status. Tools: check_order_status
- **reviews** — Analyzes customer feedback. Tools: get_reviews

## Prerequisites

- Node.js 20+
- Ollama running with `llama3.2` model (for local LLM)
