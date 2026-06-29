/**
 * Built-in flight search tools for the travel-agency example.
 *
 * Static demo inventory. No external API calls.
 */

interface Flight {
    flight_no: string;
    airline: string;
    origin: string;
    destination: string;
    depart: string;
    arrive: string;
    price_usd: number;
    seats_available: number;
    cabin: string;
}

const FLIGHTS: Flight[] = [
    {
        flight_no: "AA101",
        airline: "Alpha Airways",
        origin: "JFK",
        destination: "LHR",
        depart: "2026-05-10T22:00",
        arrive: "2026-05-11T10:30",
        price_usd: 720,
        seats_available: 23,
        cabin: "economy",
    },
    {
        flight_no: "AA102",
        airline: "Alpha Airways",
        origin: "JFK",
        destination: "LHR",
        depart: "2026-05-10T23:30",
        arrive: "2026-05-11T11:45",
        price_usd: 1890,
        seats_available: 4,
        cabin: "business",
    },
    {
        flight_no: "BT205",
        airline: "Blue Tail",
        origin: "JFK",
        destination: "CDG",
        depart: "2026-05-10T21:00",
        arrive: "2026-05-11T10:15",
        price_usd: 680,
        seats_available: 47,
        cabin: "economy",
    },
    {
        flight_no: "SW314",
        airline: "SkyWest",
        origin: "LAX",
        destination: "NRT",
        depart: "2026-05-15T11:00",
        arrive: "2026-05-16T15:30",
        price_usd: 1240,
        seats_available: 12,
        cabin: "economy",
    },
    {
        flight_no: "SW315",
        airline: "SkyWest",
        origin: "LAX",
        destination: "NRT",
        depart: "2026-05-15T13:30",
        arrive: "2026-05-16T18:00",
        price_usd: 2850,
        seats_available: 6,
        cabin: "business",
    },
    {
        flight_no: "AA408",
        airline: "Alpha Airways",
        origin: "SFO",
        destination: "FCO",
        depart: "2026-05-20T19:00",
        arrive: "2026-05-21T14:45",
        price_usd: 890,
        seats_available: 31,
        cabin: "economy",
    },
];

export async function search_flights(args: Record<string, unknown>): Promise<string | object> {
    const origin = String(args["origin"] ?? "").trim().toUpperCase();
    const destination = String(args["destination"] ?? "").trim().toUpperCase();
    const cabin = String(args["cabin"] ?? "").trim().toLowerCase();
    const maxPriceUsd = Number(args["max_price_usd"] ?? 0);

    const matches: Flight[] = [];
    for (const flight of FLIGHTS) {
        if (origin && flight.origin !== origin) continue;
        if (destination && flight.destination !== destination) continue;
        if (cabin && flight.cabin !== cabin) continue;
        if (!Number.isNaN(maxPriceUsd) && maxPriceUsd > 0 && flight.price_usd > maxPriceUsd) continue;
        matches.push(flight);
    }

    matches.sort((a, b) => a.price_usd - b.price_usd);

    return {
        query: {
            origin: origin || "any",
            destination: destination || "any",
            cabin: cabin || "any",
            max_price_usd: maxPriceUsd || null,
        },
        count: matches.length,
        flights: matches,
    };
}

export async function get_flight_details(args: Record<string, unknown>): Promise<string | object> {
    const flightNo = String(args["flight_no"] ?? "").trim().toUpperCase();
    for (const flight of FLIGHTS) {
        if (flight.flight_no === flightNo) {
            return { ...flight };
        }
    }
    return {
        error: `Flight '${flightNo}' not found`,
        available_flights: FLIGHTS.map((f) => f.flight_no),
    };
}
