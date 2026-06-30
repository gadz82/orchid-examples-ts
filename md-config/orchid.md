---
# Orchid — MD Config Demo (TypeScript)
#
# Self-contained demo: basketball + psychologist agents with SQLite storage.
# No MCP servers or external APIs required.
#
# Usage:
#   ORCHID_CONFIG=orchid.md npx tsx main.ts
#
# Or via docker-compose:
#   docker compose up --build
#
# This is a Markdown config file. The YAML frontmatter (between ---) holds
# structured config fields. The body (after the second ---) is free-form
# documentation — it is ignored at runtime for the root config.

# ── Infrastructure keys ──────────────────────────────────────
agents:
  config_format: md
  agents_dir: agents

llm:
  model: gemini/gemini-flash-latest
  gemini_api_key: ${GEMINI_API_KEY}

auth:
  dev_bypass: true

rag:
  vector_backend: qdrant
  qdrant_url: http://qdrant:6333
  embedding_model: gemini/gemini-embedding-001
  gemini_api_key: ${GEMINI_API_KEY}

storage:
  class: sqlite
  dsn: ./.orchid-md-config.db

tracing:
  langsmith_tracing: false

# ── Agent behavior keys ─────────────────────────────────────
version: "1"

defaults:
  llm:
    model: gemini/gemini-flash-latest
    temperature: 0.2
  rag:
    enabled: false

supervisor:
  assistant_name: "Basketball AI"

# ── Global guardrails ────────────────────────────────────────
guardrails:
  input:
    - type: prompt_injection
      fail_action: block
    - type: content_safety
      fail_action: block
    - type: max_length
      fail_action: block
      config:
        max_characters: 5000
  output:
    - type: pii_detection
      fail_action: redact
      config:
        entities: [email, phone, ssn]

# ── Built-in tools ────────────────────────────────────────────
tools:
  get_player_stats:
    handler: "./tools/basketball.ts#getPlayerStats"
    description: "Get stats for an NBA player (points, rebounds, assists, team, position)"
    parameters:
      player_name:
        type: string
        description: "Full or partial NBA player name to look up."
        required: true
        default: ""

  compare_players:
    handler: "./tools/basketball.ts#comparePlayers"
    description: "Side-by-side comparison of two NBA players with advantage analysis"
    parameters:
      player_a:
        type: string
        description: "Full or partial name of the first player."
        required: true
        default: ""
      player_b:
        type: string
        description: "Full or partial name of the second player."
        required: true
        default: ""

  get_team_roster:
    handler: "./tools/basketball.ts#getTeamRoster"
    description: "Get all players on a given NBA team"
    parameters:
      team_name:
        type: string
        description: "NBA team name (full or partial, e.g. 'Lakers')."
        required: true
        default: ""

  assess_motivation:
    handler: "./tools/psychology.ts#assessMotivation"
    description: "Assess a player's motivation level, drive type, and risk factors"
    parameters:
      player_name:
        type: string
        description: "Full or partial player name to assess."
        required: true
        default: ""
      situation:
        type: string
        description: "Current situation or context (e.g. 'playoff pressure')."
        required: false
        default: ""

  suggest_mental_strategy:
    handler: "./tools/psychology.ts#suggestMentalStrategy"
    description: "Suggest mental performance strategies for a given situation"
    parameters:
      situation:
        type: string
        description: "Situation to address (slump / pressure / confidence / team conflict)."
        required: true
        default: ""

  analyze_team_dynamics:
    handler: "./tools/psychology.ts#analyzeTeamDynamics"
    description: "Analyze team chemistry, cohesion, and group motivation patterns"
    parameters:
      team_name:
        type: string
        description: "NBA team name to analyze (full or partial)."
        required: true
        default: ""

# ── Orchestrator-level skills (cross-agent) ───────────────────
skills:
  player_performance_review:
    description: >
      Get a player's stats and performance data, then assess their
      motivation and mental state with actionable recommendations.
    steps:
      - agent: basketball
        instruction: "Look up the player's current stats and performance data"
      - agent: psychologist
        instruction: "Based on the player's stats and situation, assess their motivation and suggest mental strategies"

  team_wellness_check:
    description: >
      Review a team's full roster and then analyze group dynamics,
      cohesion, and motivation across the team.
    steps:
      - agent: basketball
        instruction: "Get the full roster for the specified team with all player stats"
      - agent: psychologist
        instruction: "Analyze the team's dynamics, cohesion, and suggest group motivation strategies"

# ── Pollen + Bloom (events) ──────────────────────────────────
events:
  enabled: true
  queue:
    backend: sqlite
    dsn: ./.orchid-md-config.db
  processors:
    - type: asyncio_pool
      config:
        concurrency: 1
  schedules:
    - expression: "0 7 * * 1-5"
      signal: cron
      payload: {}
  triggers:
    - signal: cron
      action: emit
      emits:
        - signal: agent_prompt
          payload:
            agent: notifications
            prompt_template: |
              Produce a 3-fact NBA trivia digest based on yesterday's games.
              Each fact must cite the source game.  Format as Markdown.
            identity:
              mode: service_account
              name: trivia-bot
            visibility: tenant
      retry:
        max_retries: 2
        backoff: exponential

mcp_gateway: {}
---
