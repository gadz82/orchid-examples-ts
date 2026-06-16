/**
 * Example: keep the full orchid-api REST surface and add custom routes.
 *
 * `buildApp(...)` returns a fully-configured FastifyInstance. The instance
 * is open for extension — register additional routes (or hooks, or plugins)
 * before calling `listen()` and they'll live alongside every built-in
 * orchid-api endpoint.
 *
 * Run with:
 *
 *     cd examples-ts/api-extensions
 *     npm install
 *     ORCHID_CONFIG=./orchid.yml npm start
 *
 * Then hit either an orchid-api endpoint:
 *
 *     curl http://localhost:8000/health
 *     curl http://localhost:8000/chats -H 'Authorization: Bearer dev-token'
 *
 * or one of your custom endpoints:
 *
 *     curl http://localhost:8000/custom/ping
 *     curl http://localhost:8000/custom/orders/42
 */

import {buildApp, getSettings} from '@orchid-ai/orchid-api';

async function main(): Promise<void> {
    const settings = getSettings();
    const app = await buildApp({settings});

    // ── 1. A simple custom route ──────────────────────────────
    app.get('/custom/ping', async () => ({pong: true, ts: new Date().toISOString()}));

    // ── 2. A custom route group with a small "domain" ─────────
    interface Order {
        readonly id: number;
        readonly customer: string;
        readonly total: number;
    }

    const ORDERS: Order[] = [
        {id: 41, customer: 'Alice', total: 19.99},
        {id: 42, customer: 'Bob', total: 49.5},
        {id: 43, customer: 'Carol', total: 7.5},
    ];

    app.get('/custom/orders', async () => ORDERS);

    app.get<{Params: {id: string}}>('/custom/orders/:id', async (req, reply) => {
        const id = Number(req.params.id);
        const order = ORDERS.find((o) => o.id === id);
        if (!order) return reply.status(404).send({error: 'order not found'});
        return order;
    });

    // ── 3. A custom hook — runs for every request, including built-in
    //      orchid-api routes. Use sparingly; orchid-api already logs.
    app.addHook('onRequest', async (req) => {
        req.log.info({path: req.url}, 'request received');
    });

    // ── Listen ──────────────────────────────────────────────
    const port = Number(process.env.PORT ?? settings.port);
    const host = process.env.HOST ?? settings.host;
    await app.listen({port, host});
    app.log.info(`orchid-api + custom routes listening on http://${host}:${port}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
