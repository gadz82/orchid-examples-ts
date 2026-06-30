/**
 * Startup hook for the restaurant example.
 *
 * Seeds the `menu` and `reviews` RAG namespaces with static demo data so the
 * menu agent and reviews agent have retrieval context available.
 *
 * Referenced in orchid.yml as:
 *
 *   startup:
 *     hook: ./hooks/startup.ts#bootstrapRestaurant
 */

import type { OrchidVectorReader, OrchidVectorWriter, OrchidDocument } from "@orchid-ai/orchid/core";

const MENU_ITEMS: OrchidDocument[] = [
    {
        id: "menu-margherita",
        pageContent:
            "Margherita Pizza — $14.99. Classic Neapolitan pizza with San Marzano tomatoes, " +
            "buffalo mozzarella, fresh basil, and olive oil. Vegetarian. Allergens: gluten, dairy. 820 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "pizza" },
    },
    {
        id: "menu-truffle-risotto",
        pageContent:
            "Truffle Mushroom Risotto — $22.50. Creamy risotto with wild porcini mushrooms and a " +
            "drizzle of black truffle oil. Vegetarian and gluten-free. Allergens: dairy. 680 cal.",
        metadata: {
            tenant_id: "__shared__",
            scope: "tenant",
            source: "menu",
            category: "pasta & risotto",
        },
    },
    {
        id: "menu-grilled-salmon",
        pageContent:
            "Grilled Atlantic Salmon — $28.00. Pan-seared salmon fillet with lemon-caper butter and " +
            "roasted asparagus. Gluten-free and high-protein. Allergens: fish, dairy. 540 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "seafood" },
    },
    {
        id: "menu-caesar-salad",
        pageContent:
            "Classic Caesar Salad — $12.50. Crisp romaine with house-made Caesar dressing, shaved " +
            "parmesan, and garlic croutons. Allergens: gluten, dairy, fish. 380 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "salad" },
    },
    {
        id: "menu-vegan-buddha-bowl",
        pageContent:
            "Vegan Buddha Bowl — $16.99. Nourishing bowl with roasted sweet potato, chickpeas, avocado, " +
            "and tahini drizzle. Vegan, gluten-free, and dairy-free. Allergens: sesame. 520 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "bowl" },
    },
    {
        id: "menu-filet-mignon",
        pageContent:
            "Filet Mignon — $42.00. 8oz prime beef tenderloin with red wine jus, garlic mash, and " +
            "haricots verts. Gluten-free and high-protein. Allergens: dairy. 720 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "steak" },
    },
    {
        id: "menu-tiramisu",
        pageContent:
            "Classic Tiramisu — $11.00. Traditional Italian tiramisu with layers of espresso-soaked " +
            "ladyfingers and mascarpone cream. Vegetarian. Allergens: gluten, dairy, eggs. 450 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "dessert" },
    },
    {
        id: "menu-thai-curry",
        pageContent:
            "Spicy Thai Green Curry — $18.50. Fragrant green curry with crispy tofu, bamboo shoots, " +
            "and steamed jasmine rice. Vegan, gluten-free, and dairy-free. Allergens: soy. 580 cal.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "menu", category: "curry" },
    },
];

const REVIEWS: OrchidDocument[] = [
    {
        id: "review-001",
        pageContent:
            "The truffle mushroom risotto was absolutely delicious and the service was attentive. " +
            "A wonderful evening overall.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "reviews", dish: "truffle mushroom risotto" },
    },
    {
        id: "review-002",
        pageContent:
            "Margherita pizza was fresh and flavorful, but we waited too long for our drinks. " +
            "Still recommend it for the food quality.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "reviews", dish: "margherita pizza" },
    },
    {
        id: "review-003",
        pageContent:
            "Filet mignon was overcooked and the ambiance was too noisy. Disappointing experience " +
            "for the price.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "reviews", dish: "filet mignon" },
    },
    {
        id: "review-004",
        pageContent:
            "Loved the vegan buddha bowl! Great value and the tahini dressing was incredible. " +
            "Will order again.",
        metadata: { tenant_id: "__shared__", scope: "tenant", source: "reviews", dish: "vegan buddha bowl" },
    },
];

function isWriter(reader: OrchidVectorReader): reader is OrchidVectorReader & OrchidVectorWriter {
    return typeof (reader as unknown as OrchidVectorWriter).upsert === "function";
}

export async function bootstrapRestaurant(orchid: {
    runtime?: { reader?: OrchidVectorReader };
}): Promise<void> {
    const reader = orchid?.runtime?.reader;
    if (!reader) {
        console.info("[Restaurant] No vector reader available — skipping RAG seed");
        return;
    }
    if (!isWriter(reader)) {
        console.info("[Restaurant] Reader does not support writing — skipping RAG seed");
        return;
    }

    try {
        await reader.upsert(MENU_ITEMS, "menu");
        console.info("[Restaurant] Seeded %d menu items into RAG", MENU_ITEMS.length);
    } catch (exc: unknown) {
        console.warn("[Restaurant] Menu RAG seed failed:", exc instanceof Error ? exc.message : String(exc));
    }

    try {
        await reader.upsert(REVIEWS, "reviews");
        console.info("[Restaurant] Seeded %d reviews into RAG", REVIEWS.length);
    } catch (exc: unknown) {
        console.warn("[Restaurant] Reviews RAG seed failed:", exc instanceof Error ? exc.message : String(exc));
    }
}

export default bootstrapRestaurant;
