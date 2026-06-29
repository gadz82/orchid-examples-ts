/**
 * Startup hook for the travel-agency example.
 *
 * Demonstrates:
 *   - Dynamic tool registration via registerTool()
 *   - Seeding RAG with destination guide documents
 *
 * Referenced in orchid.yml as:
 *
 *   startup:
 *     hook: ./hooks/startup.ts#bootstrapTravel
 */

import { registerTool } from "@orchid-ai/orchid/config";
import { OrchidTool, OrchidToolOutput } from "@orchid-ai/orchid/core";
import type { OrchidToolInput, OrchidVectorReader, OrchidVectorWriter } from "@orchid-ai/orchid/core";

interface DestinationGuide {
    city: string;
    content: string;
}

const DESTINATIONS: DestinationGuide[] = [
    {
        city: "London",
        content:
            "London highlights: British Museum (free), Tower of London, Hyde Park, " +
            "West End theatres, markets (Borough, Camden, Portobello). Typical " +
            "spring weather: 10-18°C, rain likely. Best neighbourhoods: Covent " +
            "Garden, Mayfair, Shoreditch. Transit: Oyster card or contactless.",
    },
    {
        city: "Paris",
        content:
            "Paris highlights: Louvre, Musée d'Orsay, Eiffel Tower, Montmartre, " +
            "Le Marais, Notre-Dame (exterior only during restoration). Spring: " +
            "8-17°C, variable. Book museums in advance. Metro pass (Navigo) " +
            "recommended for 3+ day stays.",
    },
    {
        city: "Tokyo",
        content:
            "Tokyo highlights: Shibuya Crossing, Tsukiji Outer Market, Asakusa, " +
            "Meiji Shrine, teamLab Planets, Akihabara. Spring: 12-20°C, " +
            "cherry blossoms late March through early April. Suica/Pasmo IC " +
            "card for trains. Most shops card-accepted.",
    },
    {
        city: "Rome",
        content:
            "Rome highlights: Colosseum, Forum, Pantheon, Vatican Museums + St " +
            "Peter's, Trastevere evenings. Spring: 12-22°C. Book Vatican and " +
            "Colosseum entry online in advance. Pickpockets on buses 64/40 and " +
            "Termini area — carry essentials in front.",
    },
];

class EstimateTripBudgetTool extends OrchidTool {
    name = "estimate_trip_budget";
    description = "Estimate total trip cost (lodging + flights + meals).";
    parametersSchema = {
        type: "object",
        properties: {
            nights: { type: "number", description: "Number of nights", default: 0 },
            nightly_usd: { type: "number", description: "Nightly lodging cost in USD", default: 0 },
            flights_usd: { type: "number", description: "Flight cost in USD", default: 0 },
            daily_meals_usd: { type: "number", description: "Daily meals budget in USD", default: 60 },
        },
    };

    async invoke(toolInput: OrchidToolInput): Promise<OrchidToolOutput> {
        const args = toolInput.parameters;
        const nights = Number(args["nights"] ?? 0);
        const nightlyUsd = Number(args["nightly_usd"] ?? 0);
        const flightsUsd = Number(args["flights_usd"] ?? 0);
        const dailyMealsUsd = Number(args["daily_meals_usd"] ?? 60);

        const lodging = Math.max(0, nights) * Math.max(0, nightlyUsd);
        const meals = Math.max(0, nights) * Math.max(0, dailyMealsUsd);
        const total = lodging + flightsUsd + meals;

        return new OrchidToolOutput({
            nights,
            lodging_usd: lodging,
            flights_usd: flightsUsd,
            meals_usd: meals,
            total_usd: total,
            breakdown: `${nights} night(s) × $${nightlyUsd}/night = $${lodging} lodging; $${flightsUsd} flights; $${dailyMealsUsd}/day × ${nights} = $${meals} meals`,
        });
    }
}

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function bootstrapTravel(orchid: { runtime?: { reader?: OrchidVectorReader } }): Promise<void> {
    // Register a custom budget-estimate tool at startup.
    const budgetTool = new EstimateTripBudgetTool();
    registerTool(budgetTool.name, budgetTool);
    console.info("[TravelAgency] Registered custom tool: estimate_trip_budget");

    // Seed destination guides into RAG.
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.info("[TravelAgency] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.info("[TravelAgency] Reader does not support writing — skipping RAG seed");
        return;
    }

    const documents = DESTINATIONS.map((d) => ({
        id: `dest-${d.city.toLowerCase()}`,
        pageContent: d.content,
        metadata: {
            tenant_id: "__shared__",
            city: d.city,
            scope: "tenant",
            source: "destination_guide",
        },
    }));

    try {
        await reader.upsert(documents, "destinations");
        console.info("[TravelAgency] Seeded %d destination guides into RAG", documents.length);
    } catch (exc) {
        console.warn("[TravelAgency] RAG seed failed:", String(exc));
    }
}

export default bootstrapTravel;
