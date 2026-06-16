// Weather tools — clothing recommendations, safety alerts
export async function getClothingRecommendation(args: Record<string, string>): Promise<string> {
  const temp = parseInt(args["temperature"] || "70");
  const condition = args["condition"] || "sunny";
  let rec = "";
  if (temp > 85) rec = "Light, breathable fabrics (cotton, linen). Shorts, t-shirts, sun hat. SPF 50+ sunscreen.";
  else if (temp > 65) rec = "Comfortable layers. Light jacket for evening. Closed-toe shoes.";
  else if (temp > 45) rec = "Sweater or fleece. Warm pants. Light gloves optional.";
  else rec = "Heavy coat, scarf, gloves, hat. Thermal underlayers. Waterproof boots.";

  if (condition === "rain" || condition === "storm") rec += " Add waterproof jacket and umbrella.";
  return `Temperature: ${temp}°F, ${condition}\nRecommendation: ${rec}`;
}

export async function getSafetyAlert(args: Record<string, string>): Promise<string> {
  const condition = args["condition"] || "clear";
  const alerts: Record<string, string> = {
    "storm": "⚠ THUNDERSTORM WARNING: Seek shelter immediately. Avoid open areas. Stay away from windows.",
    "heat": "⚠ HEAT ADVISORY: Stay hydrated. Limit outdoor activity 11AM-4PM. Check on elderly neighbors.",
    "snow": "⚠ WINTER STORM: Roads may be icy. Carry emergency kit. Check closures before travel.",
    "flood": "⚠ FLOOD WATCH: Do not drive through standing water. Move to higher ground if needed.",
    "clear": "✅ No active weather alerts for your area. Conditions are safe.",
  };
  return alerts[condition] || alerts["clear"]!;
}
