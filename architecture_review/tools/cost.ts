/**
 * Construction-cost tools for the architecture review example.
 *
 * Provides construction cost estimates, lifecycle cost comparisons,
 * and regional market-rate lookups.
 */

interface RateEntry {
    low: number;
    medium: number;
    high: number;
}

interface LifecycleEntry {
    initial: number;
    maintenance_annual: number;
    lifespan_years: number;
}

interface RegionEntry {
    labour_per_hour: number;
    material_multiplier: number;
    planning_weeks: number;
}

const RATES: Record<string, RateEntry> = {
    office: { low: 1800, medium: 2500, high: 3500 },
    residential: { low: 1500, medium: 2200, high: 3200 },
    mixed_use: { low: 2000, medium: 2800, high: 4000 },
};

const LIFECYCLE: Record<string, LifecycleEntry> = {
    "cross-laminated timber": { initial: 180, maintenance_annual: 3, lifespan_years: 60 },
    "reinforced concrete": { initial: 120, maintenance_annual: 5, lifespan_years: 100 },
    "structural steel": { initial: 200, maintenance_annual: 8, lifespan_years: 80 },
    "glulam beams": { initial: 150, maintenance_annual: 4, lifespan_years: 50 },
};

const REGIONS: Record<string, RegionEntry> = {
    london: { labour_per_hour: 45, material_multiplier: 1.3, planning_weeks: 16 },
    berlin: { labour_per_hour: 38, material_multiplier: 1.1, planning_weeks: 12 },
    "new york": { labour_per_hour: 65, material_multiplier: 1.4, planning_weeks: 20 },
    tokyo: { labour_per_hour: 55, material_multiplier: 1.5, planning_weeks: 14 },
    paris: { labour_per_hour: 42, material_multiplier: 1.2, planning_weeks: 13 },
};

export async function estimateConstructionCost(
    args: Record<string, unknown>,
): Promise<string | object> {
    const buildingType = String(args["building_type"] ?? "").toLowerCase();
    const areaM2 = Number(args["area_m2"] ?? 0);
    const quality = String(args["quality"] ?? "medium").toLowerCase();

    const btype = RATES[buildingType] ? buildingType : "office";
    const rate = RATES[btype][quality as keyof RateEntry] ?? RATES[btype].medium;
    const total = areaM2 * rate;

    return {
        building_type: btype,
        quality,
        area_m2: areaM2,
        rate_per_m2: rate,
        total_estimate: total,
        breakdown: {
            structure: Math.round(total * 0.3),
            facade: Math.round(total * 0.18),
            mechanical: Math.round(total * 0.15),
            electrical: Math.round(total * 0.1),
            interior: Math.round(total * 0.15),
            contingency: Math.round(total * 0.12),
        },
    };
}

export async function compareLifecycleCosts(
    args: Record<string, unknown>,
): Promise<string | object> {
    const material = String(args["material"] ?? "").toLowerCase();
    const areaM2 = Number(args["area_m2"] ?? 0);

    const mat = LIFECYCLE[material];
    if (!mat) {
        return { error: `No lifecycle data for '${args["material"]}'` };
    }

    const init = mat.initial * areaM2;
    const maint = mat.maintenance_annual * areaM2 * Math.floor(mat.lifespan_years / 10);

    return {
        material: args["material"] ?? "",
        area_m2: areaM2,
        initial_cost: init,
        maintenance_30yr: maint,
        total_30yr: init + maint,
        lifespan_years: mat.lifespan_years,
    };
}

export async function getMarketRates(args: Record<string, unknown>): Promise<string | object> {
    const region = String(args["region"] ?? "").toLowerCase();

    const r = REGIONS[region];
    if (!r) {
        return {
            error: `No data for region '${args["region"]}'`,
            available_regions: Object.keys(REGIONS),
        };
    }

    return { region: args["region"] ?? "", ...r };
}
