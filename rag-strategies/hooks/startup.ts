import type {
    OrchidVectorReader,
    OrchidVectorWriter,
    OrchidDocument,
    OrchidRAGScope,
    OrchidSearchResult,
    OrchidMetadataFilters,
} from "@orchid-ai/orchid/core";
import { OrchidRetrievalStrategy } from "@orchid-ai/orchid/core";
import { registerRetrievalStrategy } from "@orchid-ai/orchid/rag";

/** Best-effort seed of the release-notes corpus used by the RAG-strategy agents. */
export async function bootstrapRagStrategies(
    orchid: { runtime?: { reader?: OrchidVectorReader; writer?: OrchidVectorWriter } },
): Promise<void> {
    // Register the custom retrieval strategy.  In a standalone script this is
    // most effective when called *before* Orchid.fromConfigPath() builds the
    // graph; the example main.ts imports this function and registers early.
    registerRetrievalStrategy("recency_simple", RecencySimpleRetrieval);

    const store = orchid.runtime?.writer ?? orchid.runtime?.reader;
    if (!store || typeof (store as OrchidVectorWriter).index !== "function") {
        console.warn("[rag-strategies] No vector writer available; skipping seed.");
        return;
    }

    const docs: OrchidDocument[] = [
        {
            id: "rel-2026-04-12",
            pageContent: "Release 5.4: improved search ranking, new dashboard widgets, and faster exports.",
            metadata: { published_at: "2026-04-12", namespace: "release_notes" },
        },
        {
            id: "rel-2026-03-01",
            pageContent: "Release 5.3: introduced multi-query retrieval and guardrail topic restrictions.",
            metadata: { published_at: "2026-03-01", namespace: "release_notes" },
        },
        {
            id: "rel-2026-01-15",
            pageContent: "Release 5.2: initial RAG pipeline with simple dense retrieval over release notes.",
            metadata: { published_at: "2026-01-15", namespace: "release_notes" },
        },
    ];

    try {
        await (store as OrchidVectorWriter).index(docs, "release_notes");
        console.info("[rag-strategies] Seeded %d release notes.", docs.length);
    } catch (err) {
        console.warn("[rag-strategies] Failed to seed release notes:", err);
    }
}

/** Custom strategy: dense retrieval re-ranked by `published_at` (newest first). */
export class RecencySimpleRetrieval extends OrchidRetrievalStrategy {
    override get name(): string {
        return "recency_simple";
    }

    override async retrieve(
        query: string,
        scope: OrchidRAGScope,
        reader: OrchidVectorReader,
        namespace: string,
        k?: number,
        options?: Record<string, unknown>,
    ): Promise<OrchidSearchResult[]> {
        const results = await reader.retrieve(
            query,
            namespace,
            k ?? 5,
            scope,
            (options?.metadata_filters as OrchidMetadataFilters | null) ?? null,
        );
        return results.slice().sort((a, b) => {
            const ta = new Date(String(a.document.metadata.published_at || "1970-01-01")).getTime();
            const tb = new Date(String(b.document.metadata.published_at || "1970-01-01")).getTime();
            return tb - ta;
        });
    }
}
