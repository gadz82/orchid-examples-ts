/**
 * Festival producer — marketing tools (demo data).
 */

const DEMOGRAPHICS: Record<string, { ageRange: string; gender: string; topChannels: string[] }> = {
    electropop: { ageRange: "18-29", gender: "even", topChannels: ["TikTok", "Instagram", "Spotify"] },
    rock: { ageRange: "25-40", gender: "60% male", topChannels: ["YouTube", "Facebook", "Radio"] },
    "indie folk": { ageRange: "22-35", gender: "even", topChannels: ["Instagram", "Bandcamp", "Newsletters"] },
    "r&b": { ageRange: "21-34", gender: "55% female", topChannels: ["Instagram", "TikTok", "Streaming"] },
};

export async function analyzeDemographics(args: Record<string, unknown>): Promise<unknown> {
    const genre = String(args.genre ?? "").trim().toLowerCase();
    if (!genre) {
        return { error: "No genre provided" };
    }
    const profile = DEMOGRAPHICS[genre];
    if (!profile) {
        return { genre, note: "No demo profile; using generic festival audience.", profile: { ageRange: "18-45", topChannels: ["Instagram", "TikTok", "YouTube"] } };
    }
    return { genre, profile };
}

export async function getPricingStrategy(args: Record<string, unknown>): Promise<unknown> {
    const attendance = Number(args.projected_attendance ?? 20000);
    const tiers = {
        early_bird: { price: 149, allocation: Math.floor(attendance * 0.2), revenue: Math.floor(attendance * 0.2 * 149) },
        general: { price: 199, allocation: Math.floor(attendance * 0.5), revenue: Math.floor(attendance * 0.5 * 199) },
        late: { price: 249, allocation: Math.floor(attendance * 0.2), revenue: Math.floor(attendance * 0.2 * 249) },
        vip: { price: 499, allocation: Math.floor(attendance * 0.1), revenue: Math.floor(attendance * 0.1 * 499) },
    };
    const totalRevenue = Object.values(tiers).reduce((sum, t) => sum + t.revenue, 0);
    return { projected_attendance: attendance, tiers, total_revenue: totalRevenue };
}

export async function recommendChannels(args: Record<string, unknown>): Promise<unknown> {
    const budget = Number(args.budget ?? 100000);
    const genres = Array.isArray(args.genres) ? args.genres.map(String) : [];
    const channels = [
        { channel: "Instagram/TikTok", allocation: Math.floor(budget * 0.35), rationale: "Primary for 18-34 festival goers" },
        { channel: "Influencer partnerships", allocation: Math.floor(budget * 0.25), rationale: "Genre-specific reach" },
        { channel: "Email / SMS", allocation: Math.floor(budget * 0.15), rationale: "Owned audience, ticket drops" },
        { channel: "Radio / Podcasts", allocation: Math.floor(budget * 0.15), rationale: "Older demos and local reach" },
        { channel: "OOH / Posters", allocation: Math.floor(budget * 0.1), rationale: "Local awareness" },
    ];
    return { budget, genres, channels };
}

export async function projectAttendance(args: Record<string, unknown>): Promise<unknown> {
    const lineupSize = Number(args.lineup_size ?? 20);
    const averageDraw = Number(args.average_draw ?? 1000);
    const base = lineupSize * averageDraw;
    const headlinerBoost = Math.floor(base * 0.25);
    return {
        lineup_size: lineupSize,
        average_draw: averageDraw,
        base_attendance: base,
        headliner_boost: headlinerBoost,
        projected_attendance: base + headlinerBoost,
    };
}
