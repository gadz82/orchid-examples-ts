import type {
    OrchidVectorReader,
    OrchidVectorWriter,
    OrchidDocument,
} from "@orchid-ai/orchid/core";

/** Best-effort seed of the wiki docs and FAQ corpora. */
export async function bootstrapWiki(
    orchid: { runtime?: { reader?: OrchidVectorReader; writer?: OrchidVectorWriter } },
): Promise<void> {
    const store = orchid.runtime?.writer ?? orchid.runtime?.reader;
    if (!store || typeof (store as OrchidVectorWriter).index !== "function") {
        console.warn("[wiki] No vector writer available; skipping seed.");
        return;
    }

    const writer = store as OrchidVectorWriter;

    const docs: OrchidDocument[] = [
        {
            id: "wiki-hybrid-rag",
            pageContent:
                "# Hybrid RAG\n\nHybrid RAG combines dense vector retrieval with sparse lexical retrieval. " +
                "Use it when queries contain jargon, error codes, or IDs that dense embeddings may miss.",
            metadata: { source: "wiki.md", namespace: "wiki_docs" },
        },
        {
            id: "wiki-config",
            pageContent:
                "# Configuration\n\nSet `rag.vector_backend` to `qdrant` and provide `qdrant_url` in `orchid.yml`. " +
                "Switching embedding models requires re-indexing.",
            metadata: { source: "wiki.md", namespace: "wiki_docs" },
        },
    ];

    const faqs: OrchidDocument[] = [
        {
            id: "faq-embed-dim",
            pageContent:
                "Q: What embedding dimension should I use? A: Match your model: nomic-embed-text is 768, " +
                "text-embedding-3-small is 1536, gemini-embedding-001 is 3072.",
            metadata: { source: "faq.md", namespace: "wiki_faq" },
        },
        {
            id: "faq-reindex",
            pageContent:
                "Q: When must I re-index? A: Whenever you change the embedding model, chunk size, or ingestion strategy.",
            metadata: { source: "faq.md", namespace: "wiki_faq" },
        },
    ];

    try {
        await writer.index(docs, "wiki_docs");
        console.info("[wiki] Seeded %d docs into wiki_docs.", docs.length);
    } catch (err) {
        console.warn("[wiki] Failed to seed wiki_docs:", err);
    }

    try {
        await writer.index(faqs, "wiki_faq");
        console.info("[wiki] Seeded %d docs into wiki_faq.", faqs.length);
    } catch (err) {
        console.warn("[wiki] Failed to seed wiki_faq:", err);
    }
}
