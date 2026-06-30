/**
 * Best-effort glossary lookup used by the `docs` agent.
 *
 * In a real wiki this would query a CMS or database; the example keeps a
 * small in-memory map so it compiles and runs without external services.
 */
const GLOSSARY: Record<string, string> = {
    "hybrid rag":
        "Hybrid RAG combines dense vector retrieval with sparse lexical retrieval (e.g. BM25) and fuses the results with RRF.",
    bm25: "BM25 is a bag-of-words ranking function that scores documents based on query term frequency and document length.",
    rrf: "Reciprocal Rank Fusion (RRF) merges ranked lists from different retrieval strategies using a simple rank-based score.",
    "query transformer":
        "A query transformer rewrites or expands the user's question before retrieval (e.g. reformulate, multi-query, HyDE).",
};

export async function lookupGlossary(args: Record<string, unknown>): Promise<string> {
    const raw = String(args.term ?? args.query ?? "").trim().toLowerCase();
    const term = raw.replace(/[\s_-]+/g, " ");
    return (
        GLOSSARY[term] ??
        `No glossary entry found for "${raw}". Known terms: ${Object.keys(GLOSSARY).join(", ")}.`
    );
}
