function ensureExtension(filename: string, extension: string): string {
    const lower = filename.toLowerCase();
    if (!lower.endsWith(extension.toLowerCase())) {
        return `${filename}${extension}`;
    }
    return filename;
}

function stringifyContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) return content.map(stringifyContent).join("\n");
    if (content !== null && typeof content === "object") {
        return Object.entries(content as Record<string, unknown>)
            .map(([key, value]) => `${key}: ${stringifyContent(value)}`)
            .join("\n");
    }
    return String(content);
}

export async function generatePptx(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const slides = Array.isArray(args.slides) ? args.slides : [];
    const filename = String(args.filename ?? "presentation");
    const title = String(args.title ?? "");

    const deckTitle = title || filename || "Presentation";
    const normalizedSlides: Array<Record<string, string>> = [{ title: deckTitle, content: "" }];

    for (let index = 0; index < slides.length; index++) {
        const slide = slides[index];
        let slideTitle: string;
        let slideContent: string;
        if (slide !== null && typeof slide === "object") {
            const record = slide as Record<string, unknown>;
            slideTitle = String(record["title"] ?? `Slide ${index + 1}`);
            slideContent = stringifyContent(record["content"] ?? record["body"] ?? "");
        } else {
            slideTitle = `Slide ${index + 1}`;
            slideContent = stringifyContent(slide);
        }
        normalizedSlides.push({ title: slideTitle, content: slideContent });
    }

    const content = normalizedSlides.map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
    const path = ensureExtension(filename || "presentation", ".pptx");
    const sizeBytes = Buffer.byteLength(content, "utf-8");

    return {
        path,
        size_bytes: sizeBytes,
        format: "pptx",
        content_preview: content.slice(0, 500),
        slides: normalizedSlides,
    };
}
