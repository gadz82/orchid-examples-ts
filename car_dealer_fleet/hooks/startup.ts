/**
 * Startup hook — builds an expert agent fleet from content sources.
 *
 * This hook runs at bootstrap time (before the graph is built). It:
 *
 * 1. Reads car specification documents from the data/ directory.
 * 2. Groups specs by brand and generates agent configurations.
 * 3. Persists the configs to SQLite so that mergeFromDb() picks them up.
 *
 * The agents are configured entirely in this hook — they do not appear
 * in agents.yaml. The yaml only enables config_storage with an empty
 * agents: {} dict.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OrchidConfigStorage } from "@orchid-ai/orchid/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AgentConfig {
    name: string;
    description: string;
    prompt: string;
}

interface CarSpec {
    brand: string;
    model: string;
    filename: string;
    content: string;
}

function dataDir(): string {
    return resolve(__dirname, "..", "data");
}

function loadSpecs(): CarSpec[] {
    const dir = dataDir();
    let files: string[];
    try {
        files = readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
    } catch {
        console.warn("[FleetBuilder] data/ directory not found at %s — using empty dataset", dir);
        return [];
    }

    const specs: CarSpec[] = [];
    for (const file of files) {
        try {
            const content = readFileSync(join(dir, file), "utf-8");
            const brand = detectBrand(file, content);
            const model = detectModel(file, content);
            specs.push({ brand, model, filename: file, content });
        } catch {
            continue;
        }
    }

    console.info("[FleetBuilder] Loaded %d spec files from data/", specs.length);
    return specs;
}

function detectBrand(filename: string, content: string): string {
    const lower = (filename + " " + content.slice(0, 200)).toLowerCase();
    if (lower.includes("toyota") || lower.includes("camry") || lower.includes("corolla") || lower.includes("rav4")) return "Toyota";
    if (lower.includes("ford") || lower.includes("f-150") || lower.includes("f150") || lower.includes("mustang")) return "Ford";
    if (lower.includes("volkswagen") || lower.includes("golf") || lower.includes("tiguan") || lower.includes("passat")) return "Volkswagen";
    if (lower.includes("bmw")) return "BMW";
    if (lower.includes("audi")) return "Audi";
    if (lower.includes("honda") || lower.includes("accord") || lower.includes("civic")) return "Honda";
    return "Unknown";
}

function detectModel(filename: string, content: string): string {
    const headingMatch = content.match(/^#\s+\d{4}\s+(.+?)(?:\s*[—–-]\s*Technical)/m);
    if (headingMatch) return headingMatch[1].trim();
    const base = filename.replace(/[-_]\d{4}.*$/, "").replace(/[-_]/g, " ");
    return base.charAt(0).toUpperCase() + base.slice(1);
}

function groupByBrand(specs: CarSpec[]): Map<string, CarSpec[]> {
    const grouped = new Map<string, CarSpec[]>();
    for (const spec of specs) {
        const brand = spec.brand;
        if (!grouped.has(brand)) {
            grouped.set(brand, []);
        }
        grouped.get(brand)!.push(spec);
    }
    return grouped;
}

function generateAgentPrompt(brand: string, specs: CarSpec[]): string {
    const specTexts = specs.map((s) => `### ${s.model}\n\n${s.content}`).join("\n\n---\n\n");

    return `You are the ${brand} vehicle expert at a car dealership.

You have deep knowledge of the following ${brand} models:
${specs.map((s) => `- ${s.model}`).join("\n")}

Key Specifications:

${specTexts}

RULES:
1. Answer questions accurately using ONLY the specifications above.
2. Always cite the source document when providing technical details.
3. If asked about a model not listed, say you don't have information on that specific model.
4. You can compare across brands when asked, but focus on ${brand}'s strengths.
5. Be accurate, helpful, and concise.`;
}

function generateAgentConfig(brand: string, specs: CarSpec[]): AgentConfig {
    const name = brand.toLowerCase().replace(/\s+/g, "-") + "-expert";
    const description = `Specialist in ${brand} vehicles. Use for questions about ${specs.map((s) => s.model).join(", ")}.`;
    const prompt = generateAgentPrompt(brand, specs);

    return { name, description, prompt };
}

async function clearExistingAgents(configStorage: OrchidConfigStorage): Promise<void> {
    try {
        const existing = await configStorage.listConfigs();
        for (const record of existing) {
            await configStorage.deleteConfig(record.name);
        }
        if (existing.length > 0) {
            console.info("[FleetBuilder] Deleted %d existing agent(s)", existing.length);
        }
    } catch (err) {
        console.warn("[FleetBuilder] Failed to clear existing agents: %s", err);
    }
}

async function persistConfigs(configStorage: OrchidConfigStorage, configs: AgentConfig[]): Promise<void> {
    for (const cfg of configs) {
        await configStorage.upsertConfig(cfg.name, {
            name: cfg.name,
            description: cfg.description,
            prompt: cfg.prompt,
            class: null,
            rag: { enabled: false },
            mcpServers: [],
            llm: null,
            executionHints: {},
            tools: ["get_model_specs", "compare_models"],
            skills: {},
            guardrails: {},
            children: null,
            parallelTools: false,
            maxToolRounds: 15,
            maxConsecutiveDupes: 2,
            maxSkillDepth: 3,
            miniAgent: { enabled: false },
            promptSections: {},
        });
    }
    console.info("[FleetBuilder] Persisted %d agent(s) to config storage", configs.length);
}

/**
 * Startup hook entry point.
 *
 * Called by the API's runStartupHooks() during bootstrap.
 * The hook receives the Orchid instance and accesses configStorage from it.
 */
export default async function buildFleet(orchid: any): Promise<void> {
    console.info("[FleetBuilder] Startup hook called with orchid:", !!orchid);
    console.info("[FleetBuilder] orchid keys:", orchid ? Object.keys(orchid) : "null");

    // Access configStorage from the Orchid instance
    const configStorage = orchid?._configStorage || orchid?.configStorage;
    console.info("[FleetBuilder] configStorage:", !!configStorage);

    if (!configStorage) {
        console.warn("[FleetBuilder] No config storage available — skipping fleet build");
        return;
    }

    // Load specs from data directory
    const specs = loadSpecs();
    if (specs.length === 0) {
        console.warn("[FleetBuilder] No specs found — skipping fleet build");
        return;
    }

    // Clear existing agents (clean slate)
    await clearExistingAgents(configStorage);

    // Group specs by brand
    const grouped = groupByBrand(specs);

    // Generate agent configs
    const configs: AgentConfig[] = [];
    for (const [brand, brandSpecs] of grouped) {
        const cfg = generateAgentConfig(brand, brandSpecs);
        configs.push(cfg);
        console.info("[FleetBuilder] Generated agent: %s — %s", cfg.name, cfg.description);
    }

    // Persist to config storage
    await persistConfigs(configStorage, configs);

    console.info("[FleetBuilder] Expert fleet created: %s", configs.map((c) => c.name).join(", "));
}
