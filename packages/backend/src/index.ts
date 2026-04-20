import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { Logestic } from "logestic";
import { PostgresItemRepository } from "./adapters/driven/postgresql/repository/item.repository";
import { itemController } from "./adapters/driving/rest/item.controller";
import { env } from "./config/env";
import { ItemServiceImpl } from "./domain/services/item.service";
import { errorHandlerPlugin } from "./plugins/errorHandler.plugin";

// 1. Initialize Adapters (Driven)
const itemRepository = new PostgresItemRepository();

// 2. Initialize Domain Services (Core)
// We inject the repository into the service (Dependency Injection)
const itemService = new ItemServiceImpl(itemRepository);

// 3. Initialize Elysia App (Driving)
const app = new Elysia()
  .use(cors())
  .use(Logestic.preset("fancy"))
  .use(errorHandlerPlugin)

  // Health check
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  // Mount Controllers under /api/v1
  .group("/api/v1", (app) => app.use(itemController(itemService)))
  .listen(env.PORT);

console.log(
  `🦊 Backend is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(`📡 PostgreSQL Adapter: Active`);
console.log(`📂 Item Service: Initialized`);

export type App = typeof app;
