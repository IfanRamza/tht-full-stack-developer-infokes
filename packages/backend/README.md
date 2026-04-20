# @explorer/backend

High-performance REST API for the File Explorer application, built with [ElysiaJS](https://elysiajs.com/) on the Bun runtime, following a strict **Hexagonal Architecture (Ports and Adapters)** pattern.

---

## Tech Stack

| Tool | Role |
|---|---|
| **Bun** | Runtime & package manager |
| **ElysiaJS** | HTTP framework with TypeBox schema validation |
| **Drizzle ORM** | Type-safe SQL query builder |
| **PostgreSQL** | Primary data store |
| **uuidv7** | Time-ordered UUID generation for all primary keys |
| **bun:test** | Test runner (Unit + Integration) |

---

## Hexagonal Architecture

The codebase enforces strict separation through **Ports and Adapters**, ensuring the business domain never touches any framework or database concern directly.

```
HTTP Request
    │
    ▼
┌─────────────────────────────────┐
│  Driving Adapter (REST)         │  ← ElysiaJS routes + TypeBox validation
│  adapters/driving/rest/         │     Translates HTTP → Domain calls
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Domain Service Port            │  ← ItemService interface
│  domain/ports/item-service.port │     Contract the controller depends on
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Domain Service (Core Logic)    │  ← ItemServiceImpl
│  domain/services/item.service   │     Pure business logic, DB-agnostic
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Repository Port                │  ← ItemRepository interface
│  domain/ports/item-repository   │     Contract the service depends on
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Driven Adapter (PostgreSQL)    │  ← PostgresItemRepository
│  adapters/driven/postgresql/    │     Drizzle ORM SQL implementation
└─────────────────────────────────┘
```

### Why Ports?
The `ItemService` only knows about `ItemRepository` (an interface), never `PostgresItemRepository` (the concrete class). Swapping PostgreSQL for another database means writing one new Adapter — zero changes to business logic.

---

## Source Structure

```
src/
├── adapters/
│   ├── driven/
│   │   └── postgresql/
│   │       ├── repository/
│   │       │   ├── item.repository.ts       # Drizzle ORM implementation
│   │       │   └── item.repository.test.ts  # Integration tests (real DB)
│   │       ├── schema.ts                    # Drizzle table schema
│   │       ├── migrate.ts                   # Migration runner
│   │       ├── flush.ts                     # Data wipe utility
│   │       └── seed.ts                      # Seed generator (~400 items)
│   └── driving/
│       └── rest/
│           ├── item.controller.ts           # Elysia route definitions
│           └── item.controller.test.ts      # Route integration tests
├── config/
│   ├── database.ts                          # Drizzle connection
│   └── env.ts                               # Zod env validation
├── domain/
│   ├── errors/
│   │   └── domain.error.ts                  # NotFoundError, ValidationError, ConflictError
│   ├── models/
│   │   └── item.model.ts                    # Item, FolderContent, ItemTree types
│   ├── ports/
│   │   ├── item-repository.port.ts          # Repository interface
│   │   └── item-service.port.ts             # Service interface
│   └── services/
│       ├── item.service.ts                  # Core business logic
│       └── item.service.test.ts             # Unit tests (mocked repository)
├── plugins/
│   └── errorHandler.plugin.ts               # Global Elysia error handler
├── utils/
│   └── response.ts                          # Consistent API response wrapper
└── index.ts                                 # App bootstrap + DI wiring
```

---

## API Endpoints

Base path: `/api/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/items/tree` | Full recursive folder tree (sidebar data) |
| `GET` | `/items/contents` | Root-level paginated contents |
| `GET` | `/items/:id/contents` | Paginated children of a folder by UUID |
| `GET` | `/items/by-path?path=Documents/Work` | Paginated children resolved by path string |
| `GET` | `/items/search?q=query&path=optional` | Name search, optionally scoped to a path |
| `POST` | `/items` | Create a new file or folder |

### Pagination

`/contents` and `/by-path` accept `?limit=50&offset=0`. The response always includes `totalElements` so the client can determine whether more pages exist:

```jsonc
{
  "success": true,
  "data": {
    "folder": { "id": "...", "name": "Documents", "type": "folder", ... },
    "children": [ /* up to `limit` items, folders always first */ ],
    "totalElements": 76
  }
}
```

### Ordering

All content queries use a deterministic SQL `CASE` expression to guarantee folders appear before files regardless of PostgreSQL collation:

```sql
ORDER BY CASE WHEN type = 'folder' THEN 0 ELSE 1 END ASC, sort_order, name
```

---

## Getting Started

### 1. Configure Environment

From the repo root, copy `.env.example` to `.env`. The defaults work with Docker Compose:

```env
DATABASE_URL=postgres://admin:password@localhost:5432/explorer
PORT=3000
```

### 2. Start the Database

```bash
# from repo root
docker compose up -d
```

### 3. Run Migrations & Seed

```bash
bun run db:migrate   # apply schema migrations
bun run db:seed      # populate with ~400 realistic items
```

### 4. Start the Dev Server

```bash
bun run dev          # starts on http://localhost:3000 with --watch
```

---

## Database Scripts

| Script | Description |
|---|---|
| `bun run db:generate` | Generate Drizzle migration files from schema changes |
| `bun run db:migrate` | Apply pending migrations to the database |
| `bun run db:flush` | Delete all rows (keeps schema intact) |
| `bun run db:seed` | Insert realistic test data (~400 items) |
| `bun run db:reset` | `migrate` → `flush` → `seed` in one command |

---

## Testing

```bash
bun run test
```

Tests are co-located next to the files they cover (`.test.ts` suffix).

### Unit Tests — `item.service.test.ts`

Tests pure domain logic with a fully mocked `ItemRepository`. No database required.

| Test | What it verifies |
|---|---|
| Invalid characters in name | `ValidationError` is thrown before any DB call |
| Valid name creation | Mock repository is called with correct arguments |
| Tree computation | Flat folder array is correctly nested into a recursive tree |
| Path resolution (valid) | Multi-segment paths correctly walk through parent folders |
| Path resolution (file as segment) | Error thrown when a path segment resolves to a file |

### Integration Tests — `item.repository.test.ts`

Tests the actual Drizzle ORM queries against a real PostgreSQL connection. Each run creates isolated test data and cleans up via `afterAll`.

| Test | What it verifies |
|---|---|
| Create root folder | `create()` returns a valid entity with generated ID |
| Pagination slicing | `findChildrenByParentId(id, 3, 0)` returns 3 of 5 items + correct `total` |
| Folder-first ordering | SQL CASE guarantee: folders at indices 0–1, files at 2–4 |
| Delete cascade | `findById` returns `null` after `delete()` |

### Route Tests — `item.controller.test.ts`

Boots a real Elysia app instance in-memory (no HTTP port needed) and fires `Request` objects directly.

| Test | What it verifies |
|---|---|
| Missing POST body fields | Returns `422` and never calls the service |
| `?limit=15&offset=25` | Service receives integers `15` and `25` (not strings) |
| No query params | Service receives `undefined` for both (defaults apply in service layer) |
