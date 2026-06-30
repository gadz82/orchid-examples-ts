import type {
    OrchidVectorReader,
    OrchidVectorWriter,
    OrchidDocument,
} from "@orchid-ai/orchid/core";

/** Best-effort seed of the four conference knowledge namespaces. */
export async function seedConferenceKnowledge(
    orchid: { runtime?: { reader?: OrchidVectorReader; writer?: OrchidVectorWriter } },
): Promise<void> {
    const store = orchid.runtime?.writer ?? orchid.runtime?.reader;
    if (!store || typeof (store as OrchidVectorWriter).index !== "function") {
        console.warn("[tech_conference] No vector writer available; skipping seed.");
        return;
    }

    const writer = store as OrchidVectorWriter;
    const corpora: Record<string, OrchidDocument[]> = {
        venue: [
            {
                id: "venue-main",
                pageContent:
                    "Main keynote hall is on Floor 2, Zone A. Nearest elevator is by the registration desk. " +
                    "Wi-Fi: ConferenceHero / password: keynote2026.",
                metadata: { source: "venue.md" },
            },
            {
                id: "venue-green-room",
                pageContent:
                    "Speaker green room is on Floor 1 behind the information desk. Open from 07:00 to 18:00.",
                metadata: { source: "venue.md" },
            },
        ],
        schedule: [
            {
                id: "schedule-keynote",
                pageContent:
                    "Dr. Sarah Chen delivers the opening keynote 'AI at Scale' on Day 1 at 09:00 in the main hall.",
                metadata: { source: "schedule.md" },
            },
            {
                id: "schedule-workshop",
                pageContent:
                    "Hands-on RAG workshop runs Day 2 at 14:00 in Room 301. Prerequisites: basic TypeScript.",
                metadata: { source: "schedule.md" },
            },
        ],
        "visitor-services": [
            {
                id: "visitor-registration",
                pageContent:
                    "Registration opens at 08:00 near the main entrance. Badges are required for all sessions.",
                metadata: { source: "visitor.md" },
            },
            {
                id: "visitor-food",
                pageContent:
                    "Lunch is served 12:30-14:00 in the Expo Hall. Vegetarian, vegan, and gluten-free options available.",
                metadata: { source: "visitor.md" },
            },
        ],
        "speaker-services": [
            {
                id: "speaker-av",
                pageContent:
                    "Each room has HDMI and USB-C connectors. Submit slides at least 24 hours before your session.",
                metadata: { source: "speaker.md" },
            },
            {
                id: "speaker-checkin",
                pageContent:
                    "Speakers check in at the green room. A speaker liaison will escort you to your room 15 minutes prior.",
                metadata: { source: "speaker.md" },
            },
        ],
    };

    for (const [namespace, docs] of Object.entries(corpora)) {
        try {
            await writer.index(docs, namespace);
            console.info("[tech_conference] Seeded %d docs into '%s'.", docs.length, namespace);
        } catch (err) {
            console.warn("[tech_conference] Failed to seed '%s':", namespace, err);
        }
    }
}
