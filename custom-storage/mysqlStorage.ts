/**
 * Custom OrchidChatStorage backend — MySQL skeleton.
 *
 * Wire this into orchid.yml via:
 *
 *   chat_storage_class: ./dist/mysqlStorage.js#MySQLChatStorage
 *   chat_db_dsn: mysql://user:pass@host:3306/orchid_chats
 *
 * The framework constructs the class with `{dsn, extraMigrations?}` and
 * calls `initDb()` exactly once on startup (which should run the migrations
 * for this dialect). All other methods may be invoked concurrently from
 * multiple chat sessions.
 *
 * This file uses placeholder mysql2/promise calls — flesh them out for your
 * deployment. The intent is to show the surface area, not to ship a
 * production-ready driver.
 */

import {randomUUID} from 'node:crypto';

import type {
    AddMessageOptions,
    GetMessagesOptions,
    OrchidChatStorage,
} from '@orchid-ai/orchid';
import type {OrchidChatMessage, OrchidChatSession} from '@orchid-ai/orchid';

// Replace this with: import {createPool, type Pool} from 'mysql2/promise';
// (kept abstract here to avoid forcing the example to install mysql2)
type Pool = {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<[T, unknown]>;
    end(): Promise<void>;
};

interface MigrationModule {
    readonly VERSION: string;
    readonly DESCRIPTION: string;
    up(conn: Pool, opts: { dialect: string }): Promise<void>;
    down(conn: Pool, opts: { dialect: string }): Promise<void>;
}

interface MySQLOpts {
    readonly dsn: string;
    readonly extraMigrations?: MigrationModule[];
}

export class MySQLChatStorage implements OrchidChatStorage {
    private pool: Pool | null = null;
    private readonly dsn: string;
    private readonly extraMigrations: MigrationModule[];

    constructor(opts: MySQLOpts) {
        this.dsn = opts.dsn;
        this.extraMigrations = opts.extraMigrations ?? [];
    }

    async initDb(): Promise<void> {
        // const {createPool} = await import('mysql2/promise');
        // this.pool = createPool(this.dsn);
        // For the skeleton we shim it:
        this.pool = {
            async query() { return [[], null]; },
            async end() { /* no-op */ },
        };

        await this.runFrameworkMigrations();
        await this.runIntegratorMigrations();
    }

    async close(): Promise<void> {
        await this.pool?.end();
        this.pool = null;
    }

    // ── Sessions ──────────────────────────────────────────────

    async createChat(tenantId: string, userId: string, title = 'New chat'): Promise<OrchidChatSession> {
        const id = randomUUID();
        const now = new Date();
        await this.requirePool().query(
            `INSERT INTO chat_sessions (id, tenant_id, user_id, title, created_at, updated_at, is_shared)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [id, tenantId, userId, title, now, now],
        );
        return {id, tenantId, userId, title, createdAt: now, updatedAt: now, isShared: false};
    }

    async listChats(tenantId: string, userId: string): Promise<OrchidChatSession[]> {
        const [rows] = await this.requirePool().query<RowChatSession[]>(
            `SELECT id, tenant_id, user_id, title, created_at, updated_at, is_shared
             FROM chat_sessions WHERE tenant_id = ? AND user_id = ?
             ORDER BY updated_at DESC`,
            [tenantId, userId],
        );
        return rows.map(rowToSession);
    }

    async getChat(chatId: string): Promise<OrchidChatSession | null> {
        const [rows] = await this.requirePool().query<RowChatSession[]>(
            `SELECT id, tenant_id, user_id, title, created_at, updated_at, is_shared
             FROM chat_sessions WHERE id = ?`,
            [chatId],
        );
        return rows[0] ? rowToSession(rows[0]) : null;
    }

    async deleteChat(chatId: string): Promise<void> {
        // ON DELETE CASCADE in the schema removes the messages.
        await this.requirePool().query(`DELETE FROM chat_sessions WHERE id = ?`, [chatId]);
    }

    async updateTitle(chatId: string, title: string): Promise<void> {
        await this.requirePool().query(
            `UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?`,
            [title, new Date(), chatId],
        );
    }

    async markShared(chatId: string): Promise<void> {
        await this.requirePool().query(
            `UPDATE chat_sessions SET is_shared = 1, updated_at = ? WHERE id = ?`,
            [new Date(), chatId],
        );
    }

    // ── Messages ──────────────────────────────────────────────

    async addMessage(
        chatId: string,
        role: 'user' | 'assistant' | 'system',
        content: string,
        opts: AddMessageOptions = {},
    ): Promise<OrchidChatMessage> {
        const id = randomUUID();
        const now = new Date();
        const agentsUsed = opts.agentsUsed ?? [];
        const metadata = opts.metadata ?? {};
        await this.requirePool().query(
            `INSERT INTO chat_messages (id, chat_id, role, content, agents_used, created_at, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, chatId, role, content, JSON.stringify(agentsUsed), now, JSON.stringify(metadata)],
        );
        await this.requirePool().query(
            `UPDATE chat_sessions SET updated_at = ? WHERE id = ?`,
            [now, chatId],
        );
        return {id, chatId, role, content, agentsUsed, createdAt: now, metadata};
    }

    async getMessages(chatId: string, opts: GetMessagesOptions = {}): Promise<OrchidChatMessage[]> {
        const limit = opts.limit ?? 100;
        const offset = opts.offset ?? 0;
        const [rows] = await this.requirePool().query<RowChatMessage[]>(
            `SELECT id, chat_id, role, content, agents_used, created_at, metadata
             FROM chat_messages WHERE chat_id = ?
             ORDER BY created_at ASC LIMIT ? OFFSET ?`,
            [chatId, limit, offset],
        );
        return rows.map(rowToMessage);
    }

    // ── Migrations ───────────────────────────────────────────

    private async runFrameworkMigrations(): Promise<void> {
        // Replace with the real framework migrations for the MySQL dialect.
        // The shipped v001 SQLite/Postgres migration is your reference;
        // mirror its tables (chat_sessions, chat_messages, mcp_oauth_tokens,
        // mcp_client_registrations, mcp_gateway_*) using MySQL syntax.
    }

    private async runIntegratorMigrations(): Promise<void> {
        for (const m of this.extraMigrations) {
            await m.up(this.requirePool(), {dialect: 'mysql'});
        }
    }

    private requirePool(): Pool {
        if (!this.pool) throw new Error('MySQLChatStorage.initDb() must be called before use.');
        return this.pool;
    }
}

// ── Row → model helpers ─────────────────────────────────────

interface RowChatSession {
    id: string;
    tenant_id: string;
    user_id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    is_shared: 0 | 1;
}

interface RowChatMessage {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    agents_used: string;
    created_at: Date;
    metadata: string;
}

function rowToSession(row: RowChatSession): OrchidChatSession {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isShared: !!row.is_shared,
    };
}

function rowToMessage(row: RowChatMessage): OrchidChatMessage {
    return {
        id: row.id,
        chatId: row.chat_id,
        role: row.role,
        content: row.content,
        agentsUsed: JSON.parse(row.agents_used),
        createdAt: row.created_at,
        metadata: JSON.parse(row.metadata),
    };
}
