export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Capture stack trace, excluding the constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = "Resource not found") {
    super(message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = "Resource conflict occurred") {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string = "Validation failed") {
    super(message);
  }
}
