# Helpdesk Multi-Agent Demo (TypeScript)

Three-agent helpdesk: triage, technical support, and escalation manager.

## Quick Start
```bash
cd examples-ts/helpdesk
npm install && npm start
```
## Agents
- **triage** — categorizes and prioritizes tickets (tools: get_ticket, check_sla)
- **support** — resolves issues via KB (tools: search_kb)
- **escalation** — handles critical routing (tools: escalate_ticket, get_ticket)
