/**
 * Built-in tools for the car-dealer-fleet example.
 *
 * Reads car specification documents from the data/ directory at runtime,
 * matching the Python version's content-source approach.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ModelSpec {
    readonly brand: string;
    readonly model: string;
    readonly filename: string;
    readonly content: string;
}

let _specsCache: ModelSpec[] | null = null;

function dataDir(): string {
    return resolve(__dirname, "..", "data");
}

function loadSpecs(): ModelSpec[] {
    if (_specsCache) return _specsCache;

    const dir = dataDir();
    let files: string[];
    try {
        files = readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
    } catch {
        console.warn("[dealer] data/ directory not found at %s — using empty dataset", dir);
        _specsCache = [];
        return _specsCache;
    }

    const specs: ModelSpec[] = [];
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

    _specsCache = specs;
    console.info("[dealer] Loaded %d spec files from data/", specs.length);
    return _specsCache;
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
    // Try to extract model name from the first heading or filename
    const headingMatch = content.match(/^#\s+\d{4}\s+(.+?)(?:\s*[—–-]\s*Technical)/m);
    if (headingMatch) return headingMatch[1].trim();
    // Fallback: derive from filename (e.g. "camry-2025-specs.md" → "Camry")
    const base = filename.replace(/[-_]\d{4}.*$/, "").replace(/[-_]/g, " ");
    return base.charAt(0).toUpperCase() + base.slice(1);
}

function findModel(query: string): ModelSpec | null {
    const specs = loadSpecs();
    const q = query.trim().toLowerCase();
    if (!q) return null;

    // Exact model name match
    for (const spec of specs) {
        if (spec.model.toLowerCase() === q) return spec;
    }
    // Partial match on model name, brand, or filename
    for (const spec of specs) {
        const haystack = `${spec.model} ${spec.brand} ${spec.filename}`.toLowerCase();
        if (haystack.includes(q) || q.includes(spec.model.toLowerCase())) {
            return spec;
        }
    }
    return null;
}

export async function getModelSpecs(args: Record<string, unknown>): Promise<unknown> {
    const model = String(args.model ?? args.query ?? "").trim();
    const spec = findModel(model);
    if (!spec) {
        const available = loadSpecs().map((s) => `${s.brand} ${s.model}`);
        return {
            error: `Model '${model}' not found in our specification documents`,
            available_models: available,
        };
    }
    return {
        brand: spec.brand,
        model: spec.model,
        source_file: spec.filename,
        specifications: spec.content,
    };
}

export async function compareModels(args: Record<string, unknown>): Promise<unknown> {
    const a = findModel(String(args.model_a ?? ""));
    const b = findModel(String(args.model_b ?? ""));
    const missing: string[] = [];
    if (!a) missing.push(String(args.model_a ?? ""));
    if (!b) missing.push(String(args.model_b ?? ""));
    if (missing.length > 0) {
        const available = loadSpecs().map((s) => `${s.brand} ${s.model}`);
        return { error: `Model(s) not found: ${missing.join(", ")}`, available_models: available };
    }
    return {
        model_a: { brand: a!.brand, model: a!.model, specifications: a!.content },
        model_b: { brand: b!.brand, model: b!.model, specifications: b!.content },
        summary: `${a!.brand} ${a!.model} vs ${b!.brand} ${b!.model}`,
    };
}
