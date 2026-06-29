/**
 * Built-in booking tools for the travel-agency example.
 *
 * In-memory demo store. Booking tools are flagged `requires_approval: true`
 * in agents.yaml to trigger human-in-the-loop approval.
 */

import { randomUUID } from "node:crypto";
import { get_flight_details } from "./flights.js";
import { get_hotel_details } from "./hotels.js";

const BOOKINGS = new Map<string, Record<string, unknown>>();

function makeBookingId(prefix: string): string {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${prefix}-${suffix}`;
}

export async function book_flight(args: Record<string, unknown>): Promise<string | object> {
    const flightNo = String(args["flight_no"] ?? "").trim().toUpperCase();
    const passengerName = String(args["passenger_name"] ?? "").trim();

    if (!flightNo) return { error: "Missing flight_no" };
    if (!passengerName) return { error: "Missing passenger_name" };

    const flight = await get_flight_details({ flight_no: flightNo }) as Record<string, unknown>;
    if ("error" in flight) return flight;

    const bookingId = makeBookingId("BKF");
    const record: Record<string, unknown> = {
        booking_id: bookingId,
        type: "flight",
        flight_no: flightNo,
        passenger_name: passengerName,
        status: "confirmed",
        airline: flight["airline"],
        origin: flight["origin"],
        destination: flight["destination"],
        depart: flight["depart"],
        arrive: flight["arrive"],
        cabin: flight["cabin"],
        price_usd: flight["price_usd"],
    };
    BOOKINGS.set(bookingId, record);
    return record;
}

export async function book_hotel(args: Record<string, unknown>): Promise<string | object> {
    const hotelId = String(args["hotel_id"] ?? "").trim().toUpperCase();
    const guestName = String(args["guest_name"] ?? "").trim();
    const checkIn = String(args["check_in"] ?? "").trim();
    const checkOut = String(args["check_out"] ?? "").trim();

    const missing: string[] = [];
    if (!hotelId) missing.push("hotel_id");
    if (!guestName) missing.push("guest_name");
    if (!checkIn) missing.push("check_in");
    if (!checkOut) missing.push("check_out");
    if (missing.length > 0) {
        return { error: `Missing required fields: ${missing}` };
    }

    const hotel = await get_hotel_details({ hotel_id: hotelId }) as Record<string, unknown>;
    if ("error" in hotel) return hotel;

    const inDate = Date.parse(checkIn);
    const outDate = Date.parse(checkOut);
    if (Number.isNaN(inDate) || Number.isNaN(outDate)) {
        return { error: "check_in / check_out must be YYYY-MM-DD" };
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((outDate - inDate) / msPerDay);
    if (nights <= 0) {
        return { error: "check_out must be after check_in" };
    }

    const nightlyUsd = Number(hotel["nightly_usd"]);
    const total = nights * nightlyUsd;
    const bookingId = makeBookingId("BKH");
    const record: Record<string, unknown> = {
        booking_id: bookingId,
        type: "hotel",
        hotel_id: hotelId,
        hotel_name: hotel["name"],
        city: hotel["city"],
        guest_name: guestName,
        check_in: checkIn,
        check_out: checkOut,
        nights,
        nightly_usd: nightlyUsd,
        total_usd: total,
        status: "confirmed",
    };
    BOOKINGS.set(bookingId, record);
    return record;
}

export async function cancel_booking(args: Record<string, unknown>): Promise<string | object> {
    const bookingId = String(args["booking_id"] ?? "").trim().toUpperCase();
    const record = BOOKINGS.get(bookingId);
    if (!record) {
        return { error: `Booking '${bookingId}' not found` };
    }
    if (record.status === "cancelled") {
        return { error: "Already cancelled", booking: record };
    }
    record.status = "cancelled";
    return record;
}

export async function list_bookings(_args: Record<string, unknown>): Promise<string | object> {
    return {
        count: BOOKINGS.size,
        bookings: Array.from(BOOKINGS.values()),
    };
}
