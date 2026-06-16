/**
 * Built-in tool handlers referenced from agents.yaml.
 *
 * Each handler:
 *   - takes the parsed YAML arguments object,
 *   - returns a string (or any JSON-serialisable value) that becomes the
 *     tool result the LLM sees on the next turn.
 *
 * Handlers may be sync or async — the framework awaits the return value.
 */

interface BookRow {
    readonly title: string;
    readonly author: string;
    readonly year: number;
    readonly summary: string;
    readonly topics: readonly string[];
}

const CATALOG: readonly BookRow[] = [
    {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt & David Thomas',
        year: 1999,
        summary: 'Practical, timeless advice on the craft of software development.',
        topics: ['software', 'craft', 'programming', 'engineering'],
    },
    {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        year: 2017,
        summary: 'Deep dive into databases, distributed systems and data integrity.',
        topics: ['systems', 'databases', 'distributed', 'engineering'],
    },
    {
        title: 'A Short History of Nearly Everything',
        author: 'Bill Bryson',
        year: 2003,
        summary: 'A whirlwind tour of science, from the Big Bang to the present.',
        topics: ['science', 'history', 'curiosity'],
    },
    {
        title: 'Educated',
        author: 'Tara Westover',
        year: 2018,
        summary: 'Memoir of an unlikely path from rural Idaho to a Cambridge PhD.',
        topics: ['memoir', 'biography', 'education'],
    },
];

export function lookupBook(args: Record<string, unknown>): string {
    const query = String(args.query ?? '').trim().toLowerCase();
    if (!query) return 'No query provided.';

    const hit = CATALOG.find(
        (b) => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query),
    );
    if (!hit) return `No catalog match for ${JSON.stringify(query)}.`;
    return [
        `Title:   ${hit.title}`,
        `Author:  ${hit.author}`,
        `Year:    ${hit.year}`,
        `Summary: ${hit.summary}`,
    ].join('\n');
}

export function recommendBooks(args: Record<string, unknown>): string {
    const topic = String(args.topic ?? '').trim().toLowerCase();
    const limitRaw = Number(args.limit ?? 3);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 3, 1), 5);

    if (!topic) return 'No topic provided.';

    const matches = CATALOG.filter((b) =>
        b.topics.some((t) => t.includes(topic) || topic.includes(t)),
    ).slice(0, limit);

    if (matches.length === 0) return `No recommendations for topic ${JSON.stringify(topic)}.`;

    return matches
        .map((b, i) => `${i + 1}. ${b.title} — ${b.author} (${b.year})\n   ${b.summary}`)
        .join('\n\n');
}
