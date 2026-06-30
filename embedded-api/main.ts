/**
 * Example: invoke Orchid directly from a pre-existing Fastify app.
 *
 * The integrator already has a Fastify app with their own routes, auth,
 * and middleware. They want to add an AI chat endpoint without spinning
 * up a separate orchid-api process. The natural pattern in the
 * Node ecosystem is to import the framework library (`@orchid-ai/orchid`)
 * directly and call `client.invoke()` from a custom route.
 *
 * Run with:
 *
 *     cd examples-ts/embedded-api
 *     npm install
 *     npm start
 *
 * Then hit either the existing app routes:
 *
 *     curl http://localhost:8000/products
 *     curl http://localhost:8000/healthz
 *
 * or the AI chat route:
 *
 *     curl -X POST http://localhost:8000/ai/ask \
 *          -H 'Content-Type: application/json' \
 *          -d '{"message": "Recommend a science book."}'
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import Fastify, {type FastifyInstance, type FastifyReply, type FastifyRequest} from 'fastify';

import {Orchid, type OrchidInvokeResult} from '@orchid-ai/orchid';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── Pretend we have our own domain — a product catalog ─────

interface Product {
    sku: string;
    name: string;
    priceUsd: number;
}

const PRODUCTS: Product[] = [
    {sku: 'SKU-001', name: 'Widget', priceUsd: 9.99},
    {sku: 'SKU-002', name: 'Gadget', priceUsd: 19.99},
    {sku: 'SKU-003', name: 'Gizmo', priceUsd: 29.99},
];

interface AskBody {
    message: string;
    chatId?: string;
    userId?: string;
}

// ── Build the existing app + wire Orchid as a long-lived handle ─────

async function buildExistingApp(): Promise<FastifyInstance> {
    const app = Fastify({logger: true});

    // 1. The integrator's own routes — live alongside the AI ones.
    app.get('/healthz', async () => ({status: 'ok'}));
    app.get('/products', async () => PRODUCTS);
    app.get<{Params: {sku: string}}>('/products/:sku', async (req, reply) => {
        const found = PRODUCTS.find((p) => p.sku === req.params.sku.toUpperCase());
        if (!found) return reply.status(404).send({error: 'not found'});
        return found;
    });

    // 2. Build the Orchid handle once at startup; reuse on every request.
    const orchid = await Orchid.fromConfigPath(join(HERE, 'orchid.yml'));
    app.addHook('onClose', async () => {
        await orchid.close();
    });

    // 3. Add the AI route.
    app.post<{Body: AskBody}>('/ai/ask', async (req: FastifyRequest<{Body: AskBody}>, reply: FastifyReply) => {
        const {message, chatId, userId = 'anonymous'} = req.body ?? {};
        if (!message) return reply.status(400).send({error: 'message is required'});

        const result: OrchidInvokeResult = await orchid.invoke({
            messages: [{role: 'user', content: message}],
            chatId,
            userId,
            tenantId: 'demo',
        } as any);

        return {
            response: result.response,
            chatId: result.chatId,
            agentsUsed: result.agentsUsed,
        };
    });

    return app;
}

async function main(): Promise<void> {
    const app = await buildExistingApp();
    const port = Number(process.env.PORT ?? 8000);
    await app.listen({port, host: '0.0.0.0'});
    app.log.info(`Listening on http://0.0.0.0:${port}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
