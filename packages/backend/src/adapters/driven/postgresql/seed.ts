import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import { items } from "./schema";

type NewItem = typeof items.$inferInsert;

// Custom dictionaries for random generation
const extensions = [
  { ext: '.pdf', mime: 'application/pdf' },
  { ext: '.txt', mime: 'text/plain' },
  { ext: '.md', mime: 'text/markdown' },
  { ext: '.jpg', mime: 'image/jpeg' },
  { ext: '.png', mime: 'image/png' },
  { ext: '.svg', mime: 'image/svg+xml' },
  { ext: '.tsx', mime: 'text/tsx' },
  { ext: '.ts', mime: 'application/typescript' },
  { ext: '.go', mime: 'text/x-go' },
  { ext: '.json', mime: 'application/json' },
  { ext: '.yaml', mime: 'text/yaml' },
  { ext: '.mp4', mime: 'video/mp4' },
  { ext: '.csv', mime: 'text/csv' }
];

const words = ['Config', 'API', 'Docker', 'Index', 'Main', 'Styles', 'Assets', 'Utils', 'Helper', 'Database', 'Schema', 'Router', 'Controller', 'Service', 'Component', 'Header', 'Footer', 'Layout', 'Constants', 'Types', 'Client', 'Server', 'Auth', 'Core', 'Shared', 'Test', 'Mock', 'Data'];

/**
 * Generator to create massive arrays of random files and folders
 */
function generateRandomItems(parentId: string, parentPath: string, parentDepth: number, count: number): NewItem[] {
  const generatedItems: NewItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const isFolder = Math.random() > 0.8; // 20% chance to be a folder vs file
    const id = uuidv7();
    const path = `${parentPath}/${id}`;
    const depth = parentDepth + 1;
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    
    if (isFolder) {
      const folderName = `${w1}_${w2}_${num}`;
      generatedItems.push({
         id,
         name: folderName,
         type: "folder",
         parentId,
         path,
         depth,
         sortOrder: i,
      });
    } else {
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      const fileName = `${w1}_${w2}_${num}${ext.ext}`.toLowerCase();
      generatedItems.push({
         id,
         name: fileName,
         type: "file",
         parentId,
         path,
         depth,
         size: Math.floor(Math.random() * (1024 * 1024 * 25)) + 1024, // 1KB to 25MB
         mimeType: ext.mime,
         sortOrder: i,
      });
    }
  }
  return generatedItems;
}

// Bulk insert helper to avoid hitting Drizzle max parameter limits on large arrays
async function chunkedInsert(db: any, table: typeof items, data: NewItem[], chunkSize: number = 50) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);
  }
}

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("🌱 Seeding database with complex generated data...");

  try {
    await db.delete(items);

    // ─── Level 0: Root folders ───────────────────────────────────────────────
    const rootIds = {
      documents: uuidv7(),
      pictures: uuidv7(),
      downloads: uuidv7(),
      music: uuidv7(),
      videos: uuidv7(),
      archive: uuidv7(), // New mega folder
    };

    const coreRoots: NewItem[] = [
      { id: rootIds.documents, name: "Documents", type: "folder", parentId: null, path: `/${rootIds.documents}`, depth: 0, sortOrder: 0 },
      { id: rootIds.pictures, name: "Pictures", type: "folder", parentId: null, path: `/${rootIds.pictures}`, depth: 0, sortOrder: 1 },
      { id: rootIds.downloads, name: "Downloads", type: "folder", parentId: null, path: `/${rootIds.downloads}`, depth: 0, sortOrder: 2 },
      { id: rootIds.music, name: "Music", type: "folder", parentId: null, path: `/${rootIds.music}`, depth: 0, sortOrder: 3 },
      { id: rootIds.videos, name: "Videos", type: "folder", parentId: null, path: `/${rootIds.videos}`, depth: 0, sortOrder: 4 },
      { id: rootIds.archive, name: "Deep Archive", type: "folder", parentId: null, path: `/${rootIds.archive}`, depth: 0, sortOrder: 5 },
    ];
    await chunkedInsert(db, items, coreRoots);

    // ─── Level 1: Sub-folders under Documents ────────────────────────────────
    const docIds = { work: uuidv7(), personal: uuidv7() };
    const docPath = `/${rootIds.documents}`;
    const docFiles: NewItem[] = [
      { id: docIds.work, name: "Work", type: "folder", parentId: rootIds.documents, path: `${docPath}/${docIds.work}`, depth: 1, sortOrder: 0 },
      { id: docIds.personal, name: "Personal", type: "folder", parentId: rootIds.documents, path: `${docPath}/${docIds.personal}`, depth: 1, sortOrder: 1 },
      { id: uuidv7(), name: "README.md", type: "file", parentId: rootIds.documents, path: `${docPath}/${uuidv7()}`, depth: 1, size: 2048, mimeType: "text/markdown", sortOrder: 2 },
      { id: uuidv7(), name: "budget-2024.xlsx", type: "file", parentId: rootIds.documents, path: `${docPath}/${uuidv7()}`, depth: 1, size: 68000, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sortOrder: 3 },
    ];
    await chunkedInsert(db, items, docFiles);

    // ─── MASSIVE GENERATION #1: Deep Archive (100 items) ─────────────────────
    console.log("   -> Generating 100 items inside 'Deep Archive'...");
    const massiveArchiveItems = generateRandomItems(
      rootIds.archive,
      `/${rootIds.archive}`,
      0,
      100
    );
    await chunkedInsert(db, items, massiveArchiveItems);

    // ─── Level 2 & MASSIVE GENERATION #2: Inside Work -> Projects ────────────
    const workPath = `${docPath}/${docIds.work}`;
    
    // Create Engineering Folders
    const engFolderId = uuidv7();
    const engPath = `${workPath}/${engFolderId}`;
    const frontendFolderId = uuidv7();
    const backendFolderId = uuidv7();
    
    await db.insert(items).values([
      { id: engFolderId, name: "Engineering", type: "folder", parentId: docIds.work, path: engPath, depth: 2, sortOrder: 0 },
      { id: frontendFolderId, name: "Frontend_Vue", type: "folder", parentId: engFolderId, path: `${engPath}/${frontendFolderId}`, depth: 3, sortOrder: 0 },
      { id: backendFolderId, name: "Backend_Go", type: "folder", parentId: engFolderId, path: `${engPath}/${backendFolderId}`, depth: 3, sortOrder: 1 },
    ]);
    
    console.log("   -> Generating 150 items inside 'Engineering' sub-trees...");
    const frontendAssets = generateRandomItems(frontendFolderId, `${engPath}/${frontendFolderId}`, 3, 75);
    const backendAssets = generateRandomItems(backendFolderId, `${engPath}/${backendFolderId}`, 3, 75);
    await chunkedInsert(db, items, [...frontendAssets, ...backendAssets]);
    
    console.log("   -> Generating 75 items inside 'Documents/Work'...");
    const projectAssets = generateRandomItems(docIds.work, workPath, 1, 75);
    await chunkedInsert(db, items, projectAssets);

    // ─── MASSIVE GENERATION #3: Inside Downloads ──────────────────────────────
    console.log("   -> Generating 60 items inside 'Downloads'...");
    const downloadDump = generateRandomItems(rootIds.downloads, `/${rootIds.downloads}`, 0, 60);
    await chunkedInsert(db, items, downloadDump);

    console.log(`✅ Seeding complete — Inserted ~240 highly varied items across the tree.`);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
