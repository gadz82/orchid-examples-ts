import type { OrchidSignalEmitter, SignalEnvelope } from "@orchid-ai/orchid/core";
import { OrchidEventProducer } from "@orchid-ai/orchid/core";

export interface TenantProvider {
    list(): Promise<string[]>;
}

export interface UserLister {
    active(tenant: string): Promise<string[]>;
}

export interface StaticTenantProviderConfig {
    type: "static";
    tenants: string[];
}

export interface StaticUserListerConfig {
    type: "static";
    usersByTenant: Record<string, string[]>;
}

export interface WeeklyDigestFanoutProducerOptions {
    tenantProvider: TenantProvider | StaticTenantProviderConfig;
    userLister: UserLister | StaticUserListerConfig;
    cron?: string;
    clock?: () => Date;
    emitter: OrchidSignalEmitter;
}

export class WeeklyDigestFanoutProducer extends OrchidEventProducer {
    private _tenantProvider: TenantProvider;
    private _userLister: UserLister;
    private _cron: string;
    private _clock: () => Date;
    private _stopping = false;

    constructor(options: WeeklyDigestFanoutProducerOptions) {
        super(options.emitter);
        this._tenantProvider = this._resolveTenantProvider(options.tenantProvider);
        this._userLister = this._resolveUserLister(options.userLister);
        this._cron = options.cron ?? "0 6 * * 1";
        this._clock = options.clock ?? (() => new Date());
    }

    private _resolveTenantProvider(
        provider: TenantProvider | StaticTenantProviderConfig,
    ): TenantProvider {
        if ("type" in provider && provider.type === "static") {
            return new StaticTenantProvider(provider.tenants);
        }
        return provider;
    }

    private _resolveUserLister(lister: UserLister | StaticUserListerConfig): UserLister {
        if ("type" in lister && lister.type === "static") {
            return new StaticUserLister(lister.usersByTenant);
        }
        return lister;
    }

    async start(): Promise<void> {
        this._stopping = false;
    }

    async stop(): Promise<void> {
        this._stopping = true;
    }

    async fanoutNow(): Promise<number> {
        if (this._stopping) {
            return 0;
        }

        const now = this._clock();
        const week = getISOWeek(now);
        const year = now.getFullYear();
        let emitted = 0;

        const tenants = await this._tenantProvider.list();
        for (const tenant of tenants) {
            const users = await this._userLister.active(tenant);
            for (const userId of users) {
                const envelope: SignalEnvelope = {
                    type: "weekly-digest.due",
                    payload: { week_iso: week, year },
                    source: "fanout:weekly-digest",
                    occurredAt: now,
                    tenantKey: tenant,
                    userId,
                    correlationId: null,
                    dedupeKey: `weekly-digest:${tenant}:${userId}:${week}`,
                    identityClaim: {
                        type: "addressed_to",
                        userId,
                    },
                    chatBinding: null,
                };
                await this.emitter.emit(envelope);
                emitted++;
            }
        }

        return emitted;
    }
}

function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export class StaticTenantProvider implements TenantProvider {
    private _tenants: string[];

    constructor(tenants: string[]) {
        this._tenants = [...tenants];
    }

    async list(): Promise<string[]> {
        return [...this._tenants];
    }
}

export class StaticUserLister implements UserLister {
    private _map: Map<string, string[]>;

    constructor(usersByTenant: Record<string, string[]>) {
        this._map = new Map();
        for (const [tenant, users] of Object.entries(usersByTenant)) {
            this._map.set(tenant, [...users]);
        }
    }

    async active(tenant: string): Promise<string[]> {
        return [...(this._map.get(tenant) ?? [])];
    }
}
