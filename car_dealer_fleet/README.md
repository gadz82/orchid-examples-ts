# Car Dealer — Dynamic Expert Agent Fleet

A car dealership system where **specialised expert agents are created dynamically from content sources**. No agents are defined in YAML — the entire fleet is generated at bootstrap using an **ephemeral Orchid instance** that analyses specification documents.

## What it does

On every bootstrap, a startup hook spins up an ephemeral Orchid instance with reader + summariser agents. The reader explores `data/` documents, the summariser analyses them and emits JSON agent configs, which are persisted to SQLite and compiled into expert agents — one per vehicle make.

## What it uses

| Feature | Usage |
|---------|-------|
| `Orchid.fromConfig()` (ephemeral) | Bootstrap instance for fleet generation |
| `OrchidSQLiteConfigStorage` | Config persistence |
| Startup hook | Fleet generation pipeline |
| Programmatic agent building | reader + summariser agents defined in code |
| Skill pipeline | `build_expert_fleet` chains reader → summariser |

## Fleet generation flow

```
Orchid bootstrap → Startup hook
  1. Delete existing agents from SQLite
  2. Build ephemeral agents programmatically:
     • reader agent — explores data/ directory
     • summariser agent — analyses content, generates JSON configs
     • build_expert_fleet skill — reader → summariser pipeline
  3. Ephemeral graph runs "Create expert agents from all documents"
  4. JSON configs extracted, persisted to SQLite
  5. mergeFromDb() picks up agents → compiled graph
```

## Example prompts

```
What's the fuel economy of the Toyota Camry?
→ toyota-expert agent carries specs in its system prompt

Compare the Audi A4 and Honda Accord warranties.
→ audi-expert + honda-expert agents retrieved

Which vehicles have Adaptive Cruise Control?
→ supervisor routes to all agents with matching specs

What engine options does the BMW 3 Series have?
→ bmw-expert answers from its generated prompt
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/car_dealer_fleet
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Ollama with `llama3.2`.

## Files

```
examples-ts/car_dealer_fleet/
├── orchid.yml                  # content_sources + config_storage + startup hook
├── agents.yaml                 # Empty agents {} + config_storage enabled
├── data/                       # 6 car specification documents (.md, .txt)
├── hooks/                      # Startup hook (ephemeral Orchid fleet builder)
└── main.ts                     # Sample driver
```
