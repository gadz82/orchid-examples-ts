function extractTitle(sourceText: string): string {
    for (const rawLine of sourceText.split("\n")) {
        const stripped = rawLine.trim();
        if (!stripped) continue;
        if (stripped.startsWith("#")) return stripped.replace(/^#+\s*/, "").trim();
        return stripped.slice(0, 80).trim();
    }
    return "Lesson Plan";
}

function conceptName(concept: unknown): string {
    if (concept !== null && typeof concept === "object") {
        return String((concept as Record<string, unknown>)["name"] ?? "Concept");
    }
    return String(concept);
}

function bucketConcepts(concepts: unknown[], bucketCount: number): string[][] {
    const buckets: string[][] = Array.from({ length: bucketCount }, () => []);
    for (let index = 0; index < concepts.length; index++) {
        buckets[index % bucketCount].push(conceptName(concepts[index]));
    }
    return buckets;
}

export async function buildLessonStructure(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const concepts = Array.isArray(args.concepts) ? args.concepts : [];
    const sourceText = String(args.sourceText ?? args.source_text ?? "");
    const durationMinutes = Math.max(10, Number(args.durationMinutes ?? args.duration_minutes ?? 30));

    const introDuration = Math.max(1, Math.round(durationMinutes * 0.1));
    const sectionDurationTotal = Math.max(1, Math.round(durationMinutes * 0.6));
    const activityDurationTotal = Math.max(1, Math.round(durationMinutes * 0.2));
    const assessmentDuration = Math.max(
        1,
        durationMinutes - introDuration - sectionDurationTotal - activityDurationTotal,
    );

    const sectionCount = Math.max(
        1,
        Math.min(concepts.length || 1, Math.max(1, Math.floor(durationMinutes / 10))),
    );
    const conceptBuckets = bucketConcepts(
        concepts.length > 0 ? concepts : ["Core Idea"],
        sectionCount,
    );
    const sectionDuration = Math.max(1, Math.floor(sectionDurationTotal / sectionCount));

    const sections = conceptBuckets.map((bucket, index) => {
        const focus = bucket.join(", ") || "Core Idea";
        return {
            title: `Section ${index + 1}: ${focus}`,
            duration: sectionDuration,
            content_template: `Introduce ${focus}. Explain the central idea, provide one grounded example, and add one comprehension check.`,
        };
    });

    const activities = [
        { name: "Warm-up reflection", type: "individual", duration: Math.max(1, introDuration) },
        {
            name: "Guided practice",
            type: "collaborative",
            duration: Math.max(1, activityDurationTotal),
        },
    ];

    const conceptNames =
        concepts.length > 0 ? concepts.map(conceptName) : ["the main topic"];
    const objectives = conceptNames
        .slice(0, 3)
        .map((name) => `Explain ${name.toLowerCase()} in your own words.`);

    return {
        result: {
            title: extractTitle(sourceText),
            objectives,
            sections,
            activities,
            summary_template: `Close the lesson by summarizing ${conceptNames.slice(0, 3).join(", ")} and connecting them to the main objective.`,
            assessment_template: `Use a ${assessmentDuration}-minute exit check that asks learners to apply ${conceptNames[0]}.`,
        },
    };
}
