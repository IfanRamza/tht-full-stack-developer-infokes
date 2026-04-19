import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  console.log("⏳ Running migrations...");

  // Disable prefetch as it is not supported for "pgbouncer" or similar proxies
  // but for standard local dev it's just fine.
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../../../../drizzle"),
    });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
