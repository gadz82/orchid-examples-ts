/**
 * Festival producer — artist booking tools (demo data).
 */

interface Artist {
    name: string;
    genre: string;
    fee: number;
    availability: string;
    draw: number;
    rider: {
        stage: string;
        powerKw: number;
        backstage: string[];
    };
}

const ARTISTS: Record<string, Artist> = {
    "neon pulse": {
        name: "Neon Pulse",
        genre: "electropop",
        fee: 95000,
        availability: "Q3 2026",
        draw: 4500,
        rider: { stage: "Main Stage", powerKw: 120, backstage: ["green room", "catering"] },
    },
    "the wildwood": {
        name: "The Wildwood",
        genre: "indie folk",
        fee: 65000,
        availability: "Q3 2026",
        draw: 3200,
        rider: { stage: "Acoustic Garden", powerKw: 40, backstage: ["acoustic green room"] },
    },
    "steel horizon": {
        name: "Steel Horizon",
        genre: "rock",
        fee: 110000,
        availability: "Q2 2026 only",
        draw: 6000,
        rider: { stage: "Main Stage", powerKw: 180, backstage: ["large green room", "security"] },
    },
    "luna echo": {
        name: "Luna Echo",
        genre: "r&b",
        fee: 80000,
        availability: "Q3 2026",
        draw: 3800,
        rider: { stage: "Main Stage", powerKw: 100, backstage: ["green room", "hair/makeup"] },
    },
};

function findArtist(query: string): Artist | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (ARTISTS[q]) return ARTISTS[q];
    for (const [key, artist] of Object.entries(ARTISTS)) {
        if (key.includes(q) || q.includes(key) || artist.name.toLowerCase().includes(q)) {
            return artist;
        }
    }
    return null;
}

export async function lookupArtist(args: Record<string, unknown>): Promise<unknown> {
    const name = String(args.artist_name ?? args.query ?? "").trim();
    const artist = findArtist(name);
    if (!artist) {
        return {
            error: `Artist '${name}' not found`,
            available: Object.values(ARTISTS).map((a) => a.name),
        };
    }
    return { ...artist };
}

export async function listAvailableArtists(args: Record<string, unknown>): Promise<unknown> {
    const quarter = String(args.quarter ?? "Q3 2026").toLowerCase();
    const maxFee = Number(args.max_fee ?? 999999);
    const matches = Object.values(ARTISTS).filter(
        (a) =>
            a.availability.toLowerCase().includes(quarter) &&
            (!Number.isNaN(maxFee) ? a.fee <= maxFee : true),
    );
    return {
        quarter: quarter.toUpperCase(),
        max_fee: maxFee,
        artists: matches.map((a) => ({ name: a.name, fee: a.fee, draw: a.draw })),
    };
}

export async function getRiderDetails(args: Record<string, unknown>): Promise<unknown> {
    const name = String(args.artist_name ?? args.query ?? "").trim();
    const artist = findArtist(name);
    if (!artist) {
        return { error: `Artist '${name}' not found` };
    }
    return { artist: artist.name, rider: artist.rider };
}

export async function compareArtists(args: Record<string, unknown>): Promise<unknown> {
    const a = findArtist(String(args.artist_a ?? ""));
    const b = findArtist(String(args.artist_b ?? ""));
    const missing: string[] = [];
    if (!a) missing.push(String(args.artist_a ?? ""));
    if (!b) missing.push(String(args.artist_b ?? ""));
    if (missing.length > 0) {
        return { error: `Artist(s) not found: ${missing.join(", ")}` };
    }
    return {
        artist_a: a,
        artist_b: b,
        comparison: {
            fee_difference: (a?.fee ?? 0) - (b?.fee ?? 0),
            draw_difference: (a?.draw ?? 0) - (b?.draw ?? 0),
            cheaper: (a?.fee ?? 0) < (b?.fee ?? 0) ? a?.name : b?.name,
        },
    };
}
