/**
 * Startup hook for the hospital_front_office example.
 *
 * Seeds four RAG namespaces with tiny demo knowledge chunks so each
 * specialist agent has something to retrieve.  In a real deployment these
 * documents would be indexed from markdown files; here we use static demo
 * data so the example runs without extra assets.
 *
 * Referenced in orchid.yml as:
 *
 *   startup:
 *     hook: ./hooks/startup.ts#seedHospitalKnowledge
 */

import type { OrchidVectorReader, OrchidVectorWriter, OrchidDocument } from "@orchid-ai/orchid/core";

const DEPARTMENT_DOCS: OrchidDocument[] = [
    {
        id: "dept-cardiology",
        pageContent:
            "Cardiology Department — located on the 3rd floor, East Wing. " +
            "Nearest stairwell: Stair B. Nearest elevator: Elevator 2. " +
            "From the main entrance: take the central lifts to the 3rd floor, turn right, " +
            "walk past the pharmacy, then Cardiology is the third door on the left. " +
            "Landmarks nearby: cafeteria, cardiology waiting area. Wheelchair accessible.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "departments", department: "cardiology" },
    },
    {
        id: "dept-pediatrics",
        pageContent:
            "Pediatrics Department — located on the 2nd floor, North Wing. " +
            "Nearest stairwell: Stair A. Nearest elevator: Elevator 1. " +
            "From the main entrance: take the central lifts to the 2nd floor, turn left, " +
            "Pediatrics is at the end of the corridor. Landmarks nearby: play area, pharmacy. " +
            "Wheelchair and stroller accessible.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "departments", department: "pediatrics" },
    },
];

const BUREAUCRACY_DOCS: OrchidDocument[] = [
    {
        id: "bureau-registration",
        pageContent:
            "New patient registration procedure: bring a valid ID, tax code, and insurance card. " +
            "Go to the Admissions Office on the ground floor, Window 3. " +
            "Operating hours: Monday-Friday 08:00-18:00, Saturday 08:00-12:00. " +
            "Fill in the registration form in advance via the patient portal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "bureaucracy", topic: "registration" },
    },
    {
        id: "bureau-records",
        pageContent:
            "Medical records request: submit a signed request at the Medical Records Office, " +
            "ground floor, Window 7. Required documents: valid ID and signed consent form. " +
            "Processing time: up to 15 working days. Digital copies are delivered via the patient portal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "bureaucracy", topic: "medical_records" },
    },
];

const OPENING_HOURS_DOCS: OrchidDocument[] = [
    {
        id: "hours-general",
        pageContent:
            "General hospital visiting hours: 14:00-20:00 daily. " +
            "Intensive care visiting hours: 11:00-12:00 and 18:00-19:00 only. " +
            "Pediatrics visiting hours: 10:00-20:00 with no more than two visitors per bed. " +
            "Holiday schedules are published on the hospital website.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "opening_hours", topic: "visiting" },
    },
    {
        id: "hours-pharmacy",
        pageContent:
            "Hospital pharmacy hours: Monday-Friday 08:00-19:30, Saturday 09:00-13:00. " +
            "Closed on Sundays and public holidays. Located on the ground floor next to the main entrance.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "opening_hours", topic: "pharmacy" },
    },
];

const EMERGENCY_DOCS: OrchidDocument[] = [
    {
        id: "triage-red",
        pageContent:
            "Triage code Red — life-threatening emergency (cardiac arrest, severe bleeding, " +
            "airway obstruction, major trauma). Immediate care required. Call 118 if outside the hospital. " +
            "Expected wait: immediate.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "emergency", triage: "red" },
    },
    {
        id: "triage-green",
        pageContent:
            "Triage code Green — minor illness or injury (sprains, mild fever, small cuts). " +
            "Non-urgent care. Expected wait: 60-120 minutes. Consider primary care for follow-up.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "emergency", triage: "green" },
    },
];

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function seedHospitalKnowledge(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.warn("[Hospital] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.warn("[Hospital] Reader does not support writing — skipping RAG seed");
        return;
    }

    const batches: Array<[OrchidDocument[], string]> = [
        [DEPARTMENT_DOCS, "departments"],
        [BUREAUCRACY_DOCS, "bureaucracy"],
        [OPENING_HOURS_DOCS, "opening-hours"],
        [EMERGENCY_DOCS, "emergency"],
    ];

    for (const [docs, namespace] of batches) {
        try {
            await reader.upsert(docs, namespace);
            console.info("[Hospital] Seeded %d documents into namespace '%s'", docs.length, namespace);
        } catch (exc: unknown) {
            console.warn(
                "[Hospital] RAG seed failed for '%s': %s",
                namespace,
                exc instanceof Error ? exc.message : String(exc),
            );
        }
    }
}

export default seedHospitalKnowledge;
