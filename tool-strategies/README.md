# Tool-strategies showcase

Demonstrates Orchid's two orthogonal tool-dispatch extension points: `tool_call_strategy` (how skills invoke tools) and `parallel_tools` (intra-round parallel dispatch in the agentic loop).

## What it does

Five agents, each highlighting a different tool dispatch strategy. `fanout_lookup` calls all tools in parallel. `pipeline_lookup` calls tools sequentially. `smart_lookup` lets the LLM decide. `cascade_lookup` uses a custom "first wins" priority strategy. `parallel_searcher` enables intra-round parallelism for independent tools.

## What it uses

| Feature | Usage |
|---------|-------|
| `tool_call_strategy: all` | Independent backends, lowest-latency wins |
| `tool_call_strategy: sequential` | Tool N depends on tool N-1's output |
| `tool_call_strategy: llm_decides` | LLM picks the relevant subset |
| `tool_call_strategy: priority` (custom) | Cache → DB → upstream short-circuit |
| `parallel_tools: true` | Agentic-loop intra-round parallelism |
| `registerStrategy()` | Custom strategy registration via startup hook |

## What each agent demonstrates

| Agent | Knob | Strategy / flag | When to use |
|-------|------|----------------|-------------|
| `fanout_lookup` | `tool_call_strategy` | `all` | Independent backends, lowest-latency wins |
| `pipeline_lookup` | `tool_call_strategy` | `sequential` | Tool N depends on tool N-1's output |
| `smart_lookup` | `tool_call_strategy` | `llm_decides` | LLM picks the relevant subset |
| `cascade_lookup` | `tool_call_strategy` | `priority` (custom) | Cache → DB → upstream short-circuit |
| `parallel_searcher` | `parallel_tools` | flag (Phase A) | Agentic-loop intra-round parallelism |

## The custom `priority` strategy

`strategies/priority.ts` implements a "first non-empty response wins" lookup chain: try cache, then primary DB, then slow upstream — short-circuit as soon as a result is found.

## Example prompts

```
Look up user profile, inventory, and pricing in parallel.
→ fanout_lookup: all 3 tools called simultaneously via asyncio.gather

First check stock, then reserve item, then generate invoice.
→ pipeline_lookup: stock → reserve → invoice sequentially

Should I check the cache, database, or API for this customer?
→ smart_lookup: LLM decides which tool to call

Try the cache first, fall back to database, then API.
→ cascade_lookup: priority strategy short-circuits on cache hit

Search all three metrics simultaneously.
→ parallel_searcher: parallel_tools flag → 50ms instead of 150ms
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/tool-strategies
npm install
npx tsc -p tsconfig.json
npm start
```

Requires an MCP server for full strategy exercise (the startup hook registers the custom strategy; built-in tools exercise `parallel_tools`).

## Adapting

To register your own strategy:
1. Subclass `OrchidToolCallStrategy`
2. Implement `execute(client, tools, query, auth, ...)`
3. Call `registerStrategy("my_strategy", MyStrategy)` from a startup hook
4. Reference it from YAML: `mcp_servers[*].tool_call_strategy: my_strategy`

## Files

```
examples-ts/tool-strategies/
├── orchid.yml                    # startup hook + storage + LLM
├── agents.yaml                   # 5 agents, each highlighting one knob
├── hooks/                        # registers the `priority` strategy
├── strategies/
│   └── priority.ts               # OrchidToolCallStrategy subclass
└── tools/
    └── metrics.ts                # parallel-safe built-in tools
```
