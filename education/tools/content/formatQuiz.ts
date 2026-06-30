function questionText(question: unknown): string {
    if (question !== null && typeof question === "object") {
        const record = question as Record<string, unknown>;
        return String(record["question"] ?? record["statement"] ?? "Untitled question");
    }
    return String(question);
}

export async function formatMultipleChoice(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const questions = Array.isArray(args.questions) ? args.questions : [];
    const shuffleOptions = Boolean(args.shuffleOptions ?? args.shuffle_options ?? false);

    const lines: string[] = ["# Multiple Choice Quiz", ""];
    const answerKey: string[] = ["## Answer Key", ""];

    for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        if (question === null || typeof question !== "object") continue;

        const record = question as Record<string, unknown>;
        let options = Array.isArray(record["options"]) ? [...record["options"]] : [];
        let correctIndex = Number(record["correct_index"] ?? 0);

        if (shuffleOptions) {
            const pairs = options.map((text, i) => ({ originalIndex: i, text: String(text) }));
            // Deterministic shuffle seeded by question index
            for (let i = pairs.length - 1; i > 0; i--) {
                const j = (index * 9301 + 49297) % (i + 1);
                [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
            }
            correctIndex = pairs.findIndex((p) => p.originalIndex === correctIndex);
            options = pairs.map((p) => p.text);
        }

        lines.push(`${index + 1}. ${questionText(question)}`);
        for (let letterIndex = 0; letterIndex < options.length; letterIndex++) {
            lines.push(`   ${String.fromCharCode(65 + letterIndex)}. ${String(options[letterIndex])}`);
        }
        lines.push("");
        answerKey.push(`${index + 1}. ${String.fromCharCode(65 + correctIndex)}`);
    }

    return { result: [...lines, ...answerKey].join("\n") };
}

export async function formatTrueFalse(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const questions = Array.isArray(args.questions) ? args.questions : [];

    const lines: string[] = ["# True / False Quiz", ""];
    const answerKey: string[] = ["## Answer Key", ""];

    for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        lines.push(`${index + 1}. ${questionText(question)}`);
        lines.push("   - [ ] True");
        lines.push("   - [ ] False");
        lines.push("");

        if (question !== null && typeof question === "object") {
            const record = question as Record<string, unknown>;
            const options = Array.isArray(record["options"]) ? record["options"] : ["True", "False"];
            const correctIndex = Number(record["correct_index"] ?? 0);
            answerKey.push(`${index + 1}. ${String(options[correctIndex] ?? "True")}`);
        } else {
            answerKey.push(`${index + 1}. True`);
        }
    }

    return { result: [...lines, ...answerKey].join("\n") };
}

export async function formatFillBlank(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const questions = Array.isArray(args.questions) ? args.questions : [];

    const lines: string[] = ["# Fill in the Blank", ""];
    const wordBank: string[] = [];

    for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        let prompt = questionText(question);
        if (!prompt.includes("__blank__")) {
            prompt = `${prompt.replace(/\.+$/, "").trim()} __blank__.`;
        }
        lines.push(`${index + 1}. ${prompt}`);

        if (question !== null && typeof question === "object") {
            const record = question as Record<string, unknown>;
            const answer = String(
                record["answer"] ?? record["concept"] ?? `Answer ${index + 1}`,
            );
            wordBank.push(answer);
        } else {
            wordBank.push(`Answer ${index + 1}`);
        }
    }

    lines.push("");
    if (wordBank.length > 2) {
        lines.push("## Word Bank");
        lines.push(wordBank.join(", "));
        lines.push("");
    }
    lines.push("## Answer Key");
    for (let index = 0; index < wordBank.length; index++) {
        lines.push(`${index + 1}. ${wordBank[index]}`);
    }

    return { result: lines.join("\n") };
}

export async function formatMatching(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const pairs = Array.isArray(args.pairs) ? args.pairs : [];

    const leftLines: string[] = [];
    const rightLines: string[] = [];

    for (let index = 0; index < pairs.length; index++) {
        const pair = pairs[index];
        let prompt: string;
        let answer: string;
        if (pair !== null && typeof pair === "object") {
            const record = pair as Record<string, unknown>;
            prompt = String(
                record["prompt"] ?? record["left"] ?? record["term"] ?? `Item ${index + 1}`,
            );
            answer = String(
                record["answer"] ?? record["right"] ?? record["definition"] ?? `Match ${index + 1}`,
            );
        } else {
            prompt = `Item ${index + 1}`;
            answer = String(pair);
        }
        leftLines.push(`${index + 1}. ${prompt}`);
        rightLines.push(`${String.fromCharCode(65 + index)}. ${answer}`);
    }

    const lines = [
        "# Matching Exercise",
        "",
        "## Column A",
        ...leftLines,
        "",
        "## Column B",
        ...rightLines,
    ];

    return { result: lines.join("\n") };
}
