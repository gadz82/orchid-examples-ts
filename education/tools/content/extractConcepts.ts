const STOPWORDS = new Set([
    "about",
    "after",
    "again",
    "also",
    "because",
    "between",
    "could",
    "first",
    "from",
    "into",
    "many",
    "most",
    "other",
    "over",
    "should",
    "that",
    "their",
    "there",
    "these",
    "this",
    "those",
    "through",
    "under",
    "using",
    "very",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
]);

function splitSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}

function collectHeadings(text: string): string[] {
    const headings: string[] = [];
    for (const rawLine of text.split("\n")) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith("#")) {
            const heading = line.replace(/^#+\s*/, "").trim();
            if (heading) headings.push(heading);
        } else if (line === line.toUpperCase() && line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 8) {
            headings.push(line.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
        }
    }
    return headings;
}

function keywordCandidates(text: string, maxConcepts: number): string[] {
    const words = (text.toLowerCase().match(/[a-z][a-z0-9'`-]{2,}/g) || []).filter(
        (word) => !STOPWORDS.has(word),
    );
    const counts = new Map<string, number>();
    for (const word of words) {
        const normalized = word.replace(/[-`]/g, " ");
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxConcepts * 2)
        .map(([word]) => word);
}

function findDescription(name: string, sentences: string[]): string {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    for (const sentence of sentences) {
        if (pattern.test(sentence)) return sentence;
    }
    return `Key idea related to ${name}.`;
}

export async function extractConcepts(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sourceText = String(args.sourceText ?? args.source_text ?? "");
    const maxConcepts = Math.max(1, Number(args.maxConcepts ?? args.max_concepts ?? 15));

    const sentences = splitSentences(sourceText);
    const headings = collectHeadings(sourceText);
    const keywords = keywordCandidates(sourceText, maxConcepts);

    const candidates = [...headings, ...keywords];
    const concepts: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();

    for (let index = 0; index < candidates.length; index++) {
        const candidate = candidates[index];
        const normalized = candidate.trim().toLowerCase().replace(/\s+/g, " ");
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);

        const importance = index < 3 ? 5 : index < 8 ? 4 : 3;
        concepts.push({
            name: candidate.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
            description: findDescription(candidate, sentences),
            difficulty: "intermediate",
            importance,
        });

        if (concepts.length >= maxConcepts) break;
    }

    return { result: concepts };
}
