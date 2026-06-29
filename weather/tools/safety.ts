/**
 * Built-in safety recommendation tools for the weather example.
 *
 * Provides safety tips and risk assessment for extreme weather conditions.
 */

export interface SafetyGuide {
    immediate: string[];
    preparation: string[];
    signs_of_distress: string[];
}

export interface SafetyTipsResult {
    hazard: string;
    recommendations: SafetyGuide;
}

export interface RiskResult {
    overall_risk: string;
    risks: Array<{ hazard: string; level: string; detail: string }>;
    summary: string;
}

const SAFETY_GUIDES: Record<string, SafetyGuide> = {
    heatwave: {
        immediate: [
            "Stay indoors in air-conditioned spaces during peak heat (11am-4pm)",
            "Drink water regularly — don't wait until you're thirsty",
            "Avoid strenuous outdoor activities",
            "Never leave children or pets in parked vehicles",
        ],
        preparation: [
            "Check on elderly neighbours and vulnerable family members",
            "Close curtains and blinds on sun-facing windows",
            "Use fans with a bowl of ice for evaporative cooling",
            "Identify nearby cooling centres or public air-conditioned spaces",
        ],
        signs_of_distress: [
            "Heat exhaustion: heavy sweating, weakness, nausea, headache",
            "Heat stroke: hot/dry skin, confusion, loss of consciousness — CALL EMERGENCY SERVICES",
        ],
    },
    extreme_cold: {
        immediate: [
            "Stay indoors and keep warm",
            "Layer clothing: base layer (moisture-wicking), mid layer (insulation), outer layer (wind/waterproof)",
            "Cover extremities: wear hat, scarf, gloves, warm socks",
            "Limit time outdoors to less than 15-20 minutes",
        ],
        preparation: [
            "Insulate pipes to prevent freezing",
            "Keep emergency heating source (safe indoor heater, extra blankets)",
            "Stock emergency food and water for 3+ days",
            "Keep phones charged and have a battery-powered radio",
        ],
        signs_of_distress: [
            "Frostbite: numbness, white/greyish skin, firm/waxy feel — warm gradually, seek medical help",
            "Hypothermia: shivering, confusion, drowsiness, slurred speech — CALL EMERGENCY SERVICES",
        ],
    },
    storm: {
        immediate: [
            "Seek shelter indoors, away from windows",
            "Avoid using corded phones and electrical appliances",
            "Stay away from plumbing (sinks, baths) during lightning",
            "If driving, pull over safely, avoid trees and power lines",
        ],
        preparation: [
            "Secure outdoor furniture and loose items",
            "Charge devices and have power banks ready",
            "Keep flashlights and batteries accessible",
            "Know how to manually open garage doors",
        ],
        signs_of_distress: [
            "Flooding: move to higher ground, never walk or drive through flood water",
            "Downed power lines: stay at least 10m away, report immediately",
        ],
    },
    flood: {
        immediate: [
            "Move to higher ground immediately",
            "NEVER walk, swim, or drive through flood waters — 15cm of water can knock you down",
            "Avoid contact with flood water (contamination, debris, hidden hazards)",
            "Disconnect electrical appliances if safe to do so",
        ],
        preparation: [
            "Know your evacuation route and meeting point",
            "Prepare a go-bag: documents, medications, water, non-perishable food, flashlight, batteries",
            "Move valuables to upper floors",
            "Sandbag doorways and low openings",
        ],
        signs_of_distress: [
            "Rapidly rising water: evacuate immediately, don't wait for official notice",
            "Muddy or debris-filled water indicates upstream flooding",
        ],
    },
    blizzard: {
        immediate: [
            "Stay indoors — whiteout conditions make travel extremely dangerous",
            "Keep all doors and windows closed",
            "Run water at a trickle to prevent pipe freezing",
            "Use safe heating — never use outdoor grills or generators indoors",
        ],
        preparation: [
            "Stock 3+ days of food, water, and medications",
            "Have snow shovels and ice melt ready",
            "Keep vehicles full of fuel",
            "Have emergency blankets and warm clothing accessible",
        ],
        signs_of_distress: [
            "Carbon monoxide poisoning: headache, dizziness, nausea — ventilate and seek fresh air immediately",
        ],
    },
    hurricane: {
        immediate: [
            "Evacuate if ordered by authorities — do not wait",
            "If staying, shelter in an interior room without windows",
            "Fill bathtub and containers with water for sanitation",
            "Turn off propane tanks and secure loose outdoor items",
        ],
        preparation: [
            "Board up windows or install storm shutters",
            "Prepare emergency kit: water (1 gallon/person/day, 3+ days), food, medications, documents",
            "Fill vehicles with fuel, have cash on hand",
            "Know your evacuation zone and route",
        ],
        signs_of_distress: [
            "Eye of the storm: temporary calm does NOT mean it's over — stay sheltered",
            "Storm surge: the leading cause of hurricane deaths — evacuate coastal areas immediately",
        ],
    },
};

