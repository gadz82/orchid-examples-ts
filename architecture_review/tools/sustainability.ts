/**
 * Sustainability tools for the architecture review example.
 *
 * Provides certification evaluation, embodied-carbon calculations,
 * green strategy recommendations, and carbon-footprint comparisons.
 */

interface CertificationEntry {
    levels: string[];
    focus: string;
    key_categories: string[];
}

interface CarbonEntry {
    embodied_kgco2_per_m3: number;
    biogenic_kgco2_per_m3: number;
    recyclable: boolean | string;
    epd_certified: boolean;
}

interface StrategyEntry {
    name: string;
    savings_percent: number;
    applicable_to: string;
    upfront_cost: string;
}

const CERTIFICATIONS: Record<string, CertificationEntry> = {
    breeam: {
        levels: ["Pass", "Good", "Very Good", "Excellent", "Outstanding"],
        focus: "Europe",
        key_categories: ["Energy", "Water", "Materials", "Ecology", "Pollution"],
    },
    leed: {
        levels: ["Certified", "Silver", "Gold", "Platinum"],
        focus: "North America",
        key_categories: ["Energy & Atmosphere", "Materials", "Indoor Quality", "Water", "Location"],
    },
    dgnb: {
        levels: ["Bronze", "Silver", "Gold", "Platinum"],
        focus: "Germany / EU",
        key_categories: ["LCA", "Economic Quality", "Sociocultural Quality", "Technical Quality"],
    },
    well: {
        levels: ["Silver", "Gold", "Platinum"],
        focus: "Global",
        key_categories: ["Air", "Water", "Light", "Comfort", "Mind", "Nourishment"],
    },
};

const MATERIAL_CARBON: Record<string, CarbonEntry> = {
    "cross-laminated timber": {
        embodied_kgco2_per_m3: 110,
        biogenic_kgco2_per_m3: -760,
        recyclable: true,
        epd_certified: true,
    },
    "reinforced concrete": {
        embodied_kgco2_per_m3: 350,
        biogenic_kgco2_per_m3: 0,
        recyclable: "crushed aggregate only",
        epd_certified: true,
    },
    "structural steel": {
        embodied_kgco2_per_m3: 1850,
        biogenic_kgco2_per_m3: 0,
        recyclable: true,
        epd_certified: true,
    },
    "glulam beams": {
        embodied_kgco2_per_m3: 130,
        biogenic_kgco2_per_m3: -580,
        recyclable: false,
        epd_certified: true,
    },
    "rammed earth": {
        embodied_kgco2_per_m3: 50,
        biogenic_kgco2_per_m3: 0,
        recyclable: true,
        epd_certified: false,
    },
};

const STRATEGIES: StrategyEntry[] = [
    { name: "Passive ventilation", savings_percent: 25, applicable_to: "all", upfront_cost: "low" },
    { name: "Green roof (extensive)", savings_percent: 10, applicable_to: "low-rise", upfront_cost: "medium" },
    { name: "Triple glazing + thermal break", savings_percent: 30, applicable_to: "all", upfront_cost: "high" },
    { name: "Solar PV (roof-mounted)", savings_percent: 40, applicable_to: "flat/south-facing roof", upfront_cost: "high" },
    { name: "Ground-source heat pump", savings_percent: 50, applicable_to: "site with borehole access", upfront_cost: "high" },
    { name: "Rainwater harvesting", savings_percent: 30, applicable_to: "all", upfront_cost: "medium" },
    { name: "Dynamic solar shading", savings_percent: 15, applicable_to: "south/west facades", upfront_cost: "medium" },
];

