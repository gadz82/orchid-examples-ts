import type { OrchidVectorReader, OrchidVectorWriter, OrchidDocument } from "@orchid-ai/orchid/core";

const SAMPLES: OrchidDocument[] = [
    {
        id: "education-photosynthesis",
        pageContent: `Photosynthesis is the process used by plants, algae, and some bacteria to convert light energy into chemical energy. The overall equation is 6 CO2 + 6 H2O + light energy -> C6H12O6 + 6 O2. Key concepts include chlorophyll, the chloroplast, the light-dependent reactions, and the Calvin cycle.`,
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "education", topic: "photosynthesis" },
    },
    {
        id: "education-american-revolution",
        pageContent: `The American Revolution was a colonial revolt that took place between 1765 and 1783. The Thirteen Colonies rejected the British monarchy and aristocracy, overthrew the authority of Great Britain, and founded the United States of America. Key events include the Stamp Act, the Boston Tea Party, the Declaration of Independence, and the Treaty of Paris.`,
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "education", topic: "american-revolution" },
    },
    {
        id: "education-cell-biology",
        pageContent: `Cells are the basic structural and functional units of life. Eukaryotic cells contain a nucleus and membrane-bound organelles such as mitochondria, the endoplasmic reticulum, and the Golgi apparatus. Prokaryotic cells lack a nucleus and most organelles. Key concepts include the cell membrane, cytoplasm, DNA, and ribosomes.`,
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "education", topic: "cell-biology" },
    },
];

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function bootstrapEducation(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.warn("[education-startup] No vector reader available; skipping sample seed.");
        return;
    }
    if (!isWriter(reader)) {
        console.warn("[education-startup] Reader does not support writing; skipping sample seed.");
        return;
    }

    try {
        await reader.upsert(SAMPLES, "education");
        console.info("[education-startup] Seeded %d documents into namespace 'education'", SAMPLES.length);
    } catch (err) {
        console.warn(
            "[education-startup] Failed to seed documents: %s",
            err instanceof Error ? err.message : String(err),
        );
    }
}

export default bootstrapEducation;
