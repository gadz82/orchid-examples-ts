/**
 * Built-in review sentiment tool — keyword-based sentiment scoring.
 *
 * All logic is static / in-memory. The handler receives the parsed YAML
 * arguments object and returns structured analysis data.
 */

const POSITIVE_WORDS = new Set([
    "excellent",
    "amazing",
    "fantastic",
    "delicious",
    "wonderful",
    "outstanding",
    "great",
    "perfect",
    "love",
    "loved",
    "best",
    "superb",
    "incredible",
    "fresh",
    "flavorful",
    "crispy",
    "tender",
    "beautiful",
    "attentive",
    "friendly",
    "prompt",
    "cozy",
    "recommend",
    "worth",
]);

const NEGATIVE_WORDS = new Set([
    "terrible",
    "awful",
    "horrible",
    "disgusting",
    "worst",
    "bad",
    "cold",
    "stale",
    "overcooked",
    "undercooked",
    "slow",
    "rude",
    "expensive",
    "disappointing",
    "bland",
    "tasteless",
    "greasy",
    "wait",
    "waited",
    "dirty",
    "noisy",
    "overpriced",
    "raw",
    "burnt",
    "soggy",
]);

const FOOD_WORDS = new Set([
    "delicious",
    "fresh",
    "flavorful",
    "crispy",
    "tender",
    "bland",
    "tasteless",
    "greasy",
    "overcooked",
    "undercooked",
    "cold",
    "stale",
    "raw",
    "burnt",
    "soggy",
]);
const SERVICE_WORDS = new Set(["attentive", "friendly", "prompt", "rude", "slow", "waited", "wait"]);
const AMBIANCE_WORDS = new Set(["cozy", "beautiful", "dirty", "noisy"]);
const VALUE_WORDS = new Set(["expensive", "overpriced", "worth"]);

export async function analyzeSentiment(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const text = String(args.text ?? args.query ?? "");

    if (!text) {
        return { error: "No review text provided. Please supply the review text." };
    }

    const rawWords = text.toLowerCase().split(/\s+/);
    const cleaned = new Set(rawWords.map((w) => w.replace(/[.,!?;:'"()]+$/, "")));

    const posFound = new Set([...cleaned].filter((w) => POSITIVE_WORDS.has(w)));
    const negFound = new Set([...cleaned].filter((w) => NEGATIVE_WORDS.has(w)));

    const posCount = posFound.size;
    const negCount = negFound.size;
    const total = posCount + negCount;

    let score: number;
    let sentiment: string;
    let stars: number;

    if (total === 0) {
        score = 0.0;
        sentiment = "neutral";
        stars = 3;
    } else {
        score = Math.round(((posCount - negCount) / total) * 100) / 100;
        if (score > 0.3) {
            sentiment = "positive";
            stars = score > 0.7 ? 5 : 4;
        } else if (score < -0.3) {
            sentiment = "negative";
            stars = score < -0.7 ? 1 : 2;
        } else {
            sentiment = "mixed";
            stars = 3;
        }
    }

    const categories: string[] = [];
    if ([...cleaned].some((w) => FOOD_WORDS.has(w))) categories.push("food_quality");
    if ([...cleaned].some((w) => SERVICE_WORDS.has(w))) categories.push("service");
    if ([...cleaned].some((w) => AMBIANCE_WORDS.has(w))) categories.push("ambiance");
    if ([...cleaned].some((w) => VALUE_WORDS.has(w))) categories.push("value");

    return {
        sentiment,
        score,
        stars,
        positive_keywords: [...posFound].sort(),
        negative_keywords: [...negFound].sort(),
        categories: categories.length > 0 ? categories : ["general"],
        word_count: rawWords.length,
        summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} review (${stars}/5 stars). Found ${posCount} positive and ${negCount} negative indicators.`,
    };
}
