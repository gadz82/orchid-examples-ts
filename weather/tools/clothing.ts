/**
 * Built-in clothing recommendation tools for the weather example.
 *
 * Provides outfit recommendations based on weather conditions (temperature,
 * precipitation, wind, UV index) and activity type.
 */

export interface OutfitResult {
    conditions: string;
    activity: string;
    outfit: {
        tops: string[];
        bottoms: string[];
        footwear: string[];
        outerwear: string[];
        accessories: string[];
    };
}

function clothingForTemp(
    tempC: number,
    precipPct: number,
    windKmh: number,
): OutfitResult["outfit"] {
    const windy = windKmh > 30;
    const rainy = precipPct > 50;

    let tops: string[];
    let bottoms: string[];
    let footwear: string[];
    let outerwear: string[];
    let accessories: string[];

    if (tempC >= 30) {
        tops = ["tank top", "light t-shirt", "linen shirt"];
        bottoms = ["shorts", "light skirt", "linen pants"];
        footwear = ["sandals", "flip-flops", "light sneakers"];
        outerwear = rainy ? ["light rain jacket"] : ["none — it's hot"];
        accessories = ["sunglasses", "sun hat", "sunscreen SPF 50+", "water bottle"];
    } else if (tempC >= 20) {
        tops = ["t-shirt", "polo shirt", "light blouse"];
        bottoms = ["shorts", "chinos", "midi skirt"];
        footwear = ["sneakers", "loafers", "sandals"];
        outerwear = rainy ? ["rain jacket"] : ["light cardigan for evening"];
        accessories = ["sunglasses", "sunscreen SPF 30+"];
    } else if (tempC >= 10) {
        tops = ["long-sleeve shirt", "light sweater", "button-up"];
        bottoms = ["jeans", "chinos", "trousers"];
        footwear = ["sneakers", "loafers", "ankle boots"];
        outerwear = rainy ? ["waterproof jacket"] : ["light jacket", "denim jacket"];
        accessories = ["light scarf (optional)"];
    } else if (tempC >= 0) {
        tops = ["thermal base layer", "sweater", "turtleneck"];
        bottoms = ["jeans", "wool trousers", "fleece-lined pants"];
        footwear = rainy ? ["boots", "waterproof shoes"] : ["leather boots"];
        outerwear = rainy ? ["waterproof winter coat"] : ["warm coat", "puffer jacket"];
        accessories = ["scarf", "gloves", "beanie"];
    } else {
        tops = ["heavy thermal base", "thick sweater", "fleece"];
        bottoms = ["thermal leggings under pants", "insulated snow pants"];
        footwear = ["insulated snow boots", "waterproof winter boots"];
        outerwear = ["heavy parka", "down coat", "windproof shell"];
        accessories = ["thick scarf", "insulated gloves", "wool hat", "hand warmers"];
    }

    if (windy && !rainy) {
        outerwear.push("windbreaker layer");
        accessories.push("secure loose items — it's windy");
    }

    if (rainy) {
        accessories.push("umbrella", "waterproof bag cover");
        if (tempC < 15 && !footwear.some((f) => f.includes("waterproof"))) {
            footwear = ["waterproof boots"];
        }
    }

    return { tops, bottoms, footwear, outerwear, accessories };
}

function clothingForActivity(
    activity: string,
    clothes: OutfitResult["outfit"],
): OutfitResult["outfit"] {
    const a = activity.toLowerCase().trim();

    if (["running", "jogging", "workout", "gym"].some((k) => a.includes(k))) {
        clothes.tops = ["moisture-wicking athletic shirt", ...clothes.tops];
        clothes.bottoms = ["athletic shorts", "running tights"];
        clothes.footwear = ["running shoes", "training shoes"];
    } else if (["hiking", "trail", "outdoor"].some((k) => a.includes(k))) {
        clothes.footwear = ["hiking boots", "trail shoes", ...clothes.footwear];
        clothes.accessories.push("backpack with water and snacks");
    } else if (["business", "office", "formal", "work"].some((k) => a.includes(k))) {
        clothes.tops = ["dress shirt", "blazer-ready top"];
        clothes.bottoms = ["dress pants", "tailored trousers"];
        clothes.footwear = ["dress shoes", "formal boots"];
    } else if (["beach", "swim", "pool"].some((k) => a.includes(k))) {
        clothes.tops = ["swim top", "tank top"];
        clothes.bottoms = ["swim shorts", "board shorts"];
        clothes.footwear = ["flip-flops", "water shoes"];
        clothes.accessories.push("beach towel", "sunscreen SPF 50+");
    }

    return clothes;
}

export async function recommendOutfit(args: Record<string, unknown>): Promise<OutfitResult> {
    const tempC = Number(args["temperature_c"] ?? args["temperature"] ?? 20);
    const precipPct = Number(args["precipitation_chance"] ?? args["precip_pct"] ?? 0);
    const windKmh = Number(args["wind_speed_kmh"] ?? args["wind_kmh"] ?? 0);
    const uvIndex = Number(args["uv_index"] ?? 0);
    const activity = String(args["activity"] ?? "casual");

    if (Number.isNaN(tempC) || Number.isNaN(precipPct) || Number.isNaN(windKmh) || Number.isNaN(uvIndex)) {
        throw new Error("Invalid numeric values for weather parameters.");
    }

    let clothes = clothingForTemp(tempC, precipPct, windKmh);
    clothes = clothingForActivity(activity, clothes);

    if (uvIndex > 6) {
        clothes.accessories.push("high-SPF sunscreen", "UV-protective sunglasses");
        if (!clothes.accessories.some((x) => x.includes("sunglasses"))) {
            clothes.accessories.push("sunglasses");
        }
    }

    const conditions: string[] = [`${tempC}°C`];
    if (precipPct > 0) conditions.push(`${precipPct}% rain chance`);
    if (windKmh > 0) conditions.push(`${windKmh} km/h wind`);
    if (uvIndex > 0) conditions.push(`UV ${uvIndex}`);

    return {
        conditions: conditions.join(", "),
        activity,
        outfit: clothes,
    };
}
