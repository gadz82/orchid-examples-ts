# Restaurant Example — Custom Agent with RAG

A restaurant ordering system demonstrating **custom agent classes**, **RAG with dynamic injection**, and **sequential routing**. Shows how to extend `OrchidAgent` for domain-specific logic while leveraging the framework's RAG and tool-calling capabilities.

## What it does

Customers ask about the menu, place orders, and submit reviews — each handled by a dedicated agent. Menu items are indexed via RAG for semantic lookup. Orders flow through a sequential pipeline: menu → orders → reviews. The Reviews agent extends `OrchidAgent` with custom order-history validation.

## What it uses

| Feature | Usage |
|---------|-------|
| Custom `OrchidAgent` subclass | ReviewsAgent with order-history check |
| RAG dynamic injection | Menu items indexed in Qdrant, injected at runtime |
| Sequential routing | menu → orders → reviews agent pipeline |
| Built-in tools | YAML-declared: `get_menu`, `place_order`, `submit_review` |
| Multi-turn conversation | Order state preserved across turns |
| Vision (minicpm-v) | Menu PDF/image parsing |

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| `menu` | Answers questions about dishes, ingredients, prices | `get_menu`, `get_item_details` |
| `orders` | Places orders, checks status | `place_order`, `get_order_status` |
| `reviews` | Submits and retrieves reviews | `submit_review`, `get_reviews` |

## Example prompts

```
What vegetarian pasta dishes do you have?
→ menu agent: RAG lookup on menu_items namespace, filters vegetarian

I'd like to order the Margherita pizza.
→ orders agent: place_order tool — "Would you like any sides?"

The food was great! I want to leave a review.
→ reviews agent: checks if user has order history, then submit_review

What's the price of the Eggplant Parmesan?
→ menu agent: get_item_details with RAG context

Can I cancel my order #1234?
→ orders agent: cancellation workflow

Upload this PDF menu and tell me about the specials.
→ document upload → parse → RAG index → query
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/restaurant
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `minicpm-v` (for menu image parsing). Qdrant for RAG.

## Files

```
examples-ts/restaurant/
├── orchid.yml              # Runtime config (LLM, RAG, storage)
├── agents.yaml             # Three agents + tools
├── agents/                 # Custom agent class
├── tools/                  # Built-in tool handlers
└── hooks/                  # Startup hook for RAG seeding
```
