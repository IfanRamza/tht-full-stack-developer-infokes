import { Elysia, t } from "elysia";
import { ItemService } from "../../../domain/ports/item-service.port";
import { successResponse } from "../../../utils/response";

export const itemController = (service: ItemService) =>
  new Elysia({ prefix: "/items" })
    /**
     * GET /items/tree
     * Returns the full hierarchical folder tree (all folders, nested).
     */
    .get("/tree", async () => {
      const tree = await service.getFolderTree();
      return successResponse(tree);
    })

    /**
     * GET /items/contents
     * Returns items at the root level.
     */
    .get(
      "/contents",
      async ({ query: { limit, offset } }) => {
        const contents = await service.getFolderContents(null, limit, offset);
        return successResponse(contents);
      },
      {
        query: t.Object({
          limit: t.Optional(t.Numeric()),
          offset: t.Optional(t.Numeric()),
        }),
      },
    )

    /**
     * GET /items/:id/contents
     * Returns the folder metadata and its direct children.
     */
    .get(
      "/:id/contents",
      async ({ params: { id }, query: { limit, offset } }) => {
        const contents = await service.getFolderContents(id, limit, offset);
        return successResponse(contents);
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.Numeric()),
          offset: t.Optional(t.Numeric()),
        }),
      },
    )

    /**
     * GET /items/by-path?path=...
     * Resolves a GitHub-style path string into folder contents.
     */
    .get(
      "/by-path",
      async ({ query: { path, limit, offset } }) => {
        const contents = await service.getFolderContentsByPath(
          path,
          limit,
          offset,
        );
        return successResponse(contents);
      },
      {
        query: t.Object({
          path: t.String(),
          limit: t.Optional(t.Numeric()),
          offset: t.Optional(t.Numeric()),
        }),
      },
    )

    /**
     * GET /items/search?q=...
     * Searches items by name across the entire structure.
     * Supports pagination via limit/offset for large result sets.
     */
    .get(
      "/search",
      async ({ query: { q, path, limit, offset } }) => {
        const results = await service.searchItems(q, path, limit, offset);
        return successResponse(results.data, results.total);
      },
      {
        query: t.Object({
          q: t.String({ minLength: 1, maxLength: 100 }),
          path: t.Optional(t.String()),
          limit: t.Optional(t.Numeric()),
          offset: t.Optional(t.Numeric()),
        }),
      },
    )

    /**
     * POST /items
     * Creates a new folder or file.
     * `path` and `depth` are intentionally absent — computed server-side.
     */
    .post(
      "/",
      async ({ body, set }) => {
        const item = await service.createItem({
          ...body,
          size: body.size ?? 0,
          mimeType: body.mimeType ?? null,
        });
        set.status = 201;
        return successResponse(item);
      },
      {
        body: t.Object({
          name: t.String(),
          type: t.Union([t.Literal("folder"), t.Literal("file")]),
          parentId: t.Nullable(t.String()),
          sortOrder: t.Number(),
          size: t.Optional(t.Number()),
          mimeType: t.Optional(t.Nullable(t.String())),
        }),
      },
    )

    /**
     * PATCH /items/:id
     * Renames or moves an existing item.
     * Supply `name` to rename, `parentId` to move (null = root), or both.
     */
    .patch(
      "/:id",
      async ({ params: { id }, body }) => {
        const item = await service.updateItem(id, body);
        return successResponse(item);
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
          parentId: t.Optional(t.Nullable(t.String())),
        }),
      },
    )

    /**
     * DELETE /items/:id
     * Permanently deletes an item and all its descendants.
     * Returns 204 No Content on success.
     */
    .delete(
      "/:id",
      async ({ params: { id }, set }) => {
        await service.deleteItem(id);
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String() }),
      },
    );

