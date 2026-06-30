/**
 * Built-in basketball tools — NBA player and roster data (in-memory demo).
 *
 * Handlers receive the parsed YAML arguments object and return a string
 * that the LLM sees as the tool result on the next turn. Keeping these as
 * plain functions is the recommended shape — register them via the
 * `<modulePath>#<ExportName>` convention in orchid.md.
 */

interface PlayerRow {
    readonly name: string;
    readonly team: string;
    readonly position: string;
    readonly ppg: number;
    readonly rpg: number;
    readonly apg: number;
    readonly age: number;
    readonly seasons: number;
    readonly championships: number;
}

const PLAYERS: Record<string, PlayerRow> = {
    'lebron james': {
        name: 'LeBron James', team: 'Los Angeles Lakers', position: 'SF',
        ppg: 25.7, rpg: 7.3, apg: 8.3, age: 41, seasons: 22, championships: 4,
    },
    'stephen curry': {
        name: 'Stephen Curry', team: 'Golden State Warriors', position: 'PG',
        ppg: 26.4, rpg: 4.5, apg: 6.5, age: 38, seasons: 16, championships: 4,
    },
    'giannis antetokounmpo': {
        name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', position: 'PF',
        ppg: 29.9, rpg: 11.5, apg: 5.8, age: 31, seasons: 13, championships: 1,
    },
    'nikola jokic': {
        name: 'Nikola Jokic', team: 'Denver Nuggets', position: 'C',
        ppg: 26.4, rpg: 12.4, apg: 9.0, age: 31, seasons: 11, championships: 1,
    },
    'luka doncic': {
        name: 'Luka Doncic', team: 'Los Angeles Lakers', position: 'PG',
        ppg: 28.7, rpg: 8.3, apg: 8.0, age: 27, seasons: 8, championships: 0,
    },
    'anthony davis': {
        name: 'Anthony Davis', team: 'Los Angeles Lakers', position: 'PF/C',
        ppg: 24.7, rpg: 12.6, apg: 3.5, age: 32, seasons: 14, championships: 1,
    },
    'jayson tatum': {
        name: 'Jayson Tatum', team: 'Boston Celtics', position: 'SF',
        ppg: 26.9, rpg: 8.1, apg: 4.9, age: 27, seasons: 9, championships: 1,
    },
};

function findPlayer(query: string): PlayerRow | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (PLAYERS[q]) return PLAYERS[q];
    const qWords = q.split(/\s+/);
    for (const [key, player] of Object.entries(PLAYERS)) {
        // Check both directions: query contains key OR key contains query
        if (q.includes(key) || key.includes(q) || player.name.toLowerCase().includes(q)) return player;
        // Partial word match: any query word is a prefix of a name word, or vice versa
        const nameWords = key.split(/\s+/);
        for (const qw of qWords) {
            if (qw.length < 3) continue;
            for (const nw of nameWords) {
                if (nw.startsWith(qw) || qw.startsWith(nw)) return player;
            }
        }
    }
    return null;
}

export function getPlayerStats(args: Record<string, unknown>): unknown {
    const name = String(args.player_name ?? args.query ?? '');
    const player = findPlayer(name);
    if (!player) {
        return {
            error: `Player '${name}' not found`,
            available: Object.values(PLAYERS).map((p) => p.name),
        };
    }
    return { ...player };
}

export function comparePlayers(args: Record<string, unknown>): unknown {
    const a = findPlayer(String(args.player_a ?? args.query ?? ''));
    const b = findPlayer(String(args.player_b ?? ''));
    if (!a || !b) {
        const missing: string[] = [];
        if (!a) missing.push(String(args.player_a ?? args.query ?? ''));
        if (!b) missing.push(String(args.player_b ?? ''));
        return { error: `Player(s) not found: ${missing.join(', ')}` };
    }

    const advantage = (va: number, vb: number, label: string): string => {
        if (va > vb) return `${a.name} edges out on ${label} (${va.toFixed(1)} vs ${vb.toFixed(1)})`;
        if (vb > va) return `${b.name} edges out on ${label} (${vb.toFixed(1)} vs ${va.toFixed(1)})`;
        return `${label} is tied (${va.toFixed(1)})`;
    };

    const advantages: Record<string, string> = {
        scoring: advantage(a.ppg, b.ppg, "scoring"),
        rebounding: advantage(a.rpg, b.rpg, "rebounding"),
        assists: advantage(a.apg, b.apg, "assists"),
    };

    return {
        player_a: a,
        player_b: b,
        advantages,
    };
}

export function getTeamRoster(args: Record<string, unknown>): unknown {
    const team = String(args.team_name ?? args.query ?? '').trim().toLowerCase();

    if (!team) return { error: 'No team name provided.' };

    const matches = Object.values(PLAYERS).filter((p) =>
        p.team.toLowerCase().includes(team),
    );
    if (matches.length === 0) {
        return {
            error: `Team '${team}' not found`,
            availableTeams: [...new Set(Object.values(PLAYERS).map((p) => p.team))].sort(),
        };
    }

    return matches.map((p) => ({
        name: p.name,
        position: p.position,
        ppg: p.ppg,
        rpg: p.rpg,
        apg: p.apg,
    }));
}
