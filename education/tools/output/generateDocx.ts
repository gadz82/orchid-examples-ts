function ensureExtension(filename: string, extension: string): string {
    const lower = filename.toLowerCase();
    if (!lower.endsWith(extension.toLowerCase())) {
        return `${filename}${extension}`;
    }
    return filename;
}

export async function generateDocx(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const content = String(args.content ?? "");
    const filename = String(args.filename ?? "document");
    const title = String(args.title ?? "");

    const path = ensureExtension(filename || "document", ".docx");
    const preview = `${title ? `${title}\n\n` : ""}${content.slice(0, 500)}`;
    const sizeBytes = Buffer.byteLength(content, "utf-8");

    return {
        path,
        size_bytes: sizeBytes,
        format: "docx",
        content_preview: preview,
    };
}
