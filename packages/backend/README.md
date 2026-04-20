# @explorer/backend

The backend package for the Windows Explorer-like File Manager. This is a high-performance REST API built with [ElysiaJS](https://elysiajs.com/), following a strict **Hexagonal Architecture (Ports and Adapters)** pattern.

---

## Tech Stack
- **ElysiaJS** (Bun-native, crazy fast web framework)
- **TypeScript**
- **Drizzle ORM** (Type-safe SQL toolkit)
- **PostgreSQL** (via `postgres.js` adapter)

---

## Hexagonal Architecture Design

We use a port-and-adapters architecture to enforce clean boundaries between our business logic and database/framework tooling.

### 🔌 Ports vs. PostgreSQL Repository

A frequent question is: *Why do we have a generic Repository Port when we have a PostgreSQL Repository?*

**1. The Port (`domain/ports/item-repository.port.ts`)**
- A **Port** is a strict TypeScript Interface. It belongs to the isolated Domain layer.
- It purely defines an abstract contract of *what* the application needs (e.g., `findById`, `createItem`), completely independent of the actual SQL database.
- *Advantage:* The core business logic (`item.service.ts`) relies *only* on this interface. The Service doesn't know what Postgres or Drizzle is. 

**2. The PostgreSQL Adapter (`adapters/driven/postgresql/repository/items.repository.ts`)**
- An **Adapter** is the physical database implementation of the port.
- It contains the concrete Drizzle ORM SQL queries required to fulfill the `ItemRepository` port contract.
- *Advantage:* If we ever migrate from Postgres to MySQL, or swap Drizzle for Prisma, we simply write a new Adapter class. The `item.service.ts` (business core) survives completely untouched. This is the ultimate "separation of concerns."

---

## Getting Started

### Environment Variables
Ensure the root `.env` contains:
```env
# Change User/Password/DB based on your Postgres setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/explorer_db
PORT=3000
```

### Installation
```bash
bun install
```

### Database Scripts
```bash
# Push Drizzle schema to the Postgres database
bun run db:push

# Wipe and Auto-generate a massive, complex folder/file tree
bun run db:seed
```

### Starting the Server
```bash
bun dev
```

The server runs on `http://localhost:3000` and serves the frontend over `api/v1`.
