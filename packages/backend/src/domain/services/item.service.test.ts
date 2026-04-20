import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ValidationError } from "../errors/domain.error";
import { Item } from "../models/item.model";
import { ItemRepository } from "../ports/item-repository.port";
import { ItemServiceImpl } from "./item.service";

/**
 * Unit Test Suite: ItemServiceImpl
 *
 * These tests cover the pure business logic inside the Domain Service layer.
 * No real database is involved — the `ItemRepository` port is replaced entirely
 * by a `MockItemRepository` that returns controlled values via `mock()`.
 *
 * This approach verifies that:
 * - The service enforces its own validation rules independently of the database.
 * - The tree-building algorithm correctly transforms flat arrays into nested structures.
 * - Path resolution correctly walks down segments and guards against invalid types.
 *
 * Each `beforeEach` block creates a fresh mock and service instance to prevent
 * state leakage between tests.
 */

/**
 * In-memory mock implementing the full ItemRepository port.
 * Every method is a `mock()` spy — calls can be tracked and return values
 * can be configured per test using `.mockResolvedValueOnce()`.
 */
class MockItemRepository implements ItemRepository {
  findById = mock();
  findByNameAndParentId = mock();
  findAllFolders = mock();
  findChildrenByParentId = mock();
  findDescendantsByPath = mock();
  searchByName = mock();
  create = mock();
  update = mock();
  delete = mock();
}

