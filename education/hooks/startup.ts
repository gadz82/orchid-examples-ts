import { ingestDocument } from "@orchid-ai/orchid/documents";
import { makeScope } from "@orchid-ai/orchid/core";
import type { OrchidVectorWriter } from "@orchid-ai/orchid/core";

const SAMPLES = [
    {
        filename: "photosynthesis-overview.txt",
        text: `Photosynthesis is the process used by plants, algae, and some bacteria to convert light energy into chemical energy. The overall equation is 6 CO2 + 6 H2O + light energy -> C6H12O6 + 6 O2. Key concepts include chlorophyll, the chloroplast, the light-dependent reactions, and the Calvin cycle.`,
    },
    {
        filename: "american-revolution.txt",
        text: `The American Revolution was a colonial revolt that took place between 1765 and 1783. The Thirteen Colonies rejected the British monarchy and aristocracy, overthrew the authority of Great Britain, and founded the United States of America. Key events include the Stamp Act, the Boston Tea Party, the Declaration of Independence, and the Treaty of Paris.`,
    },
    {
        filename: "cell-biology.txt",
        text: `Cells are the basic structural and functional units of life. Eukaryotic cells contain a nucleus and membrane-bound organelles such as mitochondria, the endoplasmic reticulum, and the Golgi apparatus. Prokaryotic cells lack a nucleus and most organelles. Key concepts include the cell membrane, cytoplasm, DNA, and ribosomes.`,
    },
];

export async function bootstrapEducation(orchid: unknown): Promise<void> {
    const runtime = (orchid as Record<string, unknown> | null)?.runtime;
    const writer = (runtime as Record<string, unknown> | null)?.writer as
        | OrchidVectorWriter
        | undefined;

    if (!writer) {
        console.warn("[education-startup] No vector writer available; skipping sample seed.");
        return;
    }

    const scope = makeScope({
        tenantId: "default",
        userId: "",
        chatId: "",
        agentId: "",
    });

    for (const sample of SAMPLES) {
        try {
            await ingestDocument({
                preExtractedText: sample.text,
                filename: sample.filename,
                scope,
                namespace: "education",
                writer,
            });
            console.info("[education-startup] Seeded %s into namespace 'education'", sample.filename);
        } catch (err) {
            console.warn(
                "[education-startup] Failed to seed %s: %s",
                sample.filename,
                err instanceof Error ? err.message : String(err),
            );
        }
    }
}
