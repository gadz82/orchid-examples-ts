# Helpdesk Example — Event-Driven Workflow

A three-agent helpdesk system demonstrating **Pollen + Bloom** event-driven activation: customer tickets flow through `triage` → `support` → `escalation` agents via background Bloom runs, with results appended back into the customer's chat.

## What it does

External webhooks or cron ticks emit signals that trigger Bloom runs. Each run executes an agent pipeline in the background — triage classifies the ticket, support handles it, and escalation takes over for high-priority issues. Results appear in the customer's conversation.

## What it uses

| Feature | Usage |
|---------|-------|
| Pollen + Bloom fan-out | Signals → background Bloom runs |
| Event-driven activation | Agents run as Bloom triggers, not only chat messages |
| Three-agent pipeline | triage → support → escalation |
| Custom event producers | HTTP webhook ingestion for external ticketing systems |
| SQLite event storage | Persistent signal/queue/store |
| Visibility model | `addressed_to_user` so customers see only their tickets |

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| `triage` | Classifies ticket priority and routes | Routing only |
| `support` | Handles standard support requests | `create_ticket`, `update_status` |
| `escalation` | Handles high-priority/sensitive issues | Escalation logic |

## Example prompts (sent as signals via webhook)

```json
POST /signals
{
  "type": "support.ticket.created",
  "tenant_key": "helpdesk-demo",
  "payload": {
    "subject": "Cannot access my account",
    "priority": "high",
    "customer_id": "cust-123"
  }
}
```

```
→ triage classifies as high priority
→ escalation handles the ticket (high-priority-escalation trigger)

POST /signals
{
  "type": "support.ticket.created",
  "payload": {
    "subject": "How do I reset my password?",
    "priority": "low"
  }
}
```

```
→ triage classifies as low priority
→ support agent handles with create_ticket, update_status
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/helpdesk
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2`.