describe("ItemService Unit Tests", () => {
  let mockRepo: MockItemRepository;
  let service: ItemServiceImpl;

  beforeEach(() => {
    mockRepo = new MockItemRepository();
    service = new ItemServiceImpl(mockRepo);
  });

  // ─── Validation Logic ─────────────────────────────────────────────────────

  describe("Validation Logic", () => {
    /**
     * Test 1 — Invalid name rejection
     *
     * Purpose:
     *   Verifies that `createItem()` throws a `ValidationError` when the
     *   item name contains a filesystem-illegal character (`/` in this case)
     *   before any database interaction occurs.
     *
     * Expected result:
     *   - The promise rejects with a `ValidationError` instance.
     *   - `findByNameAndParentId` is never called, proving the guard fires
     *     before the duplicate-name check (short-circuit validation).
     */
    it("should throw ValidationError if name contains illegal characters on create", async () => {
      const invalidName = "My/Folder";

      await expect(
        service.createItem({
          name: invalidName,
          type: "folder",
          parentId: null,
          sortOrder: 0,
          size: 0,
          mimeType: null,
        }),
      ).rejects.toThrow(ValidationError);

      expect(mockRepo.findByNameAndParentId).not.toHaveBeenCalled();
    });

    /**
     * Test 2 — Valid name passthrough
     *
     * Purpose:
     *   Verifies that a name containing only legal characters passes validation
     *   and proceeds through the full creation flow:
     *   duplicate check → insert → path patch.
     *
     * Mock setup:
     *   - `findByNameAndParentId` returns `null` (no existing item with that name).
     *   - `create` returns a stub item with `id: "123"`.
     *   - `update` returns the patched item with the computed `path: "/123"`.
     *
     * Expected result:
     *   - The promise resolves with a defined value (the updated item).
     *   - No error is thrown, confirming the name passed all validation rules.
     */
    it("should allow valid names on create", async () => {
      mockRepo.findByNameAndParentId.mockResolvedValueOnce(null);
      mockRepo.create.mockResolvedValueOnce({
        id: "123",
        depth: 0,
        path: "",
      } as Item);
      mockRepo.update.mockResolvedValueOnce({
        id: "123",
        path: "/123",
      } as Item);

      const validName = "My Folder 123";

      await expect(
        service.createItem({
          name: validName,
          type: "folder",
          parentId: null,
          sortOrder: 0,
          size: 0,
          mimeType: null,
        }),
      ).resolves.toBeDefined();
    });
  });

  // ─── Tree Computation ──────────────────────────────────────────────────────

  describe("Tree Computation", () => {
    /**
     * Test 3 — Flat-to-tree transformation (O(n) algorithm)
     *
     * Purpose:
     *   Verifies the `getFolderTree()` algorithm correctly transforms a flat,
     *   unordered array of folder records into a properly nested tree structure
     *   using an O(n) Map-based lookup (no recursive DB queries).
     *
     * Input:
     *   - Root1 (parentId: null)
     *     └── Child1 (parentId: "1")
     *           └── GrandChild1 (parentId: "2")
     *   - Root2 (parentId: null)
     *
     * Expected result:
     *   - The tree has 2 root nodes: Root1 and Root2.
     *   - Root1 has exactly 1 child: Child1.
     *   - Child1 has exactly 1 child: GrandChild1 (3 levels deep).
     *   - Root2 has no children.
     */
    it("should properly build a recursive folder tree", async () => {
      const flatFolders: Item[] = [
        { id: "1", parentId: null, name: "Root1" } as Item,
        { id: "2", parentId: "1", name: "Child1" } as Item,
        { id: "3", parentId: null, name: "Root2" } as Item,
        { id: "4", parentId: "2", name: "GrandChild1" } as Item,
      ];

      mockRepo.findAllFolders.mockResolvedValueOnce(flatFolders);

      const tree = await service.getFolderTree();

      // Two root-level nodes
      expect(tree.length).toBe(2);
      expect(tree[0].id).toBe("1");
      expect(tree[1].id).toBe("3");

      // Root1 → Child1 → GrandChild1 nesting verified
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].id).toBe("2");
      expect(tree[0].children[0].children.length).toBe(1);
      expect(tree[0].children[0].children[0].id).toBe("4");
    });
  });

  // ─── Path Resolution Security ──────────────────────────────────────────────

  describe("Path Resolution Security", () => {
    /**
     * Test 4 — Valid multi-segment path resolution
     *
     * Purpose:
     *   Verifies that `getFolderContentsByPath("Documents/Work")` correctly
     *   walks each path segment by name, resolving parent-to-child relationships
     *   using `findByNameAndParentId`, and returns the contents of the final
     *   resolved folder ("Work").
     *
     * Mock setup:
     *   - First call resolves "Documents" → `{ id: "docs-id", type: "folder" }`.
     *   - Second call resolves "Work" under docs-id → `{ id: "work-id", type: "folder" }`.
     *   - `findChildrenByParentId` returns an empty page (content doesn't matter here).
     *   - `findById` returns the Work folder for the metadata response.
     *
     * Expected result:
     *   - The returned `folder.id` is "work-id" (the last resolved segment).
     *   - `findByNameAndParentId` was called exactly twice (once per segment).
     */
    it("should correctly resolve an existing chain of folders", async () => {
      mockRepo.findByNameAndParentId
        .mockResolvedValueOnce({
          id: "docs-id",
          type: "folder",
          name: "Documents",
        } as Item) // segment 1: "Documents" → resolved
        .mockResolvedValueOnce({
          id: "work-id",
          type: "folder",
          name: "Work",
        } as Item); // segment 2: "Work" under docs-id → resolved

      mockRepo.findChildrenByParentId.mockResolvedValueOnce({
        data: [],
        total: 0,
      });
      mockRepo.findById.mockResolvedValueOnce({
        id: "work-id",
        type: "folder",
      } as Item);

      const contents = await service.getFolderContentsByPath("Documents/Work");

      expect(contents.folder.id).toBe("work-id");
      expect(mockRepo.findByNameAndParentId).toHaveBeenCalledTimes(2);
    });

    /**
     * Test 5 — File masquerading as a path segment
     *
     * Purpose:
     *   Verifies that `getFolderContentsByPath()` throws an error when any
     *   segment in the path resolves to an item with `type: "file"` instead
     *   of `type: "folder"`.
     *
     *   This is a security guard — without it, a client could craft a path like
     *   "Documents/README.md/secret" to attempt traversal through a file node.
     *
     * Mock setup:
     *   - First call resolves "Documents" correctly as a folder.
     *   - Second call resolves "README.md" but returns `type: "file"`.
     *
     * Expected result:
     *   - The promise rejects with an error matching "Folder path not found".
     *   - Execution halts at the second segment; no content is fetched.
     */
    it("should throw Error if a path segment is not a folder", async () => {
      mockRepo.findByNameAndParentId
        .mockResolvedValueOnce({
          id: "docs-id",
          type: "folder",
          name: "Documents",
        } as Item) // segment 1: "Documents" → valid folder
        .mockResolvedValueOnce({
          id: "file-id",
          type: "file",
          name: "README.md",
        } as Item); // segment 2: "README.md" → type mismatch, must throw

      await expect(
        service.getFolderContentsByPath("Documents/README.md"),
      ).rejects.toThrow("Folder path not found");
    });
  });
});
