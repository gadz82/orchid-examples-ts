# Custom Storage — MySQL backend skeleton

Demonstrates how to plug an alternative chat persistence backend into Orchid by subclassing `OrchidChatStorage`. Ships a MySQL skeleton implementation suitable for custom deployments.

## What it does

Replaces the built-in SQLite/Postgres chat storage with a custom MySQL implementation. The example includes a full `MySQLChatStorage` skeleton implementing every method of the `OrchidChatStorage` ABC, wired via `<modulePath>#<ExportName>` in `orchid.yml`.

## What it uses

| Feature | Usage |
|---------|-------|
| `OrchidChatStorage` ABC | 10+ methods: `initDb`, `createChat`, `addMessage`, `getMessages`, etc. |
| `<modulePath>#<ExportName>` | Dynamic class resolution from YAML |
| `initDb()` | Connection pool + migrations (called once at startup) |
| `extraMigrations` | Integrator-supplied migration modules |
| Migration runner | `runFrameworkMigrations()` + `runIntegratorMigrations()` |
| Singleton `Orchid` handle | One storage instance per process |

## What you'll learn

- The full `OrchidChatStorage` ABC contract — every abstract method and how it's invoked by the framework.
- How `<modulePath>#<ExportName>` resolves the `chat_storage_class` YAML field to a concrete class.
- Two contract requirements integrators frequently miss:
  - `initDb()` runs once at startup and is the right place for connection pools and migrations. Don't put I/O in the constructor.
  - Both the constructor `{dsn, extraMigrations?}` params are mandatory (even when extraMigrations is empty) — the factory passes them unconditionally.
- How framework migrations are run via `runFrameworkMigrations()` and integrator migrations via `runIntegratorMigrations()`.

## Files

| File | Role |
|------|------|
| `orchid.yml` | Wires `chat_storage_class` to `./dist/mysqlStorage.js#MySQLChatStorage` |
| `agents.yaml` | Trivial single-agent config (focus is on persistence, not topology) |
| `mysqlStorage.ts` | `MySQLChatStorage` skeleton implementing every `OrchidChatStorage` method |
| `main.ts` | Smoke-test driver — invokes the agent once to exercise the wiring |

## Example prompts

The storage backend is transparent to end users — agent interactions work identically regardless of backend:

```
Smoke test (main.ts): "Just verifying the storage wiring — say hi."
                      → echo agent: message persisted via MySQLChatStorage

Real usage:           "Hello, can you remember this conversation?"
                      → messages stored in MySQL via addMessage()
                      → subsequent invocations load history via getMessages()

Persistence check:   Query MySQL directly:
                     SELECT * FROM chat_sessions;
                     SELECT * FROM chat_messages;
```

## Wiring

```yaml
# orchid.yml
chat_storage_class: ./dist/mysqlStorage.js#MySQLChatStorage
chat_db_dsn: mysql://orchid:orchid@localhost:3306/orchid_chats
```

The `<modulePath>#<ExportName>` convention is the TS port equivalent of Python's dotted-path resolver. `<modulePath>` may be:

- A relative file path resolved from the working directory (e.g. `./dist/mysqlStorage.js`).
- A bare npm specifier resolvable from `node_modules` (e.g. `@myorg/orchid-storage-mysql`).

## Constructor contract

The framework instantiates the class via:

```ts
new MySQLChatStorage({dsn, extraMigrations})
```

- `dsn`: the value of `chat_db_dsn` from `orchid.yml`.
- `extraMigrations` (optional): an array of `{VERSION, DESCRIPTION, up, down}` modules supplied programmatically by an integrator.

## Method contract

`OrchidChatStorage` requires these methods:

```ts
initDb(): Promise<void>;           // connection pool + migrations
close(): Promise<void>;            // release handles
createChat(tenantId, userId, title?): Promise<OrchidChatSession>;
listChats(tenantId, userId): Promise<OrchidChatSession[]>;
getChat(chatId): Promise<OrchidChatSession | null>;
deleteChat(chatId): Promise<void>; // CASCADE deletes messages
updateTitle(chatId, title): Promise<void>;
markShared(chatId): Promise<void>;
addMessage(chatId, role, content, opts?): Promise<OrchidChatMessage>;
getMessages(chatId, opts?): Promise<OrchidChatMessage[]>;
```

