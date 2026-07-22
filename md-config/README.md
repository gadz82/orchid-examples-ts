# MD Configuration Demo

Demonstrates the **Markdown-based configuration** system. Instead of two YAML files (`orchid.yml` + `agents.yaml`), the MD config uses a single `orchid.md` root file with YAML frontmatter + per-agent Markdown files in `agents/`. The Markdown body of each agent file is used directly as the system prompt — no YAML multi-line string escaping.

## What it does

Shows the equivalent YAML and MD configs produce identical agent configurations. The `orchid.md` file replaces both `orchid.yml` and `agents.yaml`. Each agent gets a `.md` file — its YAML frontmatter carries structured config, and its Markdown body is the system prompt verbatim.

## What it uses

| Feature | Usage |
|---------|-------|
| MD configuration (ADR-030) | `orchid.md` replaces YAML config files |
| YAML frontmatter | Structured fields (description, tools, RAG, skills) |
| Markdown body | Agent system prompt (no YAML escaping) |
| Hot-reload | File changes detected, graph rebuilt without restart |

## Config Format

```markdown
---
description: "Basketball expert"
tools:
  - get_player_stats
  - compare_players
---
# Basketball Expert
You are a basketball statistics expert.
Focus on player performance metrics.
```

## Example prompts

Same prompts as the YAML-based basketball demo — the MD config produces the same runtime graph:

```
What are LeBron James' current stats?
→ routes to basketball agent

Compare Stephen Curry and Luka Doncic.
→ routes to basketball agent

My shooting confidence is gone — any advice?
→ routes to psychologist agent
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/md-config
npm install
npx tsc -p tsconfig.json
npm start
```

The framework loads `orchid.md` when `agents_config_path` points to a `.md` file.

## Hot-Reload

When running API mode with file watching, any edit to `orchid.md` or `agents/*.md` is detected and the graph is rebuilt without a restart.

## Files

```
examples-ts/md-config/
├── orchid.md                  ← Unified root config (replaces orchid.yml + agents.yaml)
├── agents/
│   ├── basketball.md          ← Basketball expert agent
│   └── psychologist.md        ← Sports psychologist agent
├── orchid.yml                 ← Fallback YAML (identical config for comparison)
├── agents.yaml                ← Fallback YAML agents config
└── main.ts                    ← Sample driver
```