export async function evaluateCertification(
    args: Record<string, unknown>,
): Promise<string | object> {
    const certification = String(args["certification"] ?? "").toLowerCase();
    const targetLevel = String(args["target_level"] ?? "");
    const areaM2 = Number(args["area_m2"] ?? 0);

    const cert = CERTIFICATIONS[certification];
    if (!cert) {
        return { error: `'${args["certification"]}' not found`, available: Object.keys(CERTIFICATIONS) };
    }

    const target = targetLevel || cert.levels[0];
    const isTopLevel = targetLevel.toLowerCase() === cert.levels[cert.levels.length - 1].toLowerCase();

    return {
        certification: certification.toUpperCase(),
        available_levels: cert.levels,
        target,
        focus_region: cert.focus,
        key_categories: cert.key_categories,
        estimated_cost: certification === "breeam" || certification === "dgnb" ? areaM2 * 15 : areaM2 * 12,
        estimated_timeline_weeks: isTopLevel ? 20 : 12,
    };
}

export async function calculateEmbodiedCarbon(
    args: Record<string, unknown>,
): Promise<string | object> {
    const material = String(args["material"] ?? "").toLowerCase();
    const volumeM3 = Number(args["volume_m3"] ?? 0);

    const mat = MATERIAL_CARBON[material];
    if (!mat) {
        return {
            error: `No carbon data for '${args["material"]}'`,
            available_materials: Object.keys(MATERIAL_CARBON),
        };
    }

    const embodied = mat.embodied_kgco2_per_m3 * volumeM3;
    const biogenic = mat.biogenic_kgco2_per_m3 ? mat.biogenic_kgco2_per_m3 * volumeM3 : 0;

    return {
        material: args["material"] ?? "",
        volume_m3: volumeM3,
        embodied_kgco2: embodied,
        biogenic_kgco2: biogenic,
        net_kgco2: embodied + biogenic,
        epd_certified: mat.epd_certified,
        recyclability: mat.recyclable,
    };
}

export async function getSustainabilityStrategies(
    args: Record<string, unknown>,
): Promise<string | object> {
    const buildingType = String(args["building_type"] ?? "").toLowerCase();
    const climateZone = String(args["climate_zone"] ?? "");

    const applicable = STRATEGIES.filter(
        (s) => s.applicable_to === "all" || s.applicable_to.includes(buildingType),
    );

    const top = applicable.slice(0, 3);
    const avg =
        top.length > 0
            ? Math.floor(top.reduce((sum, s) => sum + s.savings_percent, 0) / top.length)
            : 0;

    return {
        building_type: args["building_type"] ?? "",
        climate_zone: climateZone,
        recommended_strategies: applicable,
        estimated_combined_savings_percent: avg,
    };
}

export async function compareCarbonFootprints(
    args: Record<string, unknown>,
): Promise<string | object> {
    const options = String(args["options"] ?? "");

    const results: Record<string, { volume_m3: number; embodied_kgco2: number; biogenic_kgco2: number; net_kgco2: number }> = {};

    for (const opt of options.split(",")) {
        const trimmed = opt.trim();
        if (!trimmed) continue;

        const lastSpace = trimmed.lastIndexOf(" ");
        const mat = lastSpace === -1 ? trimmed : trimmed.slice(0, lastSpace).trim();
        const volText = lastSpace === -1 ? "100" : trimmed.slice(lastSpace + 1).trim();
        const vol = Number.isNaN(Number(volText)) ? 100 : Number(volText);

        const carbon = MATERIAL_CARBON[mat.toLowerCase()];
        if (!carbon) continue;

        results[mat] = {
            volume_m3: vol,
            embodied_kgco2: carbon.embodied_kgco2_per_m3 * vol,
            biogenic_kgco2: carbon.biogenic_kgco2_per_m3 * vol,
            net_kgco2: (carbon.embodied_kgco2_per_m3 + carbon.biogenic_kgco2_per_m3) * vol,
        };
    }

    if (Object.keys(results).length === 0) {
        return { error: "No valid material-volume pairs provided", format: "material1 100, material2 200" };
    }

    const winner = Object.entries(results).reduce((best, current) =>
        current[1].net_kgco2 < best[1].net_kgco2 ? current : best,
    )[0];

    return { comparison: results, winner };
}
