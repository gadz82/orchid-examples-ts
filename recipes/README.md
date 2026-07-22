# Recipes — Zero-Infrastructure RAG Example

A recipe knowledge base powered by on-disk vector storage. No Docker, no Qdrant, no external services.

## What it does

Answers cooking questions by retrieving from a local recipe corpus seeded at startup. Two agent personas: `cookbook` for general cooking Q&A and `mealplanner` for dietary-aware meal planning. Metadata filtering enables cuisine, course, and diet-based retrieval.

## What it uses

| Feature | Usage |
|---------|-------|
| On-disk vector storage | Local directory, no Docker needed |
| Startup hook seeding | 8+ recipes populated at bootstrap |
| Metadata filtering | Cuisine, course, dietary tags, prep time, difficulty |
| Two agent personas | `cookbook` (Q&A) + `mealplanner` (meal planning) |
| `GenericAgent` | YAML-only, no custom code |

## Example prompts

```
What can I make with chicken?
→ cookbook agent: retrieves Chicken Parmesan from vector store

Plan a vegan dinner for Monday.
→ mealplanner agent: filters by vegan tag, suggests Lentil Soup + Vegetable Stir-Fry

What Italian dishes do you have?
→ cookbook agent: filters by cuisine=Italian → Chicken Parmesan, Caesar Salad

Give me a gluten-free dessert recipe.
→ cookbook agent: filters by GF option available → checks dietary metadata

I need a quick weeknight meal under 30 minutes.
→ mealplanner agent: filters by prep time metadata
```

## Recipe Corpus

| Recipe | Cuisine | Course | Diet |
|--------|---------|--------|------|
| Chicken Parmesan | Italian | Main | Contains dairy |
| Vegetable Stir-Fry | Asian | Main | Vegan, GF option |
| Chocolate Cake | American | Dessert | Contains dairy + gluten |
| Caesar Salad | Italian | Starter | Contains dairy |
| Lentil Soup | Middle Eastern | Main | Vegan, GF |
| Guacamole | Mexican | Starter | Vegan, GF |
| Pad Thai | Thai | Main | GF, contains shellfish |
| Banana Bread | American | Dessert | Vegetarian |

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/recipes
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Ollama with `llama3.2` + `nomic-embed-text`.

## Files

```
examples-ts/recipes/
├── orchid.yml             # Top-level config (vector backend, SQLite, startup hook)
├── agents.yaml            # Agent definitions (cookbook, mealplanner)
└── hooks/                 # Seeds recipes into the vector store
```
