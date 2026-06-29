/**
 * Read-only metric tools used by the ``parallel_searcher`` agent.
 *
 * Three sibling tools that each return a single scalar; declared
 * ``parallel_safe`` so the agentic loop's Phase A parallel dispatch can
 * gather them in a single Promise.all call within one round.
 */

export async function metricA(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { metric: "a", value: 0.42 };
}

export async function metricB(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { metric: "b", value: 12.0 };
}

export async function metricC(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { metric: "c", value: 3.14 };
}
