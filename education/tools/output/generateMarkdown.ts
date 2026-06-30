function ensureExtension(filename: string, extension: string): string {
    const lower = filename.toLowerCase();
    if (!lower.endsWith(extension.toLowerCase())) {
        return `${filename}${extension}`;
    }
    return filename;
}

export async function generateMarkdown(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const content = String(args.content ?? "");
    const filename = String(args.filename ?? "document");

    const path = ensureExtension(filename || "document", ".md");
    const sizeBytes = Buffer.byteLength(content, "utf-8");

    return {
        path,
        size_bytes: sizeBytes,
        format: "md",
        content,
        content_preview: content.slice(0, 500),
    };
}
