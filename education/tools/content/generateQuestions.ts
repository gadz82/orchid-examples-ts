const DEFAULT_TYPES = ["multiple_choice"];

function conceptName(concept: unknown): string {
    if (concept !== null && typeof concept === "object") {
        const record = concept as Record<string, unknown>;
        return String(record["name"] ?? record["concept"] ?? "Concept");
    }
    return String(concept);
}

export async function generateQuestions(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const concepts = Array.isArray(args.concepts) ? args.concepts : [];
    const count = Math.max(0, Number(args.count ?? 0));
    const requestedDifficulty = String(args.difficulty ?? "mixed");
    const rawTypes = Array.isArray(args.types) ? args.types : DEFAULT_TYPES;
    const questionTypes = rawTypes.length > 0 ? rawTypes.map(String) : DEFAULT_TYPES;

    if (concepts.length === 0 || count === 0) {
        return { result: [] };
    }

    const questions: Array<Record<string, unknown>> = [];
    for (let index = 0; index < count; index++) {
        const concept = concepts[index % concepts.length];
        const conceptNameValue = conceptName(concept);
        const questionType = questionTypes[index % questionTypes.length];
        const conceptDifficulty =
            concept !== null && typeof concept === "object"
                ? String((concept as Record<string, unknown>)["difficulty"] ?? "intermediate")
                : "intermediate";
        const difficulty =
            requestedDifficulty === "mixed" ? conceptDifficulty : requestedDifficulty;

        let options: string[] = [
            `Placeholder option A for ${conceptNameValue}`,
            `Placeholder option B for ${conceptNameValue}`,
            `Placeholder option C for ${conceptNameValue}`,
            `Placeholder option D for ${conceptNameValue}`,
        ];
        if (questionType === "true_false") {
            options = ["True", "False"];
        }

        questions.push({
            question: `Draft a ${String(questionType).replace(/_/g, " ")} question about ${conceptNameValue}.`,
            options,
            correct_index: 0,
            explanation: `Explain the reasoning for the correct answer about ${conceptNameValue}.`,
            type: questionType,
            concept: conceptNameValue,
            difficulty: difficulty || "intermediate",
        });
    }

    return { result: questions };
}
