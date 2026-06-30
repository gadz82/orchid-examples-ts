/**
 * Startup hook for the orchid_experts example.
 *
 * Seeds one demo document into each expert namespace so the RAG-powered
 * agents can answer at least one question per domain without requiring
 * external documentation to be indexed first.
 *
 * Referenced in orchid.yml as:
 *
 *   startup:
 *     hook: ./hooks/startup.ts#seedExpertsKnowledge
 */

import type { OrchidVectorReader, OrchidVectorWriter, OrchidDocument } from "@orchid-ai/orchid/core";

const EXPERT_SEED_DOCS: Record<string, OrchidDocument[]> = {
    "orchid-framework": [
        {
            id: "orchid-overview",
            pageContent:
                "Orchid is a generic, platform-agnostic multi-agent AI framework built on LangGraph. " +
                "Its core abstractions include OrchidAgent, OrchidAuthContext, LLMProvider, " +
                "OrchidMCPClient, OrchidVectorReader, OrchidVectorWriter, OrchidChatStorage, and " +
                "OrchidIdentityResolver. Agents are configured via agents.yaml and can use built-in " +
                "tools, MCP servers, skills, and RAG retrieval.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "orchid" },
        },
    ],
    "rag-system": [
        {
            id: "rag-overview",
            pageContent:
                "Orchid RAG uses a 5-level scope hierarchy: root, tenant, user, chat, agent. " +
                "Always use OrchidRAGScope instead of raw tenant_id filters. Supported retrieval " +
                "strategies include simple, multi_query, hyde, hybrid, and graph_rag. " +
                "Vector backends are pluggable via OrchidVectorReader / OrchidVectorWriter.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "rag" },
        },
    ],
    "tools-skills": [
        {
            id: "tools-overview",
            pageContent:
                "Tools in Orchid are single-agent capabilities registered with the @tool decorator " +
                "or via YAML handler paths. Skills are cross-agent orchestrations defined in agents.yaml " +
                "with sequential steps. Tool call strategies include all, sequential, and llm_decides.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "tools-skills" },
        },
    ],
    "mcp-system": [
        {
            id: "mcp-overview",
            pageContent:
                "Orchid integrates with MCP servers using three auth modes: none (unauthenticated), " +
                "passthrough (forwards the graph bearer token), and oauth (dynamic client registration " +
                "with per-user tokens). Capabilities are warmed proactively via OrchidSessionWarmer.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "mcp" },
        },
    ],
    "auth-system": [
        {
            id: "auth-overview",
            pageContent:
                "Orchid auth resolves bearer tokens to OrchidAuthContext through OrchidIdentityResolver. " +
                "OAuth mode for MCP uses RFC 7591 dynamic client registration, PKCE, and per-user token " +
                "stores. Passthrough mode forwards the existing graph token to downstream MCP servers.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "auth" },
        },
    ],
    "bloom-events": [
        {
            id: "bloom-overview",
            pageContent:
                "Pollen+Bloom is Orchid's event-driven automation layer. Pollen ingests Signals from " +
                "webhooks, schedules, or manual triggers. Bloom evaluates Triggers and runs Jobs via " +
                "JobSpec and JobRunner, with retry, queue, and visibility support.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "bloom" },
        },
    ],
    "orchid-api-pkg": [
        {
            id: "api-overview",
            pageContent:
                "orchid-api is the FastAPI server that exposes Orchid over HTTP. It provides routers " +
                "for chats, messages, streaming, sharing, resume, admin, diagnostics, auth, and the " +
                "MCP gateway. AppContext holds the runtime singleton and lifespan hooks bootstrap the graph.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "orchid-api" },
        },
    ],
    "orchid-cli-pkg": [
        {
            id: "cli-overview",
            pageContent:
                "orchid-cli is the command-line interface for Orchid. It supports chat (send and " +
                "interactive), config validation, RAG indexing, skill export, and local Pollen+Bloom " +
                "commands. It mirrors the API bootstrap so behaviour is consistent between CLI and HTTP.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "orchid-cli" },
        },
    ],
    "orchid-frontend-pkg": [
        {
            id: "frontend-overview",
            pageContent:
                "orchid-frontend is a Next.js 15 multi-chat UI. It uses server actions to proxy SSE " +
                "streams, NextAuth v5 for OIDC, and Tailwind v4 for theming. The token proxy pattern " +
                "keeps API tokens out of the browser bundle.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "orchid-frontend" },
        },
    ],
    "ai-integration": [
        {
            id: "integration-overview",
            pageContent:
                "Production Orchid deployments choose LLM providers based on latency, cost, and quality. " +
                "RAG scope design should match tenant boundaries. Use LangSmith or OpenTelemetry for " +
                "observability, and prefer PostgreSQL over SQLite for multi-replica deployments.",
            metadata: { tenant_id: "__shared__", scope: "tenant", source: "expert_seed", expert: "ai-integration" },
        },
    ],
};

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function seedExpertsKnowledge(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.warn("[Experts] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.warn("[Experts] Reader does not support writing — skipping RAG seed");
        return;
    }

    for (const [namespace, docs] of Object.entries(EXPERT_SEED_DOCS)) {
        try {
            await reader.upsert(docs, namespace);
            console.info("[Experts] Seeded %d documents into namespace '%s'", docs.length, namespace);
        } catch (exc: unknown) {
            console.warn(
                "[Experts] RAG seed failed for '%s': %s",
                namespace,
                exc instanceof Error ? exc.message : String(exc),
            );
        }
    }
}

export default seedExpertsKnowledge;
