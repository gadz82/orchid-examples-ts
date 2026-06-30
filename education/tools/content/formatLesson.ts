const BLOOM_VERBS: Record<string, [string, string]> = {
    beginner: ["Remember", "Understand"],
    intermediate: ["Apply", "Analyze"],
    advanced: ["Evaluate", "Create"],
};

function conceptName(concept: unknown): string {
    if (concept !== null && typeof concept === "object") {
        return String((concept as Record<string, unknown>)["name"] ?? "Concept");
    }
    return String(concept);
}

export async function defineLearningObjectives(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const concepts = Array.isArray(args.concepts) ? args.concepts : [];
    const objectives: string[] = [];

    for (const concept of concepts) {
        const difficulty =
            concept !== null && typeof concept === "object"
                ? String((concept as Record<string, unknown>)["difficulty"] ?? "intermediate")
                : "intermediate";
        const verbs = BLOOM_VERBS[difficulty] ?? BLOOM_VERBS["intermediate"];
        const name = conceptName(concept).toLowerCase();
        objectives.push(`${verbs[0]} and ${verbs[1]} ${name} using evidence from the lesson.`);
    }

    return { result: objectives };
}

export async function formatLessonSection(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const section =
        args.section !== null && typeof args.section === "object"
            ? (args.section as Record<string, unknown>)
            : {};

    const title = String(section["title"] ?? "Lesson Section");
    const duration = section["duration"];
    const content =
        section["content"] ??
        section["content_template"] ??
        section["summary"] ??
        "";

    const lines: string[] = [`## ${title}`];
    if (duration !== undefined && duration !== "") {
        lines.push(`_Timing: ${duration} minutes_`);
    }
    lines.push("");
    if (Array.isArray(content)) {
        for (const item of content) {
            lines.push(`- ${String(item)}`);
        }
    } else {
        lines.push(String(content));
    }

    return { result: lines.join("\n") };
}
