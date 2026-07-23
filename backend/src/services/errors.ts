// services/errors.ts — typed service-layer errors that map cleanly to the
// contract's APIError + HTTP status. Routes catch these and never let raw
// errors leak to the client.

import type { APIErrorCode } from "../contracts/index.js";

export class ServiceError extends Error {
  readonly code: APIErrorCode;
  readonly fieldErrors?: Record<string, string[]>;
  constructor(code: APIErrorCode, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function isServiceError(e: unknown): e is ServiceError {
  return e instanceof ServiceError;
}
