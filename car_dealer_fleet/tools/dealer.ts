/**
 * Built-in tools for the car-dealer-fleet example.
 *
 * In-memory demo data used by the static expert agents.
 */

interface ModelSpec {
    readonly brand: string;
    readonly model: string;
    readonly mpg: string;
    readonly engine: string;
    readonly notes: string;
}

const MODELS: Record<string, ModelSpec> = {
    camry: {
        brand: "Toyota",
        model: "Camry",
        mpg: "28 city / 39 highway",
        engine: "2.5L inline-4",
        notes: "Reliable midsize sedan; hybrid available.",
    },
    corolla: {
        brand: "Toyota",
        model: "Corolla",
        mpg: "32 city / 41 highway",
        engine: "2.0L inline-4",
        notes: "Compact sedan/hatchback.",
    },
    "f-150": {
        brand: "Ford",
        model: "F-150",
        mpg: "19 city / 24 highway",
        engine: "3.5L EcoBoost V6",
        notes: "Best-selling full-size truck; high towing capacity.",
    },
    mustang: {
        brand: "Ford",
        model: "Mustang",
        mpg: "21 city / 32 highway",
        engine: "2.3L EcoBoost inline-4",
        notes: "Iconic American sports coupe.",
    },
    golf: {
        brand: "Volkswagen",
        model: "Golf",
        mpg: "29 city / 39 highway",
        engine: "1.4L turbo inline-4",
        notes: "Compact hatchback; GTI hot-hatch variant.",
    },
    tiguan: {
        brand: "Volkswagen",
        model: "Tiguan",
        mpg: "23 city / 30 highway",
        engine: "2.0L turbo inline-4",
        notes: "Compact SUV with available third row.",
    },
};

function findModel(query: string): ModelSpec | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (MODELS[q]) return MODELS[q];
    for (const [key, spec] of Object.entries(MODELS)) {
        if (key.includes(q) || q.includes(key) || spec.model.toLowerCase().includes(q)) {
            return spec;
        }
    }
    return null;
}

export async function getModelSpecs(args: Record<string, unknown>): Promise<unknown> {
    const model = String(args.model ?? args.query ?? "").trim();
    const spec = findModel(model);
    if (!spec) {
        return {
            error: `Model '${model}' not found in demo dataset`,
            available: Object.values(MODELS).map((m) => `${m.brand} ${m.model}`),
        };
    }
    return { ...spec };
}

export async function compareModels(args: Record<string, unknown>): Promise<unknown> {
    const a = findModel(String(args.model_a ?? ""));
    const b = findModel(String(args.model_b ?? ""));
    const missing: string[] = [];
    if (!a) missing.push(String(args.model_a ?? ""));
    if (!b) missing.push(String(args.model_b ?? ""));
    if (missing.length > 0) {
        return { error: `Model(s) not found: ${missing.join(", ")}` };
    }
    return { model_a: a, model_b: b, summary: `${a?.brand} ${a?.model} vs ${b?.brand} ${b?.model}` };
}
