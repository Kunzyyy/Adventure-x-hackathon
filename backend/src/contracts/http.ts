// contracts/http.ts
// Helpers to turn validated payloads into the unified APIResponse envelope and
// map failures to the canonical APIError + HTTP status code.

import type { Response } from "express";
import { ZodError, type ZodSchema, type ZodIssue } from "zod";
import type { APIError, APIResponse, APIMode, APIErrorCode } from "./types.js";

export type ValidationOk<T> = { ok: true; value: T };
export type ValidationErr = { ok: false; error: APIError; status: number };
export type ValidationResult<T> = ValidationOk<T> | ValidationErr;

/**
 * Validate `input` against `schema`. On success returns the parsed value.
 * On failure returns a structured APIError (INVALID_INPUT, 400) with field
 * errors grouped by the top-level path segment so the page can show them.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: zodToApiError(parsed.error), status: 400 };
}

/** Convert a ZodError into the contract's APIError shape. */
export function zodToApiError(err: ZodError): APIError {
  const fieldErrors: Record<string, string[]> = {};
  let firstMessage = "请求内容不完整";
  for (const issue of err.issues as ZodIssue[]) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    const msg = issue.message || "无效字段";
    (fieldErrors[key] ||= []).push(msg);
    if (firstMessage === "请求内容不完整") firstMessage = msg;
  }
  return {
    code: "INVALID_INPUT",
    message: firstMessage,
    fieldErrors,
  };
}

/**
 * Send a success response with HTTP 200.
 * The data is additionally re-validated against `dataSchema` in mock/live paths
 * so a malformed AI or mock payload never escapes the contract boundary.
 */
export function sendOk<T>(res: Response, data: T, mode: APIMode): void {
  const body: APIResponse<T> = { ok: true, data, mode };
  res.status(200).json(body);
}

/** Map an APIErrorCode to its HTTP status per the contract's table. */
export function statusForCode(code: APIErrorCode): number {
  switch (code) {
    case "INVALID_INPUT":
      return 400;
    case "INVALID_AI_OUTPUT":
      return 422;
    case "LLM_TIMEOUT":
      return 504;
    case "LLM_UNAVAILABLE":
      return 502;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

/** Send a failure response with the canonical error + status + mode. */
export function sendError(
  res: Response,
  error: APIError,
  mode: APIMode,
  status?: number,
): void {
  const body: APIResponse<never> = { ok: false, error, mode };
  res.status(status ?? statusForCode(error.code)).json(body);
}

/**
 * Validate a candidate data payload (from AI or mock) against its schema.
 * Used after mock/live generation to guarantee the response honors the contract.
 * Returns an INVALID_AI_OUTPUT error on mismatch (caller decides retry/fallback).
 */
export function validateAi<T>(schema: ZodSchema<T>, raw: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    status: 422,
    error: {
      code: "INVALID_AI_OUTPUT",
      message: "模型输出不符合契约结构",
      fieldErrors: groupFieldErrors(parsed.error),
    },
  };
}

function groupFieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues as ZodIssue[]) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    (out[key] ||= []).push(issue.message || "无效字段");
  }
  return out;
}

/** Build a plain APIError without fieldErrors. */
export function apiError(code: APIErrorCode, message: string): APIError {
  return { code, message };
}
