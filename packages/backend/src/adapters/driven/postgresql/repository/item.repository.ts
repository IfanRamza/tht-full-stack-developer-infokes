import { and, asc, count, eq, ilike, isNull, like, sql } from "drizzle-orm";
import { db } from "../../../../config/database";
import { Item } from "../../../../domain/models/item.model";
import { ItemRepository } from "../../../../domain/ports/item-repository.port";
import { ConflictError } from "../../../../domain/errors/domain.error";
import { items as itemsTable } from "../schema";

export class PostgresItemRepository implements ItemRepository {
  private mapToEntity(row: typeof itemsTable.$inferSelect): Item {
    return {
      id: row.id,
      name: row.name,
      type: row.type as "folder" | "file",
      parentId: row.parentId,
      path: row.path,
      depth: row.depth,
      sortOrder: row.sortOrder,
      size: row.size || 0,
      mimeType: row.mimeType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string): Promise<Item | null> {
    const [row] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, id))
      .limit(1);

    return row ? this.mapToEntity(row) : null;
  }

  async findByNameAndParentId(
    name: string,
    parentId: string | null,
  ): Promise<Item | null> {
    const cond = parentId
      ? eq(itemsTable.parentId, parentId)
      : isNull(itemsTable.parentId);
    const [row] = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.name, name), cond))
      .limit(1);

    return row ? this.mapToEntity(row) : null;
  }

  async findAllFolders(): Promise<Item[]> {
    const rows = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.type, "folder"))
      .orderBy(itemsTable.sortOrder, itemsTable.name);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findChildrenByParentId(
    parentId: string | null,
    limit: number = 50,
    offset: number = 0,
    typeFilter?: "file" | "folder",
  ): Promise<{ data: Item[]; total: number }> {
    const parentCond = parentId
      ? eq(itemsTable.parentId, parentId)
      : isNull(itemsTable.parentId);

    const filterCond = typeFilter ? eq(itemsTable.type, typeFilter) : undefined;
    const combinedCond = filterCond ? and(parentCond, filterCond) : parentCond;

    // Calculate absolute total recursively for pagination sizing
    const [countRow] = await db
      .select({ value: count() })
      .from(itemsTable)
      .where(combinedCond);

    // Fetch constrained payload logically
    const rows = await db
      .select()
      .from(itemsTable)
      .where(combinedCond)
      // Use CASE to guarantee folder-first ordering — text DESC is unreliable across PG collations
      .orderBy(
        asc(sql`CASE WHEN ${itemsTable.type} = 'folder' THEN 0 ELSE 1 END`),
        itemsTable.sortOrder,
        itemsTable.name,
      )
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((row) => this.mapToEntity(row)),
      total: countRow.value,
    };
  }

  async findDescendantsByPath(path: string): Promise<Item[]> {
    const rows = await db
      .select()
      .from(itemsTable)
      .where(like(itemsTable.path, `${path}/%`))
      .orderBy(
        asc(sql`CASE WHEN ${itemsTable.type} = 'folder' THEN 0 ELSE 1 END`),
        itemsTable.path,
      );

    return rows.map((row) => this.mapToEntity(row));
  }

  async searchByName(
    query: string,
    pathPrefix?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Item[]; total: number }> {
    const conditions = [ilike(itemsTable.name, `%${query}%`)];

    if (pathPrefix) {
      // Restrict to descendants of the specific UUID path prefix
      conditions.push(like(itemsTable.path, `${pathPrefix}%`));
    }

    const whereClause = and(...conditions);

    // Count total matches for pagination metadata
    const [countRow] = await db
      .select({ value: count() })
      .from(itemsTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(itemsTable)
      .where(whereClause)
      .orderBy(
        asc(sql`CASE WHEN ${itemsTable.type} = 'folder' THEN 0 ELSE 1 END`),
        itemsTable.name,
      )
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((row) => this.mapToEntity(row)),
      total: countRow.value,
    };
  }

  async create(
    item: Omit<Item, "id" | "createdAt" | "updatedAt">,
  ): Promise<Item> {
    const [row] = await db
      .insert(itemsTable)
      .values({
        name: item.name,
        type: item.type,
        parentId: item.parentId,
        path: item.path,
        depth: item.depth,
        sortOrder: item.sortOrder,
        size: item.size,
        mimeType: item.mimeType,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async createWithId(
    item: Omit<Item, "createdAt" | "updatedAt">,
  ): Promise<Item> {
    try {
      const [row] = await db
        .insert(itemsTable)
        .values({
          id: item.id,
          name: item.name,
          type: item.type,
          parentId: item.parentId,
          path: item.path,
          depth: item.depth,
          sortOrder: item.sortOrder,
          size: item.size,
          mimeType: item.mimeType,
        })
        .returning();

      return this.mapToEntity(row);
    } catch (err: unknown) {
      // PostgreSQL error code 23505 = unique_violation
      // The DB constraint (uq_items_name_parent) fires here when two concurrent
      // POSTs both pass the app-level check — the DB is the authoritative guard.
      if (typeof err === "object" && err !== null && (err as any).code === "23505") {
        throw new ConflictError(
          `An item named '${item.name}' already exists in this location`,
        );
      }
      throw err;
    }
  }

  async update(id: string, data: Partial<Item>): Promise<Item> {
    // Strip fields that must never be overwritten by application code.
    // updatedAt is intentionally omitted — the DB trigger (trg_items_updated_at)
    // sets it automatically on every UPDATE, making it tamper-proof.
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = data;

    const [row] = await db
      .update(itemsTable)
      .set(updateData)
      .where(eq(itemsTable.id, id))
      .returning();

    if (!row) throw new Error(`Item with id ${id} not found`);
    return this.mapToEntity(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(itemsTable).where(eq(itemsTable.id, id));
  }
}
