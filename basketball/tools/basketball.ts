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
    for (const [key, player] of Object.entries(PLAYERS)) {
        if (key.includes(q) || player.name.toLowerCase().includes(q)) return player;
    }
    return null;
}

export function getPlayerStats(args: Record<string, unknown>): string {
    const name = String(args.player_name ?? '');
    const player = findPlayer(name);
    if (!player) return `No player found matching ${JSON.stringify(name)}.`;

    return [
        `${player.name} (${player.team}, ${player.position})`,
        `  PPG: ${player.ppg.toFixed(1)}    RPG: ${player.rpg.toFixed(1)}    APG: ${player.apg.toFixed(1)}`,
        `  Age: ${player.age}    Seasons: ${player.seasons}    Championships: ${player.championships}`,
    ].join('\n');
}

export function comparePlayers(args: Record<string, unknown>): string {
    const a = findPlayer(String(args.player_a ?? ''));
    const b = findPlayer(String(args.player_b ?? ''));
    if (!a || !b) {
        return `Need both players — got: a=${a?.name ?? 'NOT FOUND'}, b=${b?.name ?? 'NOT FOUND'}.`;
    }

    const advantage = (la: number, lb: number, label: string): string => {
        if (la > lb) return `${a.name} edges out on ${label} (${la.toFixed(1)} vs ${lb.toFixed(1)}).`;
        if (lb > la) return `${b.name} edges out on ${label} (${lb.toFixed(1)} vs ${la.toFixed(1)}).`;
        return `${label} is tied (${la.toFixed(1)}).`;
    };

    return [
        `Comparison: ${a.name} vs ${b.name}`,
        '',
        `${a.name.padEnd(28)} ${b.name}`,
        `  PPG: ${a.ppg.toFixed(1).padEnd(22)} PPG: ${b.ppg.toFixed(1)}`,
        `  RPG: ${a.rpg.toFixed(1).padEnd(22)} RPG: ${b.rpg.toFixed(1)}`,
        `  APG: ${a.apg.toFixed(1).padEnd(22)} APG: ${b.apg.toFixed(1)}`,
        `  Championships: ${String(a.championships).padEnd(12)} Championships: ${b.championships}`,
        '',
        advantage(a.ppg, b.ppg, 'scoring'),
        advantage(a.rpg, b.rpg, 'rebounding'),
        advantage(a.apg, b.apg, 'playmaking'),
    ].join('\n');
}

export function getTeamRoster(args: Record<string, unknown>): string {
    const team = String(args.team_name ?? '').trim().toLowerCase();
    if (!team) return 'No team name provided.';

    const matches = Object.values(PLAYERS).filter((p) =>
        p.team.toLowerCase().includes(team),
    );
    if (matches.length === 0) return `No roster entries for ${JSON.stringify(team)} in this demo dataset.`;

    return [
        `Roster (demo subset): ${matches[0].team}`,
        ...matches.map(
            (p) => `  - ${p.name} (${p.position})  PPG ${p.ppg.toFixed(1)}, RPG ${p.rpg.toFixed(1)}, APG ${p.apg.toFixed(1)}`,
        ),
    ].join('\n');
}
