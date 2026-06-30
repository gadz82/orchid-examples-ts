function normalize(text: string): string {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter((part) => part.length > 0)
        .join(" ");
}

function similarity(a: string, b: string): number {
    if (a === b) return 1;
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;

    let matches = 0;
    const bChars = [...b];
    for (const char of a) {
        const idx = bChars.indexOf(char);
        if (idx >= 0) {
            matches++;
            bChars.splice(idx, 1);
        }
    }
    return matches / maxLength;
}

export async function validateQuestions(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const questions = Array.isArray(args.questions) ? args.questions : [];
    // source_text is accepted for parity with the Python tool but not used by this port.
    const _sourceText = String(args.sourceText ?? args.source_text ?? "");
    void _sourceText;
    const issues: Array<Record<string, unknown>> = [];
    const normalizedSeen: Array<{ index: number; prompt: string }> = [];

    for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        if (question === null || typeof question !== "object") {
            issues.push({
                question_index: index,
                severity: "error",
                message: "Question is not an object.",
            });
            continue;
        }

        const record = question as Record<string, unknown>;
        const prompt = String(record["question"] ?? "").trim();
        if (!prompt) {
            issues.push({
                question_index: index,
                severity: "error",
                message: "Question text is empty.",
            });
        }

        const options = Array.isArray(record["options"]) ? record["options"] : [];
        if (options.length === 0) {
            issues.push({
                question_index: index,
                severity: "error",
                message: "Options list is empty.",
            });
        }

        const correctIndex = record["correct_index"];
        const optionCount = options.length;
        if (
            typeof correctIndex !== "number" ||
            correctIndex < 0 ||
            (optionCount > 0 && correctIndex >= optionCount)
        ) {
            issues.push({
                question_index: index,
                severity: "error",
                message: "correct_index is missing or outside the options range.",
            });
        }

        const explanation = String(record["explanation"] ?? "").trim();
        if (explanation.length < 10) {
            issues.push({
                question_index: index,
                severity: "warning",
                message: "Explanation should be at least 10 characters.",
            });
        }

        const normalized = normalize(prompt);
        if (normalized) {
            for (const previous of normalizedSeen) {
                if (similarity(normalized, previous.prompt) >= 0.92) {
                    issues.push({
                        question_index: index,
                        severity: "warning",
                        message: `Question is very similar to question ${previous.index}.`,
                    });
                    break;
                }
            }
            normalizedSeen.push({ index, prompt: normalized });
        }
    }

    return {
        result: {
            valid: !issues.some((issue) => issue["severity"] === "error"),
            issues,
        },
    };
}
