// routes/seeker.ts — the three seeker POST endpoints.

import { Router, type Request, type Response } from "express";
import {
  SeekerAnalyzeRequestSchema,
  SeekerFactsRequestSchema,
  SeekerGenerateRequestSchema,
  SeekerAnalyzeDataSchema,
  SeekerFactsDataSchema,
  SeekerGenerateDataSchema,
  validate,
  validateAi,
  sendOk,
  sendError,
  apiError,
} from "../contracts/index.js";
import { seekerAnalyze, seekerFacts, seekerGenerate } from "../services/seeker.js";
import { isServiceError } from "../services/errors.js";
import { getLlmMode } from "../llm/index.js";

export const seekerRouter = Router();

// The "current" mode for error responses (before a call resolves) reflects
// the switchboard's configured mode; success responses carry the actual mode
// returned by the service (which may be 'fallback' even when configured live).
const cfgMode = () => (getLlmMode() === "live" ? "live" : "mock");

function handleErr(res: Response, e: unknown): void {
  const m = cfgMode();
  if (isServiceError(e)) {
    sendError(res, apiError(e.code, e.message), m);
  } else {
    sendError(
      res,
      apiError("INTERNAL_ERROR", e instanceof Error ? e.message : "未知错误"),
      m,
    );
  }
}

// POST /api/seeker/analyze
seekerRouter.post("/analyze", async (req: Request, res: Response) => {
  const v = validate(SeekerAnalyzeRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const out = await seekerAnalyze(v.value);
    // Final structural guarantee: re-validate before leaving the boundary.
    const checked = validateAi(SeekerAnalyzeDataSchema, out.data);
    if (!checked.ok) return sendError(res, checked.error, out.mode);
    sendOk(res, checked.value, out.mode);
  } catch (e) {
    handleErr(res, e);
  }
});

// POST /api/seeker/facts
seekerRouter.post("/facts", async (req: Request, res: Response) => {
  const v = validate(SeekerFactsRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const out = await seekerFacts(v.value);
    const checked = validateAi(SeekerFactsDataSchema, out.data);
    if (!checked.ok) return sendError(res, checked.error, out.mode);
    sendOk(res, checked.value, out.mode);
  } catch (e) {
    handleErr(res, e);
  }
});

// POST /api/seeker/generate
seekerRouter.post("/generate", async (req: Request, res: Response) => {
  const v = validate(SeekerGenerateRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const out = await seekerGenerate(v.value);
    const checked = validateAi(SeekerGenerateDataSchema, out.data);
    if (!checked.ok) return sendError(res, checked.error, out.mode);
    sendOk(res, checked.value, out.mode);
  } catch (e) {
    handleErr(res, e);
  }
});
