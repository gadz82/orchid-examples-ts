# Hospital Front-Office Example — RAG-Based Multi-Agent System

A hospital front-office assistant demonstrating **RAG-based knowledge ingestion**, **multi-agent coordination**, and **cross-agent skills** for patient and visitor support. Four `GenericAgent` instances coordinate via a LangGraph supervisor to handle wayfinding, bureaucracy, scheduling, and emergency triage.

## What it does

Answers hospital-related questions by routing to domain-specialist agents. Each agent has a dedicated RAG namespace seeded with markdown knowledge files. The `indications-and-hours` cross-agent skill combines department location with opening hours for unified responses.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidAgent` (GenericAgent) | 4 agents, YAML-only, no custom code |
| RAG with Qdrant | 4 namespaces: departments, bureaucracy, opening-hours, emergency |
| Cross-agent skill | `indications-and-hours` chains department-navigator → opening-hours |
| Supervisor routing | LangGraph routes queries by content |
| SQLite persistence | File-based chat storage |

## Agents

| Agent | Purpose | RAG Namespace |
|-------|---------|---------------|
| `department-navigator` | Floor, wing, directions, accessibility | `departments` |
| `bureaucracy-procedures` | Registration, documents, certificates | `bureaucracy` |
| `opening-hours` | Visiting times, schedules, exceptions | `opening-hours` |
| `emergency-triage` | Self-triage, triage codes, guidance | `emergency` |

## Example prompts

```
Where is cardiology and when can I visit?
→ indications-and-hours skill: department-navigator + opening-hours

How do I get my medical records?
→ bureaucracy-procedures: lists required docs, office hours, wait times

I have chest pain, what should I do?
→ emergency-triage: Code ORANGE — proceed to ED immediately

What are the visiting hours for the maternity ward?
→ opening-hours with department-specific schedule

Where is the nearest wheelchair-accessible entrance?
→ department-navigator with accessibility info
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/hospital_front_office
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant.
