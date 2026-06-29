/**
 * Structural engineering tools for the architecture review example.
 *
 * Provides load estimates, code compliance checks, material comparisons,
 * and fire-safety strategy guidance.
 */

interface MaterialProps {
    strength_mpa: number;
    fire_rating_hours: number | string;
    carbon_kg_per_m3: number;
    cost_per_m2: number;
    span_limit_m: number;
}

const MATERIALS: Record<string, MaterialProps> = {
    "cross-laminated timber": {
        strength_mpa: 24,
        fire_rating_hours: 2,
        carbon_kg_per_m3: -650,
        cost_per_m2: 180,
        span_limit_m: 12,
    },
    "glulam beams": {
        strength_mpa: 28,
        fire_rating_hours: 1.5,
        carbon_kg_per_m3: -580,
        cost_per_m2: 150,
        span_limit_m: 30,
    },
    "reinforced concrete": {
        strength_mpa: 35,
        fire_rating_hours: 4,
        carbon_kg_per_m3: 350,
        cost_per_m2: 120,
        span_limit_m: 15,
    },
    "structural steel": {
        strength_mpa: 250,
        fire_rating_hours: "1 (unprotected)",
        carbon_kg_per_m3: 1850,
        cost_per_m2: 200,
        span_limit_m: 50,
    },
    "rammed earth": {
        strength_mpa: 4,
        fire_rating_hours: 4,
        carbon_kg_per_m3: 50,
        cost_per_m2: 300,
        span_limit_m: 4,
    },
    hempcrete: {
        strength_mpa: 1,
        fire_rating_hours: 2,
        carbon_kg_per_m3: -100,
        cost_per_m2: 250,
        span_limit_m: 3,
    },
};

interface CodeEntry {
    jurisdiction: string;
    material: string;
    key_constraints: string;
}

const CODES: Record<string, CodeEntry> = {
    "eurocode 2": {
        jurisdiction: "EU",
        material: "concrete",
        key_constraints: "minimum cover 25mm, crack control to 0.3mm",
    },
    "eurocode 3": {
        jurisdiction: "EU",
        material: "steel",
        key_constraints: "slenderness ratio < 180, fatigue assessment for dynamic loads",
    },
    "eurocode 5": {
        jurisdiction: "EU",
        material: "timber",
        key_constraints: "moisture content < 20%, creep factor 0.6 for indoor",
    },
    "ibc 2024": {
        jurisdiction: "US",
        material: "all",
        key_constraints: "seismic zone dependant, occupancy category multipliers",
    },
    "asce 7-22": {
        jurisdiction: "US",
        material: "all",
        key_constraints: "wind speed maps updated, tornado provisions added",
    },
    "bs 8500": {
        jurisdiction: "UK",
        material: "concrete",
        key_constraints: "exposure class XC3 typical for office, max w/c 0.55",
    },
};

export async function analyzeStructure(args: Record<string, unknown>): Promise<string | object> {
    const buildingType = String(args["building_type"] ?? "");
    const floors = Number(args["floors"] ?? 0);
    const areaM2 = Number(args["area_m2"] ?? 0);

    const liveLoad = buildingType.toLowerCase().includes("office") ? 3 : 5;

    return {
        building: {
            type: buildingType || "unspecified",
            floors,
            area_m2: areaM2,
        },
        load_estimates: {
            dead_load_kpa: floors * 7,
            live_load_kpa: liveLoad,
            total_load_kpa: floors * 7 + liveLoad,
        },
        recommended_systems: [floors > 4 ? "steel frame + CLT slabs" : "CLT + glulam"],
        span_requirements: {
            typical_m: 8,
            max_m: floors > 6 ? 12 : 10,
        },
    };
}

export async function checkCodeCompliance(args: Record<string, unknown>): Promise<string | object> {
    const jurisdiction = String(args["jurisdiction"] ?? "").toLowerCase();
    const material = String(args["material"] ?? "").toLowerCase();

    const applicable: Array<{ code: string } & CodeEntry> = [];
    for (const [codeName, code] of Object.entries(CODES)) {
        const codeNameLower = codeName.toLowerCase();
        const jurisLower = code.jurisdiction.toLowerCase();
        if (
            jurisdiction === "" ||
            jurisLower.includes(jurisdiction) ||
            codeNameLower.includes(jurisdiction)
        ) {
            if (!material || code.material.toLowerCase().includes(material)) {
                applicable.push({ code: codeName, ...code });
            }
        }
    }

    return {
        jurisdiction: args["jurisdiction"] ?? "",
        material: args["material"] ?? "",
        applicable_codes: applicable,
        count: applicable.length,
    };
}

export async function compareMaterials(args: Record<string, unknown>): Promise<string | object> {
    const materialA = String(args["material_a"] ?? "").toLowerCase();
    const materialB = String(args["material_b"] ?? "").toLowerCase();

    const a = MATERIALS[materialA];
    const b = MATERIALS[materialB];

    if (!a || !b) {
        return { error: "Material not found", available: Object.keys(MATERIALS) };
    }

    return {
        comparison: {
            [materialA]: a,
            [materialB]: b,
            strength_winner: a.strength_mpa > b.strength_mpa ? materialA : materialB,
            carbon_winner: a.carbon_kg_per_m3 < b.carbon_kg_per_m3 ? materialA : materialB,
            cost_winner: a.cost_per_m2 < b.cost_per_m2 ? materialA : materialB,
        },
    };
}

export async function getFireStrategy(args: Record<string, unknown>): Promise<string | object> {
    const material = String(args["material"] ?? "").toLowerCase();
    const floors = Number(args["floors"] ?? 0);

    const mat = MATERIALS[material];
    if (!mat) {
        return { error: `Material '${args["material"]}' not found` };
    }

    const rating = mat.fire_rating_hours;
    const intrinsicNumeric = typeof rating === "number";

    return {
        material: args["material"] ?? "",
        intrinsic_rating_hours: rating,
        minimum_protection:
            intrinsicNumeric && rating >= 2
                ? "none"
                : "intumescent coating or encasement",
        evacuation_strategy: floors > 6 ? "defend-in-place" : "simultaneous evacuation",
        sprinkler_recommended: floors > 3 || !intrinsicNumeric,
    };
}
