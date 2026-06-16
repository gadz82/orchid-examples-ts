# Custom Storage — MySQL backend skeleton

Shows how to plug a custom `OrchidChatStorage` backend into the framework.
The Python equivalent lives in `examples/custom-storage/`.

## Files

| File | Role |
|---|---|
| `mysqlStorage.ts` | `MySQLChatStorage` skeleton implementing every `OrchidChatStorage` method |
| `orchid.yml` | Wires the custom backend via `chat_storage_class` |
| `agents.yaml` | Trivial single-agent config (focus is on persistence, not topology) |
| `main.ts` | Smoke-test driver — invokes the agent once to exercise the wiring |

## Wiring

```yaml
# orchid.yml
chat_storage_class: ./dist/mysqlStorage.js#MySQLChatStorage
chat_db_dsn:        mysql://orchid:orchid@localhost:3306/orchid_chats
```

The `<modulePath>#<ExportName>` convention is the TS port equivalent of
Python's dotted-path resolver. `<modulePath>` may be:

- A relative file path resolved from the working directory (e.g. `./dist/mysqlStorage.js`).
- A bare npm specifier resolvable from `node_modules` (e.g. `@myorg/orchid-storage-mysql`).

## Constructor contract

The framework instantiates the class via:

```ts
new MySQLChatStorage({dsn, extraMigrations})
```

- `dsn`: the value of `chat_db_dsn` from `orchid.yml`.
- `extraMigrations` (optional): an array of `{VERSION, DESCRIPTION, up, down}`
  modules supplied programmatically by an integrator. Most consumers won't
  need this — built-in migrations are run by the backend itself.

## Method contract

`OrchidChatStorage` requires these methods:

```ts
initDb(): Promise<void>;
close(): Promise<void>;
createChat(tenantId, userId, title?): Promise<OrchidChatSession>;
listChats(tenantId, userId): Promise<OrchidChatSession[]>;
getChat(chatId): Promise<OrchidChatSession | null>;
deleteChat(chatId): Promise<void>;        // CASCADE deletes messages
updateTitle(chatId, title): Promise<void>;
markShared(chatId): Promise<void>;
addMessage(chatId, role, content, opts?): Promise<OrchidChatMessage>;
getMessages(chatId, opts?): Promise<OrchidChatMessage[]>;
```

`initDb()` is called exactly once by `Orchid.fromConfigPath()` after the
constructor — this is where you open the connection pool and run
migrations.

## Building the example

```bash
cd examples-ts/custom-storage
npm install

# Compile mysqlStorage.ts → dist/mysqlStorage.js
npx tsc -p tsconfig.json

# Smoke test — uses a stub pool inside mysqlStorage.ts so no live MySQL needed:
npm start
```

To point at a real MySQL server:

1. `npm install mysql2`
2. Replace the placeholder `Pool` definition in `mysqlStorage.ts` with `import {createPool, type Pool} from 'mysql2/promise'`.
3. Add the framework migrations (mirror the SQLite/Postgres v001 migration in MySQL syntax) inside `runFrameworkMigrations()`.

## When to use a custom backend vs. `extraMigrations`

If you only need extra tables / indices on top of the default SQLite or
Postgres backend, **don't reimplement** the storage interface. Instead,
pass `extraMigrations` to the built-in backend:

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
