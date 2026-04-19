import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { items, itemTypeEnum } from "./schema";
import { uuidv7 } from "uuidv7";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("🌱 Seeding database...");

  try {
    // 1. Clear existing data
    await db.delete(items);

    // 2. Define Root Folders
    const rootFolders = [
      { id: uuidv7(), name: "Documents", type: "folder" as const },
      { id: uuidv7(), name: "Pictures", type: "folder" as const },
      { id: uuidv7(), name: "Downloads", type: "folder" as const },
      { id: uuidv7(), name: "Music", type: "folder" as const },
    ];

    for (const folder of rootFolders) {
      console.log(`  Creating root: ${folder.name}`);
      await db.insert(items).values({
        id: folder.id,
        name: folder.name,
        type: folder.type,
        parentId: null,
        path: `/${folder.id}`,
        depth: 0,
      });
    }

    // 3. Define Sub-folders (inside Documents)
    const docsId = rootFolders[0].id; // Documents
    const subFolders = [
      { id: uuidv7(), name: "Work", parentId: docsId, path: `/${docsId}` },
      { id: uuidv7(), name: "Personal", parentId: docsId, path: `/${docsId}` },
    ];

    for (const sub of subFolders) {
      const fullPath = `${sub.path}/${sub.id}`;
      console.log(`    Creating sub-folder: ${sub.name}`);
      await db.insert(items).values({
        id: sub.id,
        name: sub.name,
        type: "folder",
        parentId: sub.parentId,
        path: fullPath,
        depth: 1,
      });
    }

    // 4. Create a File (inside Work)
    const workId = subFolders[0].id;
    const workPath = `/${docsId}/${workId}`;
    const fileId = uuidv7();
    
    console.log(`      Creating file: proposal.pdf`);
    await db.insert(items).values({
      id: fileId,
      name: "proposal.pdf",
      type: "file",
      parentId: workId,
      path: `${workPath}/${fileId}`,
      depth: 2,
      size: 1024 * 450, // 450 KB
      mimeType: "application/pdf",
    });

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
  } finally {
    await sql.end();
  }
}

seed();
