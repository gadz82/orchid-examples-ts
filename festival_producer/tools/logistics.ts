/**
 * Festival producer — logistics tools (demo data).
 */

interface Stage {
    name: string;
    capacity: number;
    powerKw: number;
    openSlots: string[];
}

const STAGES: Record<string, Stage> = {
    "main stage": {
        name: "Main Stage",
        capacity: 20000,
        powerKw: 500,
        openSlots: ["Friday 20:00", "Saturday 21:00"],
    },
    "acoustic garden": {
        name: "Acoustic Garden",
        capacity: 3000,
        powerKw: 80,
        openSlots: ["Saturday 16:00", "Sunday 14:00"],
    },
    "electronic tent": {
        name: "Electronic Tent",
        capacity: 5000,
        powerKw: 200,
        openSlots: ["Friday 22:00", "Saturday 23:00"],
    },
};

const SCHEDULE = [
    { stage: "Main Stage", time: "Friday 18:00", artist: "Neon Pulse" },
    { stage: "Acoustic Garden", time: "Saturday 14:00", artist: "The Wildwood" },
    { stage: "Electronic Tent", time: "Friday 20:00", artist: "Luna Echo" },
];

function findStage(query: string): Stage | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (STAGES[q]) return STAGES[q];
    for (const [key, stage] of Object.entries(STAGES)) {
        if (key.includes(q) || q.includes(key) || stage.name.toLowerCase().includes(q)) {
            return stage;
        }
    }
    return null;
}

export async function checkVenueAvailability(args: Record<string, unknown>): Promise<unknown> {
    const name = String(args.venue_name ?? "Main Stage").trim();
    const stage = findStage(name);
    if (!stage) {
        return { error: `Stage '${name}' not found` };
    }
    return { stage: stage.name, capacity: stage.capacity, power_kw: stage.powerKw, open_slots: stage.openSlots };
}

export async function getScheduleOverview(_args: Record<string, unknown>): Promise<unknown> {
    return { schedule: SCHEDULE, open_slots: Object.fromEntries(Object.entries(STAGES).map(([k, s]) => [s.name, s.openSlots])) };
}

export async function estimatePowerBudget(args: Record<string, unknown>): Promise<unknown> {
    const name = String(args.stage_name ?? "Main Stage").trim();
    const count = Number(args.artist_count ?? 3);
    const stage = findStage(name);
    if (!stage) {
        return { error: `Stage '${name}' not found` };
    }
    const perArtist = Math.min(120, Math.floor(stage.powerKw / Math.max(1, count)));
    return { stage: stage.name, total_kw: stage.powerKw, artists: count, per_artist_kw: perArtist };
}

export async function getCrewRequirements(args: Record<string, unknown>): Promise<unknown> {
    const name = String(args.stage_name ?? "Main Stage").trim();
    const count = Number(args.artist_count ?? 3);
    const stage = findStage(name);
    if (!stage) {
        return { error: `Stage '${name}' not found` };
    }
    return {
        stage: stage.name,
        artist_count: count,
        crew: {
            sound_engineers: Math.max(2, Math.ceil(count / 2)),
            lighting_techs: Math.max(2, Math.ceil(count / 2)),
            security: Math.max(4, count * 2),
            medical: Math.max(1, Math.ceil(count / 4)),
            stagehands: Math.max(4, count * 3),
        },
    };
}