export async function getSafetyTips(args: Record<string, unknown>): Promise<SafetyTipsResult> {
    const hazard = String(args["hazard"] ?? args["hazard_type"] ?? "").toLowerCase().trim();

    const guide = SAFETY_GUIDES[hazard];
    if (!guide) {
        const available = Object.keys(SAFETY_GUIDES).sort().join(", ");
        throw new Error(`Unknown hazard '${hazard}'. Available: ${available}`);
    }

    return { hazard, recommendations: guide };
}

function riskOrder(level: string): number {
    return { low: 0, moderate: 1, high: 2, extreme: 3 }[level] ?? 0;
}

function riskSummary(level: string): string {
    const summaries: Record<string, string> = {
        low: "Conditions are normal. No special precautions needed.",
        moderate: "Some weather hazards present. Take basic precautions and stay informed.",
        high: "Dangerous weather conditions. Limit outdoor activities, prepare emergency supplies, and monitor official alerts.",
        extreme: "Life-threatening weather conditions. Seek shelter immediately and follow emergency services instructions.",
    };
    return summaries[level] ?? summaries["low"];
}

export async function assessWeatherRisk(args: Record<string, unknown>): Promise<RiskResult> {
    const tempC = Number(args["temperature_c"] ?? args["temperature"] ?? 20);
    const windKmh = Number(args["wind_speed_kmh"] ?? args["wind_kmh"] ?? 0);
    const precipMm = Number(args["precipitation_mm"] ?? args["rain_mm"] ?? 0);
    const weatherCode = String(args["weather_code"] ?? args["condition"] ?? "");

    if (Number.isNaN(tempC) || Number.isNaN(windKmh) || Number.isNaN(precipMm)) {
        throw new Error("Invalid numeric values for weather parameters.");
    }

    const risks: RiskResult["risks"] = [];
    let overall = "low";

    function upsertOverall(level: string): void {
        if (riskOrder(level) > riskOrder(overall)) {
            overall = level;
        }
    }

    if (tempC >= 40) {
        risks.push({ hazard: "extreme_heat", level: "extreme", detail: `${tempC}°C — life-threatening heat` });
        overall = "extreme";
    } else if (tempC >= 35) {
        risks.push({ hazard: "heatwave", level: "high", detail: `${tempC}°C — dangerous heat, limit outdoor exposure` });
        upsertOverall("high");
    } else if (tempC >= 30) {
        risks.push({ hazard: "hot", level: "moderate", detail: `${tempC}°C — stay hydrated, seek shade` });
        upsertOverall("moderate");
    } else if (tempC < -20) {
        risks.push({ hazard: "extreme_cold", level: "extreme", detail: `${tempC}°C — life-threatening cold` });
        overall = "extreme";
    } else if (tempC < -10) {
        risks.push({ hazard: "severe_cold", level: "high", detail: `${tempC}°C — risk of frostbite and hypothermia` });
        upsertOverall("high");
    } else if (tempC < 0) {
        risks.push({ hazard: "cold", level: "moderate", detail: `${tempC}°C — dress warmly, watch for ice` });
        upsertOverall("moderate");
    }

    if (windKmh >= 120) {
        risks.push({ hazard: "hurricane_force_wind", level: "extreme", detail: `${windKmh} km/h — catastrophic wind` });
        overall = "extreme";
    } else if (windKmh >= 80) {
        risks.push({ hazard: "severe_gale", level: "high", detail: `${windKmh} km/h — structural damage possible` });
        upsertOverall("high");
    } else if (windKmh >= 50) {
        risks.push({ hazard: "strong_wind", level: "moderate", detail: `${windKmh} km/h — secure loose items, difficult driving` });
        upsertOverall("moderate");
    }

    if (precipMm >= 100) {
        risks.push({ hazard: "extreme_rainfall", level: "extreme", detail: `${precipMm}mm — catastrophic flooding possible` });
        overall = "extreme";
    } else if (precipMm >= 50) {
        risks.push({ hazard: "heavy_rain", level: "high", detail: `${precipMm}mm — flooding risk, avoid travel` });
        upsertOverall("high");
    } else if (precipMm >= 25) {
        risks.push({ hazard: "moderate_rain", level: "moderate", detail: `${precipMm}mm — localised flooding possible` });
        upsertOverall("moderate");
    }

    const wcLower = weatherCode.toLowerCase();
    if (["thunderstorm", "thunder", "lightning", "tornado"].some((kw) => wcLower.includes(kw))) {
        risks.push({ hazard: "thunderstorm", level: "high", detail: "Active thunderstorm — seek shelter immediately" });
        upsertOverall("high");
    }

    if (risks.length === 0) {
        risks.push({ hazard: "none", level: "low", detail: "No significant weather hazards detected" });
    }

    return {
        overall_risk: overall,
        risks,
        summary: riskSummary(overall),
    };
}
