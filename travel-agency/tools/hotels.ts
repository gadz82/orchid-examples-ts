/**
 * Built-in hotel search tools for the travel-agency example.
 *
 * Static demo inventory. No external API calls.
 */

interface Hotel {
    hotel_id: string;
    name: string;
    city: string;
    stars: number;
    nightly_usd: number;
    amenities: string[];
    available_rooms: number;
    near_landmarks: string[];
}

const HOTELS: Hotel[] = [
    {
        hotel_id: "HTL-LON-001",
        name: "The Strand Palace",
        city: "London",
        stars: 4,
        nightly_usd: 210,
        amenities: ["wifi", "breakfast", "gym", "bar"],
        available_rooms: 18,
        near_landmarks: ["Covent Garden", "Trafalgar Square"],
    },
    {
        hotel_id: "HTL-LON-002",
        name: "Mayfair Residence",
        city: "London",
        stars: 5,
        nightly_usd: 520,
        amenities: ["wifi", "breakfast", "gym", "spa", "concierge"],
        available_rooms: 6,
        near_landmarks: ["Hyde Park", "Bond Street"],
    },
    {
        hotel_id: "HTL-PAR-001",
        name: "Hotel Montmartre",
        city: "Paris",
        stars: 3,
        nightly_usd: 140,
        amenities: ["wifi", "breakfast"],
        available_rooms: 25,
        near_landmarks: ["Sacré-Cœur", "Pigalle"],
    },
    {
        hotel_id: "HTL-PAR-002",
        name: "Le Marais Boutique",
        city: "Paris",
        stars: 4,
        nightly_usd: 280,
        amenities: ["wifi", "breakfast", "bar", "terrace"],
        available_rooms: 11,
        near_landmarks: ["Notre-Dame", "Le Marais"],
    },
    {
        hotel_id: "HTL-TYO-001",
        name: "Shibuya Sky",
        city: "Tokyo",
        stars: 4,
        nightly_usd: 190,
        amenities: ["wifi", "breakfast", "gym", "onsen"],
        available_rooms: 32,
        near_landmarks: ["Shibuya Crossing", "Harajuku"],
    },
    {
        hotel_id: "HTL-TYO-002",
        name: "Imperial Gardens",
        city: "Tokyo",
        stars: 5,
        nightly_usd: 610,
        amenities: ["wifi", "breakfast", "spa", "michelin restaurant"],
        available_rooms: 4,
        near_landmarks: ["Imperial Palace", "Ginza"],
    },
    {
        hotel_id: "HTL-ROM-001",
        name: "Via Veneto Classic",
        city: "Rome",
        stars: 4,
        nightly_usd: 230,
        amenities: ["wifi", "breakfast", "rooftop pool"],
        available_rooms: 14,
        near_landmarks: ["Trevi Fountain", "Spanish Steps"],
    },
];

export async function search_hotels(args: Record<string, unknown>): Promise<string | object> {
    const city = String(args["city"] ?? "").trim().toLowerCase();
    const minStars = Number(args["min_stars"] ?? 0);
    const maxNightlyUsd = Number(args["max_nightly_usd"] ?? 0);
    const requiredAmenity = String(args["required_amenity"] ?? "").trim().toLowerCase();

    const matches: Hotel[] = [];
    for (const hotel of HOTELS) {
        if (city && hotel.city.toLowerCase() !== city) continue;
        if (!Number.isNaN(minStars) && minStars > 0 && hotel.stars < minStars) continue;
        if (!Number.isNaN(maxNightlyUsd) && maxNightlyUsd > 0 && hotel.nightly_usd > maxNightlyUsd) continue;
        if (requiredAmenity && !hotel.amenities.some((a) => a.toLowerCase() === requiredAmenity)) continue;
        matches.push(hotel);
    }

    matches.sort((a, b) => (b.stars - a.stars) || (a.nightly_usd - b.nightly_usd));

    return {
        query: {
            city: city || "any",
            min_stars: minStars || null,
            max_nightly_usd: maxNightlyUsd || null,
            required_amenity: requiredAmenity || null,
        },
        count: matches.length,
        hotels: matches,
    };
}

export async function get_hotel_details(args: Record<string, unknown>): Promise<string | object> {
    const hotelId = String(args["hotel_id"] ?? "").trim().toUpperCase();
    for (const hotel of HOTELS) {
        if (hotel.hotel_id === hotelId) {
            return { ...hotel };
        }
    }
    return {
        error: `Hotel '${hotelId}' not found`,
        available_hotels: HOTELS.map((h) => h.hotel_id),
    };
}
