import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../adapters/driven/postgresql/schema";
import { env } from "./env";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });

// Export the sql tag for raw queries if needed
export { client as sql };
