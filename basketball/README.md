# Basketball — multi-agent YAML demo

Two-agent demo identical in shape to the Python `examples/basketball/`:

- **`basketball`** agent — NBA stats expert (`get_player_stats`, `compare_players`, `get_team_roster`).
- **`psychologist`** agent — sports psychologist (`assess_motivation`, `suggest_mental_strategy`, `analyze_team_dynamics`).
- Two **cross-agent skills**: `player_performance_review` (basketball → psychologist) and `team_wellness_check` (basketball → psychologist).
- Global guardrails (prompt injection, content safety, max length, PII redaction).

Self-contained: no MCP servers, no Qdrant, no env vars. SQLite storage is created on first run.

## Files

| File | Role |
|---|---|
| `orchid.yml` | Top-level config: points at `agents.yaml`, sets default model, SQLite chat repo |
| `agents.yaml` | Two GenericAgents + six built-in tools + two cross-agent skills + guardrails |
| `tools/basketball.ts` | NBA stats handlers (in-memory dataset) |
| `tools/psychology.ts` | Heuristic motivation/strategy/dynamics handlers |
| `main.ts` | Sample driver that runs four queries through the graph |

## Running

```bash
# Build the framework once (from the orchid repo root):
cd orchid-ts
npm install
npm run build

# Then in this folder:
cd ../examples-ts/basketball
npm install

# Build the tool handlers (so #compiled# JS resolves the YAML handler refs):
npx tsc -p tsconfig.json

# Run the sample driver:
npm start
```

Default LLM target is `ollama/llama3.2`. Set `default_model` in `orchid.yml`
to switch to OpenAI / Anthropic / Gemini.

## Why two agents?

The supervisor decides which agent (or both) handles each query. With this
config:

| Query | Routes to |
|---|---|
| "What are LeBron's stats?" | `basketball` only |
| "Compare Curry and Luka." | `basketball` only |
| "I'm in a slump — any advice?" | `psychologist` only |
| "Run a player_performance_review on Giannis." | `basketball` → `psychologist` (skill pipeline) |

## Adapting

To replace the in-memory dataset with a real NBA stats API:

1. Keep `agents.yaml` mostly as-is. Update tool descriptions if the
   parameter shapes change.
2. Replace the bodies of `tools/basketball.ts` exports with `fetch()` calls
   to your data source. Keep the function names — they're referenced from
   YAML via `./tools/basketball.js#getPlayerStats`.
3. Add an `mcp_servers:` block to either agent's YAML to bring in
   third-party MCP tools (no code changes — just YAML).
