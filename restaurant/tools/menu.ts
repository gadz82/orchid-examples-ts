/**
 * Built-in menu tools — search the menu and list daily specials.
 *
 * All data is static / in-memory. Handlers receive the parsed YAML
 * arguments object and return structured data that the LLM sees as the
 * tool result.
 */

interface MenuItem {
    readonly name: string;
    readonly category: string;
    readonly price: number;
    readonly ingredients: string[];
    readonly allergens: string[];
    readonly dietary: string[];
    readonly calories: number;
    readonly description: string;
}

const MENU: Record<string, MenuItem> = {
    "margherita pizza": {
        name: "Margherita Pizza",
        category: "pizza",
        price: 14.99,
        ingredients: ["tomato sauce", "mozzarella", "fresh basil", "olive oil"],
        allergens: ["gluten", "dairy"],
        dietary: ["vegetarian"],
        calories: 820,
        description:
            "Classic Neapolitan pizza with San Marzano tomatoes and buffalo mozzarella.",
    },
    "truffle mushroom risotto": {
        name: "Truffle Mushroom Risotto",
        category: "pasta & risotto",
        price: 22.5,
        ingredients: [
            "arborio rice",
            "porcini mushrooms",
            "truffle oil",
            "parmesan",
            "white wine",
        ],
        allergens: ["dairy"],
        dietary: ["vegetarian", "gluten-free"],
        calories: 680,
        description:
            "Creamy risotto with wild porcini mushrooms and a drizzle of black truffle oil.",
    },
    "grilled salmon": {
        name: "Grilled Atlantic Salmon",
        category: "seafood",
        price: 28.0,
        ingredients: ["atlantic salmon", "lemon", "capers", "asparagus", "dill butter"],
        allergens: ["fish", "dairy"],
        dietary: ["gluten-free", "high-protein"],
        calories: 540,
        description: "Pan-seared salmon fillet with lemon-caper butter and roasted asparagus.",
    },
    "caesar salad": {
        name: "Classic Caesar Salad",
        category: "salad",
        price: 12.5,
        ingredients: [
            "romaine lettuce",
            "parmesan",
            "croutons",
            "caesar dressing",
            "anchovies",
        ],
        allergens: ["gluten", "dairy", "fish"],
        dietary: [],
        calories: 380,
        description:
            "Crisp romaine with house-made Caesar dressing, shaved parmesan, and garlic croutons.",
    },
    "vegan buddha bowl": {
        name: "Vegan Buddha Bowl",
        category: "bowl",
        price: 16.99,
        ingredients: [
            "quinoa",
            "roasted chickpeas",
            "avocado",
            "sweet potato",
            "tahini dressing",
        ],
        allergens: ["sesame"],
        dietary: ["vegan", "gluten-free", "dairy-free"],
        calories: 520,
        description:
            "Nourishing bowl with roasted sweet potato, chickpeas, avocado, and tahini drizzle.",
    },
    "filet mignon": {
        name: "Filet Mignon",
        category: "steak",
        price: 42.0,
        ingredients: [
            "beef tenderloin",
            "red wine reduction",
            "garlic mashed potatoes",
            "green beans",
        ],
        allergens: ["dairy"],
        dietary: ["gluten-free", "high-protein"],
        calories: 720,
        description:
            "8oz prime beef tenderloin with red wine jus, garlic mash, and haricots verts.",
    },
    tiramisu: {
        name: "Classic Tiramisu",
        category: "dessert",
        price: 11.0,
        ingredients: ["mascarpone", "espresso", "ladyfingers", "cocoa powder", "marsala wine"],
        allergens: ["gluten", "dairy", "eggs"],
        dietary: ["vegetarian"],
        calories: 450,
        description:
            "Traditional Italian tiramisu with layers of espresso-soaked ladyfingers and mascarpone cream.",
    },
    "spicy thai curry": {
        name: "Spicy Thai Green Curry",
        category: "curry",
        price: 18.5,
        ingredients: [
            "coconut milk",
            "green curry paste",
            "tofu",
            "bamboo shoots",
            "thai basil",
            "jasmine rice",
        ],
        allergens: ["soy"],
        dietary: ["vegan", "gluten-free", "dairy-free"],
        calories: 580,
        description:
            "Fragrant green curry with crispy tofu, bamboo shoots, and steamed jasmine rice.",
    },
};

const DAILY_SPECIALS = [
    {
        name: "Pan-Seared Duck Breast",
        price: 34.0,
        description:
            "Duck breast with cherry gastrique, roasted root vegetables, and wild rice pilaf.",
        available_until: "10:00 PM",
    },
    {
        name: "Lobster Linguine",
        price: 38.0,
        description: "Fresh Maine lobster tossed with linguine in a light saffron cream sauce.",
        available_until: "9:30 PM",
    },
];

function matchItems(query: string, dietaryFilter: string): MenuItem[] {
    const queryLower = query.trim().toLowerCase();
    const dietLower = dietaryFilter.trim().toLowerCase();

    const results: MenuItem[] = [];
    for (const [key, item] of Object.entries(MENU)) {
        const textMatch =
            !queryLower ||
            queryLower === key ||
            queryLower.includes(key) ||
            key.includes(queryLower) ||
            queryLower.includes(item.category.toLowerCase()) ||
            queryLower.includes(item.description.toLowerCase()) ||
            item.ingredients.some((ing) => ing.toLowerCase().includes(queryLower));
        const dietMatch =
            !dietLower || item.dietary.some((d) => d.toLowerCase() === dietLower);
        if (textMatch && dietMatch) {
            results.push(item);
        }
    }
    return results;
}

export async function searchMenu(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const query = String(args.query ?? args.q ?? "");
    const dietaryFilter = String(args.dietary_filter ?? args.dietaryFilter ?? "");
    const results = matchItems(query, dietaryFilter);

    if (results.length === 0) {
        return {
            matches: [],
            message: `No menu items found for '${query}'${dietaryFilter ? ` with filter '${dietaryFilter}'` : ""}`,
            suggestion: "Try broader terms like 'pizza', 'salad', 'vegan', or 'seafood'.",
        };
    }

    return {
        matches: results,
        count: results.length,
        query,
        dietary_filter: dietaryFilter || "none",
    };
}

export async function getDailySpecials(
    _args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    return {
        specials: DAILY_SPECIALS,
        count: DAILY_SPECIALS.length,
        note: "Daily specials are available while supplies last. Ask your server for details.",
    };
}
