/**
 * Built-in psychology tools — qualitative assessments (in-memory demo).
 *
 * These are deliberately heuristic. The intent is to show the
 * second-agent / cross-agent skill wiring, not to replace a sports
 * psychologist.
 */

const MOTIVATION_PROFILES: Record<string, { drive: string; risks: string[] }> = {
    'lebron james': {
        drive: 'legacy-driven — chasing all-time records and championship count',
        risks: ['load management as he ages', 'pressure to mentor the next generation'],
    },
    'stephen curry': {
        drive: 'mastery-driven — relentlessly refining shooting craft',
        risks: ['injury cumulative impact', 'roster turnover anxiety'],
    },
    'giannis antetokounmpo': {
        drive: 'family + community — playing for those who believed in him early',
        risks: ['perfectionism in clutch moments', 'team-context dependency'],
    },
    'nikola jokic': {
        drive: 'process-driven — joy in playmaking and team success',
        risks: ['public-attention fatigue', 'off-season competitive distractions'],
    },
    'luka doncic': {
        drive: 'achievement-driven — chasing the championship not yet won',
        risks: ['conditioning under high usage', 'ref-frustration cycles'],
    },
};

function findKey(query: string): string | null {
    const q = query.trim().toLowerCase();
    const qWords = q.split(/\s+/);
    for (const key of Object.keys(MOTIVATION_PROFILES)) {
        if (key.includes(q) || q.includes(key)) return key;
        // Partial word match: any query word is a prefix of a name word, or vice versa
        const nameWords = key.split(/\s+/);
        for (const qw of qWords) {
            if (qw.length < 3) continue;
            for (const nw of nameWords) {
                if (nw.startsWith(qw) || qw.startsWith(nw)) return key;
            }
        }
    }
    return null;
}

export function assessMotivation(args: Record<string, unknown>): unknown {
    const player = String(args.player_name ?? args.query ?? '');
    const situation = String(args.situation ?? 'general competition').trim();

    const key = findKey(player);
    if (!key) {
        return {
            error: `No motivation profile in this demo dataset for '${player}'`,
            available: Object.keys(MOTIVATION_PROFILES),
        };
    }

    const {drive, risks} = MOTIVATION_PROFILES[key];
    return {
        player,
        situation,
        profile: { drive, risks },
    };
}

export function suggestMentalStrategy(args: Record<string, unknown>): string {
    const situation = String(args.situation ?? args.query ?? '').trim().toLowerCase();
    if (!situation) return 'No situation provided.';

    if (situation.includes('slump')) {
        return [
            'Strategies for breaking out of a shooting slump:',
            '  1. Shorten the shot chart — focus on volume from highest-percentage zones for one game.',
            '  2. Rebuild rhythm with 20 successful pre-game free throws (process anchor).',
            '  3. Externalise the narrative — talk through one good rep per quarter with a teammate.',
            '  4. Reset sleep and recovery; cognitive fatigue compounds technique drift.',
        ].join('\n');
    }

    if (situation.includes('pressure') || situation.includes('clutch')) {
        return [
            'Strategies for high-pressure / clutch moments:',
            '  1. Pre-game scripting: rehearse a specific late-game scenario in detail.',
            '  2. Slow the breath — 4-second inhale, 6-second exhale before each free throw.',
            '  3. Anchor on process cues, not outcome ("plant, square, follow-through").',
            '  4. Reframe stakes — "I get to take this shot" beats "I have to make it".',
        ].join('\n');
    }

    if (situation.includes('confidence')) {
        return [
            'Strategies for rebuilding confidence:',
            '  1. Catalogue a "wins archive" — five recent games where execution was clean.',
            '  2. Set process goals (shots, screens, deflections) instead of result goals.',
            '  3. Limit social-media exposure for 72 hours after a tough loss.',
        ].join('\n');
    }

    if (situation.includes('team conflict') || situation.includes('chemistry')) {
        return [
            'Strategies for resolving team conflict:',
            '  1. Scheduled, structured 1-on-1 conversations (pair across roles, not within roles).',
            '  2. Re-anchor on shared identity statement (what we want to be known for).',
            '  3. Co-create a brief team huddle ritual to reset before each game.',
        ].join('\n');
    }

    return `No tailored strategy in this demo for situation ${JSON.stringify(situation)}. Generic advice: anchor on process, manage breath, focus on the next play.`;
}

export function analyzeTeamDynamics(args: Record<string, unknown>): string {
    const team = String(args.team_name ?? args.query ?? '').trim().toLowerCase();
    if (!team) return 'No team name provided.';

    const profiles: Record<string, string> = {
        lakers:
            'High-status veteran core. Risk: status-conflict in late-game touches. Strength: experience under pressure. Lean into clear role definition.',
        warriors:
            'Continuity-driven dynasty culture. Risk: identity drift as the core ages. Strength: shared history compresses conflict. Reinforce the next-generation handoff.',
        celtics:
            'Talent-rich, system-driven. Risk: over-individualisation in playoffs. Strength: depth at every position. Codify a single "winning ritual" pre-game.',
        nuggets:
            'Anchor-around-Jokic system. Risk: complacency after winning. Strength: unselfish read-and-react identity. Add competitive friction in practice.',
        bucks:
            'Star-led scoring engine. Risk: late-game over-reliance on Giannis. Strength: defensive toughness. Diversify clutch playmaking.',
    };

    for (const [key, body] of Object.entries(profiles)) {
        if (team.includes(key)) {
            return `Dynamics analysis (${key.toUpperCase()}):\n  ${body}`;
        }
    }
    return `No dynamics profile in this demo for ${JSON.stringify(team)}.`;
}
