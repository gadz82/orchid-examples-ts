/**
 * Startup hook for the helpdesk example.
 *
 * Seeds the knowledge_base RAG namespace with the static KB articles so the
 * SupportAgent's RAG retrieval has something to retrieve.
 */

import type { OrchidVectorReader, OrchidVectorWriter } from "@orchid-ai/orchid";
import { KB_ARTICLES } from "../tools/tickets.js";

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as OrchidVectorWriter).upsert === "function";
}

export async function bootstrapHelpdesk(orchid: { runtime?: { reader?: OrchidVectorReader } }): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.info("[Helpdesk] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.info("[Helpdesk] Reader does not support writing — skipping RAG seed");
        return;
    }

    const docs = KB_ARTICLES.map((article) => ({
        id: article.id,
        pageContent: `${article.title}\n\n${article.content}`,
        metadata: {
            tenant_id: "__shared__",
            article_id: article.id,
            category: article.category,
            scope: "tenant",
            source: "knowledge_base",
        },
    }));

    try {
        await reader.upsert(docs, "knowledge_base");
        console.info("[Helpdesk] Seeded %d KB articles into RAG", docs.length);
    } catch (exc: unknown) {
        console.warn("[Helpdesk] KB RAG seed failed:", exc instanceof Error ? exc.message : String(exc));
    }
}
