// Built-in tools for the restaurant example
export async function getMenu(args: Record<string, string>): Promise<string> {
  const category = args["category"] || "";
  const menu = {
    appetizers: ["Bruschetta al Pomodoro — $12", "Tuna Tartare — $18", "Caesar Salad — $14"],
    mains: ["Grilled Ribeye Steak — $42", "Pan-Seared Salmon — $36", "Mushroom Risotto — $28", "Lobster Linguine — $48"],
    desserts: ["Tiramisu — $14", "Crème Brûlée — $12", "Chocolate Lava Cake — $16"],
    drinks: ["House Red Wine — $10/glass", "Aperol Spritz — $14", "Espresso Martini — $16"],
  };

  if (category && menu[category as keyof typeof menu]) {
    return `${category}: ${menu[category as keyof typeof menu].join(", ")}`;
  }
  return Object.entries(menu).map(([cat, items]) => `${cat}: ${(items as string[]).join(", ")}`).join("\n");
}

export async function checkOrderStatus(args: Record<string, string>): Promise<string> {
  const orderId = args["order_id"] || "";
  return `Order ${orderId}: Preparing — estimated 15 minutes.`;
}

export async function lookupRecipe(args: Record<string, string>): Promise<string> {
  const dish = args["dish_name"] || "";
  const recipes: Record<string, string> = {
    "Mushroom Risotto": "Arborio rice, mixed wild mushrooms, parmesan, white wine, shallots, vegetable stock.",
    "Grilled Ribeye Steak": "Prime ribeye, sea salt, black pepper, rosemary butter, garlic confit.",
    "Tiramisu": "Mascarpone, espresso, ladyfingers, cocoa powder, marsala wine.",
  };
  return recipes[dish] || `Recipe for ${dish} not found.`;
}

export async function getReviews(args: Record<string, string>): Promise<string> {
  const dish = args["dish_name"] || "";
  const reviews: Record<string, string> = {
    "Grilled Ribeye Steak": "4.8/5 — 'Best steak in town!' 'Perfectly cooked.' 'Melts in your mouth.'",
    "Tiramisu": "4.5/5 — 'Authentic Italian.' 'Not too sweet.' 'Perfect ending to the meal.'",
  };
  return reviews[dish] || `No reviews yet for ${dish}.`;
}
