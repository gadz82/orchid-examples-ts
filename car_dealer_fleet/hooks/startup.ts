/**
 * Startup hook for the car-dealer-fleet example.
 *
 * The Python version dynamically created expert agents from car-spec
 * content sources; the TypeScript port keeps a static agent fleet and
 * seeds a small demo RAG collection instead.
 */

import type { OrchidVectorReader, OrchidVectorWriter } from "@orchid-ai/orchid/core";

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

const DEMO_SPECS: Array<{ id: string; brand: string; content: string }> = [
    {
        id: "toyota-camry",
        brand: "toyota",
        content:
            "Toyota Camry: midsize sedan, 2.5L 4-cylinder, EPA-estimated " +
            "28 city / 39 highway MPG, available hybrid trim with 51 city MPG.",
    },
    {
        id: "ford-f150",
        brand: "ford",
        content:
            "Ford F-150: full-size pickup, available 3.5L EcoBoost V6, " +
            "max towing around 14,000 lb, payload up to 3,325 lb.",
    },
    {
        id: "vw-golf",
        brand: "vw",
        content:
            "Volkswagen Golf: compact hatchback, 1.4L turbocharged 4-cylinder, " +
            "EPA-estimated 29 city / 39 highway MPG, GTI hot-hatch variant available.",
    },
];

export async function seedCarDealerFleet(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.info("[CarDealerFleet] No vector reader available — skipping demo seed");
        return;
    }
    if (!isWriter(reader)) {
        console.info("[CarDealerFleet] Reader does not support writing — skipping demo seed");
        return;
    }

    const docs = DEMO_SPECS.map((spec) => ({
        id: spec.id,
        pageContent: spec.content,
        metadata: {
            tenant_id: "__shared__",
            brand: spec.brand,
            scope: "tenant",
            source: "demo_specs",
        },
    }));

    try {
        await reader.upsert(docs, "car-dealer");
        console.info("[CarDealerFleet] Seeded %d demo specs into RAG", docs.length);
    } catch (exc: unknown) {
        console.warn(
            "[CarDealerFleet] Demo RAG seed failed:",
            exc instanceof Error ? exc.message : String(exc),
        );
    }
}
