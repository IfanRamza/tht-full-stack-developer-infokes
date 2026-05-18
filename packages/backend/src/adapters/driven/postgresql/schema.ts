import {
  AnyPgColumn,
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const itemTypeEnum = pgEnum("item_type", ["folder", "file"]);

export const items = pgTable(
  "items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 255 }).notNull(),
    type: itemTypeEnum("type").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => items.id, {
      onDelete: "cascade",
    }),
    path: text("path").notNull(),
    depth: integer("depth").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    size: bigint("size", { mode: "number" }).default(0),
    mimeType: varchar("mime_type", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_items_parent_id").on(table.parentId),
    index("idx_items_type").on(table.type),
    index("idx_items_path").on(table.path),
    // Composite index: makes every hop in path resolution (findByNameAndParentId) an index scan
    index("idx_items_parent_name").on(table.parentId, table.name),
    // Unique constraint: DB-level guard against duplicate names in the same folder
    // Prevents TOCTOU race where two concurrent POSTs could both pass the app-level check
    uniqueIndex("uq_items_name_parent").on(table.name, table.parentId),
  ],
);
