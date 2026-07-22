# Basketball — multi-agent YAML demo

Orchid's minimal end-to-end TypeScript example. Wires two `GenericAgent` instances — an NBA stats expert and a sports psychologist — using only built-in tools declared in YAML and a SQLite storage backend. No MCP servers, no external APIs, and no custom agent classes are required.

## What it does

Answers basketball stats questions and provides sports psychology advice. The supervisor automatically routes to the right agent: stats queries go to `basketball`, mental-game questions go to `psychologist`, and cross-agent skills like `player_performance_review` chain both agents together.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | Two agents, YAML-only, no custom code |
| Built-in tools | 6 tool handlers referenced via `<modulePath>#<ExportName>` |
| Cross-agent skills | `player_performance_review`, `team_wellness_check` |
| Supervisor routing | LangGraph routes by query content |
| Guardrails | Global input (injection, safety, length) + output (PII) |
| SQLite persistence | Built-in chat storage |
| Dev auth bypass | Local development without OAuth |

## What It Demonstrates

- **GenericAgent with built-in tools** — Two agents (`basketball` and `psychologist`) with tools declared entirely in YAML: `get_player_stats`, `compare_players`, `get_team_roster`, `assess_motivation`, `suggest_mental_strategy`, `analyze_team_dynamics`
- **Cross-agent skills** — The `basketball` agent invokes the `psychologist` agent's skills for mental-state analysis (`player_performance_review`, `team_wellness_check`)
- **SQLite persistence** — Chat sessions persist to a local SQLite database via the built-in backend
- **Guardrails** — Global input guards (prompt injection, content safety, max length) and output PII redaction; per-agent topic restrictions
- **Supervisor routing** — LangGraph supervisor routes queries to the appropriate agent based on content
- **Dev auth bypass** — `dev_auth_bypass: true` for local development without OAuth setup

## Features Highlighted

| Feature | Configuration |
|---------|--------------|
| Agent definition | `GenericAgent` via YAML only |
| Tools | Built-in TypeScript functions, `<modulePath>#<ExportName>` handler resolution |
| Storage | Built-in `OrchidSQLiteChatStorage` |
| LLM | Ollama (`llama3.2`) — switch model in `orchid.yml` |
| Auth | Development bypass mode |
| RAG | Disabled (in-memory tool data only) |

## Files

| File | Role |
|------|------|
| `orchid.yml` | Top-level config: LLM, SQLite storage, guardrails, tool handlers, cross-agent skills |
| `agents.yaml` | Two GenericAgents + six built-in tools + two cross-agent skills + guardrails |
| `tools/basketball.ts` | NBA stats handlers (`getPlayerStats`, `comparePlayers`, `getTeamRoster`) — in-memory dataset |
| `tools/psychology.ts` | Sports psychology handlers (`assessMotivation`, `suggestMentalStrategy`, `analyzeTeamDynamics`) |
| `main.ts` | Sample driver — runs four queries through the graph exercising both agents and the skill pipeline |

## Running

```bash
# 1. Build the framework once:
cd orchid-ts
npm install
npm run build

# 2. Then in this folder:
cd ../examples-ts/basketball
npm install

# 3. Build the tool handlers (so the compiled JS resolves YAML handler refs):
npx tsc -p tsconfig.json

# 4. Run the sample driver:
npm start
```

Default LLM target is `ollama/llama3.2`. Set `default_model` in `orchid.yml` to switch to OpenAI / Anthropic / Gemini and export the relevant API key.

## Why two agents?

The supervisor decides which agent (or both) handles each query:

| Query | Routes to |
|-------|-----------|
| "What are LeBron's stats?" | `basketball` only |
| "Compare Curry and Luka." | `basketball` only |
| "I'm in a slump — any advice?" | `psychologist` only |
| "Run a player_performance_review on Giannis." | `basketball` → `psychologist` (skill pipeline) |

## Example prompts

```
What are LeBron James' current stats?
→ basketball agent: getPlayerStats tool → "27.2 PPG, 7.5 RPG, 7.4 APG..."

Compare Stephen Curry and Luka Doncic.
→ basketball agent: comparePlayers tool → side-by-side analysis

My shooting confidence is gone — any advice?
→ psychologist agent: suggestMentalStrategy → confidence-building techniques

Run a player_performance_review on Giannis Antetokounmpo.
→ player_performance_review skill: basketball → psychologist

Check the team wellness for the Lakers.
→ team_wellness_check skill: basketball (roster) → psychologist (dynamics)
```

## Sample Interaction

```
User: Tell me about LeBron James
Assistant: [calls getPlayerStats tool]
LeBron James has played 21 seasons, averaging 27.2 PPG, 7.5 RPG, 7.4 APG...

User: How is his mental game?
Assistant: [routes to psychologist agent]
[psychologist calls assessMotivation]
LeBron demonstrates exceptional mental resilience...
```

## Adapting

To replace the in-memory dataset with a real NBA stats API:

1. Keep `agents.yaml` mostly as-is. Update tool descriptions if parameter shapes change.
2. Replace the bodies of `tools/basketball.ts` exports with `fetch()` calls to your data source. Keep function names — they're referenced from YAML via `./tools/basketball.js#getPlayerStats`.
3. Add an `mcp_servers:` block to either agent's YAML to bring in third-party MCP tools (no code changes — just YAML).

## Contrast with Other Examples

| Example | Complexity | Custom Code | External Deps |
|---------|-----------|-------------|---------------|
| **basketball** | Minimal | 6 tool handlers | Ollama only |
| embedded | Minimal | 5 scripts, direct `Orchid` usage | Ollama only |
| custom-storage | Medium | Full `OrchidChatStorage` implementation | Ollama + MySQL |
| embedded-api | Medium | Fastify integration + `Orchid.invoke()` | Ollama + Fastify |
| api-extensions | Medium | `buildApp()` + custom Fastify routes | Ollama + Fastify |

## Next Steps

After exploring basketball, try:
- **embedded/** — Five focused scripts showing `Orchid.fromConfigPath()` for streaming, multi-turn, HITL, and inline config
- **custom-storage/** — Wire a custom `OrchidChatStorage` backend (MySQL skeleton)
- **embedded-api/** — Call `Orchid.invoke()` directly from your own Fastify app
