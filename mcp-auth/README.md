# MCP Auth Example — Authentication Patterns

Demonstrates all **three MCP authentication modes** supported by Orchid: `none` (no auth), `passthrough` (bearer token forwarding), and `oauth` (per-user OAuth 2.0 flow with dynamic client registration).

## What it does

Three agents, each connecting to a different MCP server with a distinct auth mode. The `local-tools` agent uses an unauthenticated server. The `internal-api` agent forwards the user's bearer token. The `crm-access` agent triggers full OAuth 2.0 discovery, DCR, and token exchange on first 401.

## What it uses

| Feature | Usage |
|---------|-------|
| MCP `none` mode | Local servers, no auth headers |
| MCP `passthrough` mode | Bearer token forwarding from `OrchidAuthContext` |
| MCP `oauth` mode | RFC 9728 + RFC 8414 + RFC 7591 DCR |
| Dynamic client registration | No pre-registered client needed |
| `OrchidMCPTokenStore` | Per-user token persistence (SQLite) |
| Capability caching | Server capabilities discovered once, cached per session |

## Agents

```yaml
agents:
  local-tools:      # mcp_servers[0].auth: none (default)
  internal-api:     # mcp_servers[0].auth.mode: passthrough
  crm-access:       # mcp_servers[0].auth.mode: oauth
```

On first 401 for OAuth servers, the framework automatically:
1. Runs RFC 9728 resource metadata discovery
2. Fetches RFC 8414 authorization server metadata
3. Performs RFC 7591 dynamic client registration
4. Executes Authorization Code + PKCE flow
5. Stores tokens and auto-refreshes on expiry

## Example prompts

```
What data does the local file server have?
→ local-tools agent: no auth, direct MCP tool call

Show me my pending orders from the internal system.
→ internal-api agent: bearer token forwarded unchanged

Get the latest account summary from the CRM.
→ crm-access agent: triggers OAuth if no valid token; auto-refreshes if expired

Authorize the CRM integration.
→ HTTP: GET /mcp/auth/servers/crm-server/authorize → PKCE flow → callback

What MCP servers are configured and what's their auth status?
→ HTTP: GET /mcp/auth/servers
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/mcp-auth
npm install
npx tsc -p tsconfig.json

# Requires MCP servers reachable at the URLs in orchid.yml
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2`, 3 MCP servers (local, internal, CRM).

## Files

```
examples-ts/mcp-auth/
├── orchid.yml              # Runtime config (LLM, storage)
└── agents.yaml             # Three agents + MCP server configs
```

No custom TypeScript code — everything is YAML-driven.
