# Education Studio

Multi-agent teaching workflow that turns course material into quizzes, lesson plans, and export packages.

## What it does

Upload course material (PDF, text), then ask the assistant to generate quizzes, lesson plans, or full teaching packages. The content-analyzer extracts concepts, the quiz-generator creates grounded questions, the lesson-builder structures a paced plan, and the format-exporter outputs Markdown or plain text.

## What it uses

| Feature | Usage |
|---------|-------|
| OrchidTool subclasses | 16 tools with `parallel_safe` and declarative parameters |
| Mini-agents (Pollen) | Quiz-generator fans out for multi-section sources |
| Cross-agent skills | `generate_quiz`, `generate_lesson`, `generate_full_package` |
| RAG namespace scoping | `education-source`, `education`, `education-exports` isolation |
| Chat-bound events | Event output attached to originating conversation |
| Built-in tools | YAML-declared with type-safe parameters |

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| **content-analyzer** | Extracts concepts, headings, themes from source material | `extract_concepts` |
| **quiz-generator** | Generates grounded questions with answer keys | `generate_questions`, `validate_questions` |
| **lesson-builder** | Builds paced lesson plans with objectives | `build_lesson_structure`, `define_learning_objectives`, `format_lesson_section` |
| **format-exporter** | Exports artifacts as Markdown or plain text | `export_markdown`, `export_txt`, `write_file` |

## Example prompts

```
Generate a quiz from the uploaded chapter on photosynthesis.
→ content-analyzer extracts concepts, quiz-generator creates questions

Build a lesson plan for a 60-minute class on the French Revolution.
→ lesson-builder structures objectives, activities, assessment

Create a full teaching package for unit 3: Cellular Biology.
→ full_package skill chains all 4 agents

Export the lesson plan as Markdown.
→ format-exporter writes .md file

Generate 5 multiple-choice questions about the water cycle.
→ quiz-generator with validate step
```

## Running

```bash
cd orchid-ts && npm install && npm run build
cd ../examples-ts/education
npm install
npx tsc -p tsconfig.json
npm start
```

Requires: Node.js 20+, Ollama with `llama3.2` + `nomic-embed-text`, Qdrant for RAG.
