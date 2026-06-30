/**
 * Built-in basketball tools — NBA player and roster data (in-memory demo).
 *
 * Handlers receive the parsed YAML arguments object and return a string
 * that the LLM sees as the tool result on the next turn. Keeping these as
 * plain functions is the recommended shape — register them via the
 * `<modulePath>#<ExportName>` convention in agents.yaml.
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

interface ScoredPlayer {
    player: PlayerRow;
    position: number;
}

/**
 * Try to extract one or more player names from a free-form query.
 * Handles exact matches and common typos via Levenshtein distance.
 * Returns unique matches in the order they appear in the text.
 */
function findPlayersInQuery(query: string): PlayerRow[] {
    const q = query.toLowerCase();
    const tokens = q.split(/[^a-z]+/).filter((t) => t.length >= 3);
    const scored: ScoredPlayer[] = [];
    const seen = new Set<string>();

    for (const player of Object.values(PLAYERS)) {
        const key = player.name.toLowerCase();
        if (seen.has(key)) continue;

        // Exact substring match first.
        let matched = q.includes(key);
        let position = q.indexOf(key);

        // Fuzzy match each significant name word against query tokens.
        if (!matched) {
            const nameWords = key.split(/\s+/).filter((w) => w.length >= 4);
            let allWordsMatched = nameWords.length > 0;
            let firstPosition = Infinity;
            for (const nw of nameWords) {
                const threshold = Math.max(1, Math.floor(nw.length / 5));
                const tokenMatch = tokens.find((t) => levenshtein(t, nw) <= threshold);
                if (!tokenMatch) {
                    allWordsMatched = false;
                    break;
                }
                const idx = q.indexOf(tokenMatch);
                if (idx >= 0 && idx < firstPosition) firstPosition = idx;
            }
            if (allWordsMatched && firstPosition !== Infinity) {
                matched = true;
                position = firstPosition;
            }
        }

        if (matched) {
            seen.add(key);
            scored.push({ player, position });
        }
    }

    return scored.sort((a, b) => a.position - b.position).map((s) => s.player);
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const prev = new Array<number>(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        const curr = new Array<number>(n + 1);
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        for (let j = 0; j <= n; j++) prev[j] = curr[j];
    }
    return prev[n];
}

export function getPlayerStats(args: Record<string, unknown>): unknown {
    let name = String(args.player_name ?? '');
    if (!name) {
        const query = String(args.query ?? '');
        const players = findPlayersInQuery(query);
        if (players.length > 0) {
            return { ...players[0] };
        }
        name = query;
    }
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
    let aName = String(args.player_a ?? '');
    let bName = String(args.player_b ?? '');

    if (!aName || !bName) {
        const query = String(args.query ?? '');
        const players = findPlayersInQuery(query);
        if (players.length >= 2 && !aName && !bName) {
            aName = players[0].name;
            bName = players[1].name;
        } else {
            if (!aName) aName = players[0]?.name ?? query;
            if (!bName) bName = players[1]?.name ?? '';
        }
    }

    const a = findPlayer(aName);
    const b = findPlayer(bName);
    if (!a || !b) {
        const missing: string[] = [];
        if (!a) missing.push(aName);
        if (!b) missing.push(bName);
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
