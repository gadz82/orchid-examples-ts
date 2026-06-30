/**
 * Startup hook for the graph_kb example.
 *
 * Seeds the `graph_kb` RAG namespace with a tiny org-chart corpus.  In the
 * Python port this hook also seeds an in-memory graph store; the TypeScript
 * port does not wire a graph store through `Orchid.fromConfigPath`, so
 * GraphRAG retrieval will fall back to vector-only here.
 *
 * Referenced in orchid.yml as:
 *
 *   startup:
 *     hook: ./hooks/startup.ts#bootstrapGraphKb
 */

import type { OrchidVectorReader, OrchidVectorWriter, OrchidDocument } from "@orchid-ai/orchid/core";

const ORG_CHART_DOCS: OrchidDocument[] = [
    {
        id: "org-alice",
        pageContent:
            "Alice is the CEO. She manages Bob and Carol directly. " +
            "She works on the North Star project and the board roadmap.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Alice" },
    },
    {
        id: "org-bob",
        pageContent:
            "Bob is the Engineering Director. He reports to Alice. " +
            "He manages Dave and Eve. He works on the Platform project.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Bob" },
    },
    {
        id: "org-carol",
        pageContent:
            "Carol is the Product Director. She reports to Alice. " +
            "She manages Frank. She works on the North Star project.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Carol" },
    },
    {
        id: "org-dave",
        pageContent:
            "Dave is a Senior Engineer. He reports to Bob. " +
            "He works on the Platform project and the developer tooling workstream.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Dave" },
    },
    {
        id: "org-eve",
        pageContent:
            "Eve is a Staff Engineer. She reports to Bob. " +
            "She works on the Platform project and the security review workstream.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Eve" },
    },
    {
        id: "org-frank",
        pageContent:
            "Frank is a Product Manager. He reports to Carol. " +
            "He works on the North Star project and user research.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "org_chart", entity: "Frank" },
    },
];

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function bootstrapGraphKb(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.warn("[GraphKB] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.warn("[GraphKB] Reader does not support writing — skipping RAG seed");
        return;
    }

    try {
        await reader.upsert(ORG_CHART_DOCS, "graph_kb");
        console.info("[GraphKB] Seeded %d org-chart documents into RAG", ORG_CHART_DOCS.length);
    } catch (exc: unknown) {
        console.warn("[GraphKB] RAG seed failed:", exc instanceof Error ? exc.message : String(exc));
    }
}

export default bootstrapGraphKb;
