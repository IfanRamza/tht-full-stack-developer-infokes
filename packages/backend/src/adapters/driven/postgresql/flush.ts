import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { items } from "./schema";

async function flush() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("🧹 Flushing all items from database...");

  try {
    await db.delete(items);
    console.log("✅ Database flushed successfully.");
  } catch (error) {
    console.error("❌ Flush failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

flush();
