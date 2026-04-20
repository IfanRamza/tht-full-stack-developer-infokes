import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { ItemService } from "../../../domain/ports/item-service.port";
import { errorHandlerPlugin } from "../../../plugins/errorHandler.plugin";
import { itemController } from "./item.controller";

/**
 * Route Integration Test Suite: item.controller.ts
 *
 * These tests verify the HTTP boundary of the application — the Elysia routes
 * defined in `itemController`. A real Elysia app instance is constructed in
 * memory for each test using the actual `errorHandlerPlugin`, but the
 * `ItemService` is replaced by a `MockItemService` so no real database or
 * business logic executes.
 *
 * Why test the controller layer separately?
 * - The controller is responsible for: reading query/path params, coercing types
 *   via TypeBox schemas, calling the correct service method, and returning
 *   the right HTTP status code.
 * - Unit tests on the service verify *what* to do; these tests verify the
 *   HTTP contract — *how* requests are parsed and *which* status codes are returned.
 *
 * Request execution:
 *   Elysia's `app.handle(Request)` allows tests to fire HTTP requests directly
 *   into the router without starting a real TCP server on any port.
 *   This makes tests fast, portable, and fully isolated.
 *
 * `beforeEach` rebuilds a fresh app and mock instance to prevent state sharing
 * across tests (e.g. mock call counts from previous requests carrying over).
 */

/**
 * In-memory mock implementing the full ItemService port.
 * All methods are `mock()` spies whose return values can be configured
 * per test using `.mockResolvedValueOnce()`.
 */
class MockItemService implements ItemService {
  getFolderTree = mock();
  getFolderContents = mock();
  getFolderContentsByPath = mock();
  searchItems = mock();
  createItem = mock();
}

describe("ItemController API Tests", () => {
  let mockService: MockItemService;
  // Typed as `any` to avoid Elysia's deeply-inferred generic type mismatch.
  // The chained .use().group() calls produce a fully-typed Elysia instance whose
  // generic signature differs from the bare `Elysia` type. Since tests only call
  // `app.handle(Request)`, `any` is the correct annotation here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;

  beforeEach(() => {
    mockService = new MockItemService();

    // Reconstruct the Elysia app identically to the production setup in index.ts,
    // but with the MockItemService injected in place of the real ItemServiceImpl.
    app = new Elysia()
      .use(errorHandlerPlugin)
      .group("/api/v1", (router) => router.use(itemController(mockService)));
  });

  // ─── Schema Validation ─────────────────────────────────────────────────────

  /**
   * Test 1 — TypeBox rejects malformed POST body
   *
   * Purpose:
   *   Verifies that Elysia's TypeBox validation layer intercepts a `POST /items`
   *   request whose body is missing required fields (`type`, `parentId`, `sortOrder`)
   *   and returns a `422 Unprocessable Entity` response — without ever reaching
   *   the domain service.
   *
   * Setup:
   *   Sends a POST request with only `{ name: "Only Name Sent" }` — an intentionally
   *   incomplete payload that violates the TypeBox schema defined in the controller.
   *
   * Expected result:
   *   - Response status is `422`.
   *   - `mockService.createItem` is never called, proving that TypeBox validation
   *     acts as a hard gate before any business logic executes.
   */
  it("should securely block POST /items with missing schemas safely", async () => {
    const req = new Request("http://localhost/api/v1/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Only Name Sent" }), // missing: type, parentId, sortOrder
    });

    const res = await app.handle(req);

    expect(res.status).toBe(422);
    expect(mockService.createItem).not.toHaveBeenCalled();
  });

  // ─── Query Parameter Coercion ──────────────────────────────────────────────

  /**
   * Test 2 — Numeric query params are coerced from strings to integers
   *
   * Purpose:
   *   Verifies that Elysia's `t.Numeric()` TypeBox type correctly coerces
   *   the query string values `?limit=15&offset=25` from HTTP strings into
   *   JavaScript numbers before they are passed to the service.
   *
   *   This is important because query parameters arrive as raw strings in all
   *   HTTP frameworks. Without coercion, the service would receive `"15"` and
   *   `"25"` as strings, which would silently break pagination arithmetic.
   *
   * Setup:
   *   `mockService.getFolderContents` is configured to resolve with a minimal
   *   mock response so the controller can return a `200` status.
   *
   * Expected result:
   *   - Response status is `200`.
   *   - `mockService.getFolderContents` is called with `(null, 15, 25)` — the
   *     numeric values `15` and `25`, not the strings `"15"` and `"25"`.
   */
  it("should correctly map limit/offset queries to Integers on /contents", async () => {
    const mockFolderContent = {
      folder: { id: "root" } as any,
      children: [],
      totalElements: 0,
    };
    mockService.getFolderContents.mockResolvedValueOnce(mockFolderContent);

    const req = new Request(
      "http://localhost/api/v1/items/contents?limit=15&offset=25",
    );
    const res = await app.handle(req);

    expect(res.status).toBe(200);
    // Elysia must coerce string query params to numbers via t.Numeric()
    expect(mockService.getFolderContents).toHaveBeenCalledWith(null, 15, 25);
  });

  /**
   * Test 3 — Omitted query params pass as undefined (service applies defaults)
   *
   * Purpose:
   *   Verifies that when `limit` and `offset` query parameters are not present
   *   in the request, Elysia passes `undefined` to the service rather than
   *   a string like `"undefined"` or `"0"`.
   *
   *   The service layer (`ItemServiceImpl`) defines its own default parameter
   *   values (`limit = 50`, `offset = 0`). This test confirms that the
   *   controller correctly delegates default-handling responsibility to the service,
   *   not the HTTP layer.
   *
   * Setup:
   *   A bare `GET /items/contents` request with no query string is sent.
   *
   * Expected result:
   *   - Response status is `200`.
   *   - `mockService.getFolderContents` is called with `(null, undefined, undefined)`,
   *     confirming that missing optional params flow through as `undefined`.
   */
  it("should apply default pagination mappings automatically on /contents", async () => {
    const mockFolderContent = {
      folder: { id: "root" } as any,
      children: [],
      totalElements: 0,
    };
    mockService.getFolderContents.mockResolvedValueOnce(mockFolderContent);

    const req = new Request("http://localhost/api/v1/items/contents");
    const res = await app.handle(req);

    expect(res.status).toBe(200);
    // Omitted optional params must arrive as undefined — not "0" or "undefined"
    expect(mockService.getFolderContents).toHaveBeenCalledWith(
      null,
      undefined,
      undefined,
    );
  });
});
