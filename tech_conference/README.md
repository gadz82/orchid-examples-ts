# Tech Conference Example — RAG-Based Multi-Agent System

A tech conference assistant demonstrating **RAG-based knowledge ingestion**, **multi-agent coordination**, and **cross-agent skills** for visitor and speaker support. Four `GenericAgent` instances coordinate via a LangGraph supervisor to handle venue navigation, schedule content, visitor services, and speaker logistics.

## What it does

Answers conference-related questions by routing to domain-specialist agents. Each agent has a dedicated RAG namespace seeded with markdown knowledge files. Two cross-agent skills combine information across domains: `directions-and-sessions` (venue + schedule) and `speaker-logistics` (speaker + venue + schedule).

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | 4 agents, YAML-only, no custom code |
| RAG with Qdrant | 4 namespaces: venue, schedule, visitor-services, speaker-services |
| Cross-agent skills | `directions-and-sessions`, `speaker-logistics` |
| Supervisor routing | LangGraph routes queries by content |
| SQLite persistence | File-based chat storage |

## Agents

| Agent | Purpose | RAG Namespace |
|-------|---------|---------------|
| `venue-navigator` | Room locations, directions, facilities, Wi-Fi | `venue` |
| `schedule-content` | Session schedules, speaker bios, track info | `schedule` |
| `visitor-services` | Registration, food, accessibility, transport | `visitor-services` |
| `speaker-services` | Check-in, AV specs, slide submission, green room | `speaker-services` |

## Example prompts

```
Where is the AI agents keynote and when does it start?
→ directions-and-sessions skill: schedule-content + venue-navigator

I'm speaking on Day 1, what do I need to do?
→ speaker-logistics skill: speaker-services → venue-navigator → schedule-content

Where can I get food and is there vegetarian food?
→ visitor-services: RAG lookup on food/accessibility docs

How do I get to Room A from the registration desk?
→ venue-navigator: directions from knowledge base

What sessions are happening on Tuesday afternoon?
→ schedule-content: session schedule from RAG
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/tech_conference
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant.
