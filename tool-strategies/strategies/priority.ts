/**
 * Custom tool-call strategy: ``priority``.
 *
 * Behaves like ``sequential`` but **short-circuits at the first
 * non-empty result** — useful when several tools answer the same
 * question and the integrator wants to fall back from a fast cache to
 * slower authoritative sources.
 *
 * Demonstrates the integrator extension contract:
 *
 *   1. Implement ``OrchidToolCallStrategy``.
 *   2. Implement ``execute(...)`` matching the interface signature.
 *   3. Register the class via ``registerStrategy`` from a
 *      startup hook so the registry is populated before any agent
 *      invokes the strategy.
 */

import type { OrchidMCPToolCaller, OrchidAuthContext, ChatModelLike } from "@orchid-ai/orchid/core";
import type { OrchidToolConfig, OrchidMCPServerConfig } from "@orchid-ai/orchid/config";
import type { OrchidToolCallStrategy } from "@orchid-ai/orchid/agents";

const EMPTY_SENTINELS = new Set(["", "null", "[]", "{}"]);

function hasPayload(text: string): boolean {
    const trimmed = text.trim();
    if (EMPTY_SENTINELS.has(trimmed)) {
        return false;
    }
    // Try parsing JSON to detect empty containers like {"items": []}.
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed) && parsed.length === 0) {
            return false;
        }
        if (parsed !== null && typeof parsed === "object" && Object.keys(parsed).length === 0) {
            return false;
        }
    } catch {
        // Not JSON — treat any non-empty text as a payload.
    }
    return true;
}

export class PriorityStrategy implements OrchidToolCallStrategy {
    async execute(
        client: OrchidMCPToolCaller,
        tools: OrchidToolConfig[],
        query: string,
        auth: OrchidAuthContext,
        opts?: {
            agentName?: string;
            serverConfig?: OrchidMCPServerConfig;
            llmModel?: string;
            chatModel?: ChatModelLike;
        },
    ): Promise<Record<string, unknown>> {
        const agentName = opts?.agentName ?? "";
        const results: Record<string, unknown> = {};

        for (const tool of tools) {
            try {
                const args: Record<string, unknown> = { query, ...tool.arguments };
                const result = await client.callTool(tool.name, args, auth);
                const text = result.text ?? "";
                results[tool.name] = text;

                // Short-circuit on first non-empty payload.
                if (hasPayload(text)) {
                    console.info(
                        `[${agentName}] priority: '${tool.name}' returned a non-empty payload — short-circuiting`,
                    );
                    break;
                }
            } catch (exc: unknown) {
                console.warn(`[${agentName}] priority: tool '${tool.name}' failed:`, exc);
                results[`${tool.name}_error`] = String(exc);
            }
        }

        return results;
    }
}
