/**
 * Startup hook for the tool-strategies example.
 *
 * Registers the custom ``PriorityStrategy`` so any agent declaring
 * ``tool_call_strategy: priority`` on its MCP server resolves through
 * the registry without runtime errors.
 *
 * Wire-up (orchid.yml)::
 *
 *     startup:
 *       hook: ./hooks/startup.ts#bootstrapStrategies
 */

import { registerStrategy } from "@orchid-ai/orchid/agents";
import { PriorityStrategy } from "../strategies/priority.js";

export async function bootstrapStrategies(_orchid: unknown): Promise<void> {
    registerStrategy("priority", PriorityStrategy);
    console.info("[ToolStrategies] Registered custom strategy: priority");
}
