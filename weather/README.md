# Weather — MCP Tool Demo

A single-agent demo that fetches weather data through an MCP server. Demonstrates how to wire an external MCP server into a GenericAgent using YAML-only configuration.

## What it does

Answers weather questions by calling an external MCP weather server. The agent is configured in YAML with an `mcp_servers` block pointing at the weather service. No custom agent code required — the GenericAgent discovers and calls MCP tools automatically.

## What it uses

| Feature | Usage |
|---------|-------|
| MCP server integration | GenericAgent calls external weather server |
| YAML-only configuration | `mcp_servers` block in `agents.yaml` |
| Tool discovery | Agent discovers available weather tools via MCP |
| Local MCP server | `mcp-weather/` directory contains the server implementation |

## Example prompts

```
What's the weather in Tokyo today?
→ agent calls weather MCP server: get_current_weather(Tokyo)

Will it rain in London this weekend?
→ agent calls forecast tool on the MCP server

What's the temperature in New York right now?
→ agent calls get_current_weather(New York)

Do I need an umbrella in Paris tomorrow?
→ agent calls forecast and precipitation tools
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/weather
npm install
npx tsc -p tsconfig.json

# Start the weather MCP server (separate terminal):
cd mcp-weather
npm install && npm start

# Then run the example:
cd ..
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2`.

## Files

```
examples-ts/weather/
├── orchid.yml              # Runtime config (LLM, storage, MCP server URL)
├── agents.yaml             # Single agent + MCP server wiring
├── mcp-weather/            # Local MCP weather server implementation
├── tools/                  # Built-in tool handlers
└── main.ts                 # Sample driver
```
