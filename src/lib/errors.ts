export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}
