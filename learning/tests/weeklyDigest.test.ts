import { describe, it, expect, beforeEach } from "vitest";
import type { SignalEnvelope, SignalIngestResult } from "@orchid-ai/orchid/core";
import { OrchidSignalEmitter } from "@orchid-ai/orchid/core";
import {
    WeeklyDigestFanoutProducer,
    StaticTenantProvider,
    StaticUserLister,
} from "../producers/weeklyDigest.js";

class MockSignalEmitter extends OrchidSignalEmitter {
    public emitted: SignalEnvelope[] = [];

    async emit(envelope: SignalEnvelope): Promise<SignalIngestResult> {
        this.emitted.push(envelope);
        return {
            signalId: `sig-${this.emitted.length}`,
            queueMsgId: `msg-${this.emitted.length}`,
            deduplicated: false,
        };
    }
}

describe("WeeklyDigestFanoutProducer", () => {
    let emitter: MockSignalEmitter;

    beforeEach(() => {
        emitter = new MockSignalEmitter();
    });

    it("emits one signal per active user per tenant", async () => {
        const producer = new WeeklyDigestFanoutProducer({
            tenantProvider: new StaticTenantProvider(["learning-demo"]),
            userLister: new StaticUserLister({
                "learning-demo": ["u-alice", "u-bob"],
            }),
            clock: () => new Date("2026-05-04T06:00:00Z"),
            emitter,
        });

        await producer.start();
        const emitted = await producer.fanoutNow();
        await producer.stop();

        expect(emitted).toBe(2);
        expect(emitter.emitted).toHaveLength(2);

        const userIds = emitter.emitted.map((e) => e.userId).sort();
        expect(userIds).toEqual(["u-alice", "u-bob"]);

        for (const env of emitter.emitted) {
            expect(env.type).toBe("weekly-digest.due");
            expect(env.tenantKey).toBe("learning-demo");
            expect(env.source).toBe("fanout:weekly-digest");
            expect(env.dedupeKey).toMatch(/^weekly-digest:learning-demo:u-(alice|bob):/);
            expect(env.identityClaim).toEqual({
                type: "addressed_to",
                userId: env.userId,
            });
        }
    });

    it("emits signals for multiple tenants", async () => {
        const producer = new WeeklyDigestFanoutProducer({
            tenantProvider: new StaticTenantProvider(["tenant-a", "tenant-b"]),
            userLister: new StaticUserLister({
                "tenant-a": ["user-1"],
                "tenant-b": ["user-2", "user-3"],
            }),
            clock: () => new Date("2026-05-04T06:00:00Z"),
            emitter,
        });

        await producer.start();
        const emitted = await producer.fanoutNow();
        await producer.stop();

        expect(emitted).toBe(3);
        expect(emitter.emitted).toHaveLength(3);

        const tenantUserPairs = emitter.emitted.map((e) => `${e.tenantKey}:${e.userId}`).sort();
        expect(tenantUserPairs).toEqual(["tenant-a:user-1", "tenant-b:user-2", "tenant-b:user-3"]);
    });

    it("returns 0 when stopped", async () => {
        const producer = new WeeklyDigestFanoutProducer({
            tenantProvider: new StaticTenantProvider(["tenant-a"]),
            userLister: new StaticUserLister({ "tenant-a": ["user-1"] }),
            emitter,
        });

        await producer.start();
        await producer.stop();
        const emitted = await producer.fanoutNow();

        expect(emitted).toBe(0);
        expect(emitter.emitted).toHaveLength(0);
    });

    it("uses custom clock for week calculation", async () => {
        const fixedDate = new Date("2026-01-05T06:00:00Z");
        const producer = new WeeklyDigestFanoutProducer({
            tenantProvider: new StaticTenantProvider(["tenant-a"]),
            userLister: new StaticUserLister({ "tenant-a": ["user-1"] }),
            clock: () => fixedDate,
            emitter,
        });

        await producer.start();
        await producer.fanoutNow();
        await producer.stop();

        expect(emitter.emitted).toHaveLength(1);
        expect(emitter.emitted[0]!.payload.week_iso).toBe(2);
        expect(emitter.emitted[0]!.payload.year).toBe(2026);
    });

    it("generates unique dedupe keys per user per week", async () => {
        const producer = new WeeklyDigestFanoutProducer({
            tenantProvider: new StaticTenantProvider(["tenant-a"]),
            userLister: new StaticUserLister({ "tenant-a": ["user-1", "user-2"] }),
            clock: () => new Date("2026-05-04T06:00:00Z"),
            emitter,
        });

        await producer.start();
        await producer.fanoutNow();
        await producer.stop();

        const dedupeKeys = emitter.emitted.map((e) => e.dedupeKey);
        const uniqueKeys = new Set(dedupeKeys);
        expect(uniqueKeys.size).toBe(2);
    });
});

describe("StaticTenantProvider", () => {
    it("returns the configured tenants", async () => {
        const provider = new StaticTenantProvider(["a", "b", "c"]);
        const tenants = await provider.list();
        expect(tenants).toEqual(["a", "b", "c"]);
    });

    it("returns a copy (not a reference)", async () => {
        const provider = new StaticTenantProvider(["a"]);
        const first = await provider.list();
        first.push("mutated");
        const second = await provider.list();
        expect(second).toEqual(["a"]);
    });
});

describe("StaticUserLister", () => {
    it("returns users for a known tenant", async () => {
        const lister = new StaticUserLister({
            "tenant-a": ["user-1", "user-2"],
            "tenant-b": ["user-3"],
        });
        const users = await lister.active("tenant-a");
        expect(users).toEqual(["user-1", "user-2"]);
    });

    it("returns empty array for unknown tenant", async () => {
        const lister = new StaticUserLister({ "tenant-a": ["user-1"] });
        const users = await lister.active("unknown-tenant");
        expect(users).toEqual([]);
    });

    it("returns a copy (not a reference)", async () => {
        const lister = new StaticUserLister({ "tenant-a": ["user-1"] });
        const first = await lister.active("tenant-a");
        first.push("mutated");
        const second = await lister.active("tenant-a");
        expect(second).toEqual(["user-1"]);
    });
});
