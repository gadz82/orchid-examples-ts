/**
 * Built-in order tools — place orders, check status, and calculate bills.
 *
 * All data is static / in-memory. Handlers receive the parsed YAML
 * arguments object and return structured data that the LLM sees as the
 * tool result.
 */

import { randomUUID } from "node:crypto";

interface OrderItem {
    name: string;
    qty: number;
    price: number;
}

interface Order {
    order_id: string;
    table_number: number | string;
    items: OrderItem[];
    status: string;
    estimated_time_min: number;
    special_requests?: string;
    subtotal?: number;
}

const ORDERS: Record<string, Order> = {
    "ORD-001": {
        order_id: "ORD-001",
        table_number: 5,
        items: [
            { name: "Margherita Pizza", qty: 1, price: 14.99 },
            { name: "Classic Caesar Salad", qty: 1, price: 12.5 },
            { name: "Classic Tiramisu", qty: 2, price: 11.0 },
        ],
        status: "preparing",
        estimated_time_min: 20,
        special_requests: "No anchovies on the salad",
    },
    "ORD-002": {
        order_id: "ORD-002",
        table_number: 12,
        items: [
            { name: "Filet Mignon", qty: 2, price: 42.0 },
            { name: "Truffle Mushroom Risotto", qty: 1, price: 22.5 },
        ],
        status: "ready",
        estimated_time_min: 0,
        special_requests: "Medium-rare on both steaks",
    },
};

const PRICES: Record<string, number> = {
    "margherita pizza": 14.99,
    "truffle mushroom risotto": 22.5,
    "grilled atlantic salmon": 28.0,
    "classic caesar salad": 12.5,
    "vegan buddha bowl": 16.99,
    "filet mignon": 42.0,
    "classic tiramisu": 11.0,
    "spicy thai green curry": 18.5,
    "pan-seared duck breast": 34.0,
    "lobster linguine": 38.0,
};

function findPrice(itemName: string): number | null {
    const key = itemName.trim().toLowerCase();
    if (PRICES[key] !== undefined) return PRICES[key];
    for (const [name, price] of Object.entries(PRICES)) {
        if (key.includes(name) || name.includes(key)) return price;
    }
    return null;
}

export async function placeOrder(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const itemsStr = String(args.items ?? args.query ?? "");
    const tableNumber = Number(args.table_number ?? args.tableNumber ?? 0);

    if (!itemsStr) {
        return { error: "No items specified. Please provide comma-separated menu item names." };
    }

    const itemList = itemsStr
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
    const orderItems: OrderItem[] = [];
    const unknown: string[] = [];

    for (const itemName of itemList) {
        const price = findPrice(itemName);
        if (price !== null) {
            orderItems.push({ name: itemName, qty: 1, price });
        } else {
            unknown.push(itemName);
        }
    }

    if (orderItems.length === 0) {
        return {
            error: "None of the requested items were found on the menu.",
            unknown_items: unknown,
            suggestion: "Use the search_menu tool to find available items.",
        };
    }

    const orderId = `ORD-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const estimatedMin = 15 + orderItems.length * 5;

    const order: Order = {
        order_id: orderId,
        table_number: tableNumber || "takeout",
        items: orderItems,
        status: "confirmed",
        estimated_time_min: estimatedMin,
        subtotal: Math.round(subtotal * 100) / 100,
    };
    ORDERS[orderId] = order;

    const result: Record<string, unknown> = {
        order_id: orderId,
        table_number: tableNumber || "takeout",
        items: orderItems,
        subtotal: order.subtotal,
        tax: Math.round(subtotal * 0.08 * 100) / 100,
        total: Math.round(subtotal * 1.08 * 100) / 100,
        estimated_time_min: estimatedMin,
        status: "confirmed",
        message: `Order ${orderId} confirmed! Estimated time: ${estimatedMin} minutes.`,
    };

    if (unknown.length > 0) {
        result.warnings = `Items not found and excluded: ${unknown.join(", ")}`;
    }

    return result;
}

export async function getOrderStatus(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const orderId = String(args.order_id ?? args.orderId ?? "").trim().toUpperCase();
    const order = ORDERS[orderId];

    if (order) {
        return {
            order_id: orderId,
            status: order.status,
            table_number: order.table_number,
            items: order.items,
            estimated_time_min: order.estimated_time_min,
            special_requests: order.special_requests ?? "",
        };
    }

    return {
        error: `Order '${orderId}' not found.`,
        available_orders: Object.keys(ORDERS),
        suggestion: "Check the order ID and try again, or place a new order.",
    };
}

export async function calculateBill(
    args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const orderId = String(args.order_id ?? args.orderId ?? "").trim().toUpperCase();
    const order = ORDERS[orderId];

    if (!order) {
        return {
            error: `Order '${orderId}' not found.`,
            available_orders: Object.keys(ORDERS),
        };
    }

    const itemsDetail: Record<string, unknown>[] = [];
    let subtotal = 0.0;

    for (const item of order.items) {
        const lineTotal = item.price * item.qty;
        itemsDetail.push({
            name: item.name,
            quantity: item.qty,
            unit_price: item.price,
            line_total: Math.round(lineTotal * 100) / 100,
        });
        subtotal += lineTotal;
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

    return {
        order_id: orderId,
        table_number: order.table_number,
        items: itemsDetail,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_8_pct: tax,
        service_charge_18_pct: serviceCharge,
        total,
        payment_methods: ["cash", "credit card", "mobile pay"],
        message: `Bill for table ${order.table_number}: $${total.toFixed(2)} (incl. tax and 18% service charge).`,
    };
}