`initDb()` is called exactly once by `Orchid.fromConfigPath()` after the constructor — this is where you open the connection pool and run migrations.

## Backend behaviour

`MySQLChatStorage` uses a MySQL connection pool created from the DSN. The skeleton in `mysqlStorage.ts` uses a no-op placeholder pool so the example compiles and runs without a live MySQL server.

Concurrency: the pool serialises queries within a single process. Cross-process safety depends on MySQL's transaction isolation — use `READ COMMITTED` and retry on deadlock.

Atomicity: MySQL DDL transactions are supported; migration steps wrap each version in a transaction so partial failures roll back cleanly.

## Building and running

```bash
cd examples-ts/custom-storage
npm install

# Compile mysqlStorage.ts → dist/mysqlStorage.js
npx tsc -p tsconfig.json

# Smoke test — uses the stub pool, no live MySQL needed:
npm start
```

To point at a real MySQL server:

1. `npm install mysql2`
2. Replace the placeholder `Pool` definition in `mysqlStorage.ts` with `import {createPool, type Pool} from 'mysql2/promise'`.
3. Replace `runFrameworkMigrations()` with the real framework migrations translated to MySQL dialect.

## Adapting the backend

Common variants and how to implement them:

| Backend | Key changes |
|---------|-------------|
| SQLite | Already built in — `chat_storage_class: sqlite` in `orchid.yml`. Study `OrchidSQLiteChatStorage` as the reference. |
| PostgreSQL | Built in — `chat_storage_class: postgres`. Install `@orchid-ai/storage-postgres`. |
| Redis | Use `ioredis`; map sessions to a hash keyed by chatId, messages to a list per chatId. `initDb()` ensures indexes exist. |
| MongoDB | Use `mongoose`; one collection per session/message. `extraMigrations` typically not relevant — schemaless. |
| In-memory (tests) | Skip I/O and keep two `Map`s on the instance. Acceptable for unit tests; not production storage. |

For SQL-backed implementations, study `OrchidSQLiteChatStorage` in `@orchid-ai/orchid/persistence` for the canonical migration pattern via `OrchidMigrationRunner`.

## When to use a custom backend vs. `extraMigrations`

If you only need extra tables / indices on top of the default SQLite or Postgres backend, **don't reimplement** the storage interface. Instead, pass `extraMigrations` to the built-in backend:

```ts
import {OrchidSQLiteChatStorage} from '@orchid-ai/orchid';
import * as v001Custom from './my-migrations/v001-custom.js';

const storage = new OrchidSQLiteChatStorage({
    dsn: '~/.orchid/chats.db',
    extraMigrations: [v001Custom],
});
```

A full custom backend is justified when:

- You need a different DB engine (MySQL, MSSQL, DynamoDB, …).
- You have schema requirements that can't be expressed as additive migrations.
- You need to integrate with an existing chat repository service over RPC.

## Contract checklist

When implementing your own `OrchidChatStorage`, verify each of the following before declaring "done":

- [ ] Constructor accepts `{dsn, extraMigrations?}`.
- [ ] `initDb()` is idempotent — running it twice is a no-op.
- [ ] `close()` releases pools/handles even when `initDb()` was never called.
- [ ] `createChat()` returns a fresh UUID-keyed `OrchidChatSession`.
- [ ] `addMessage()` touches the parent session's `updatedAt`.
- [ ] `listChats()` is sorted by `updatedAt` descending.
- [ ] `getMessages()` is sorted by `createdAt` ascending and respects `limit` + `offset`.
- [ ] `deleteChat()` cascades to that chat's messages.
- [ ] Concurrent `addMessage()` calls within one process don't interleave (use a DB transaction or an in-process lock).
