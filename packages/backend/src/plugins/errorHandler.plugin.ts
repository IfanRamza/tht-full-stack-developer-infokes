import Elysia from "elysia";
import { errorResponse } from "../utils/response";
import { ConflictError, NotFoundError, ValidationError } from "../domain/models/errors";

export const errorHandlerPlugin = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }) => {
    console.error(`[App Error] ${code}:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return errorResponse("Validation error", "BAD_REQUEST", error.all);
    }

    if (code === "NOT_FOUND" || error instanceof NotFoundError) {
      set.status = 404;
      const msg = error instanceof Error ? error.message : "Route not found";
      return errorResponse(msg, "NOT_FOUND");
    }

    if (error instanceof ConflictError) {
      set.status = 409;
      return errorResponse(error.message, "CONFLICT");
    }

    if (error instanceof ValidationError) {
      set.status = 400;
      return errorResponse(error.message, "BAD_REQUEST");
    }

    set.status = 500;
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return errorResponse(message);
  },
);
