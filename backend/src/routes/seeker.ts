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

const mode = () => (getLlmMode() === "live" ? "live" : "mock");

function handleErr(res: Response, e: unknown): void {
  const m = mode();
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
    const data = await seekerAnalyze(v.value);
    // Final structural guarantee: re-validate before leaving the boundary.
    const out = validateAi(SeekerAnalyzeDataSchema, data);
    if (!out.ok) return sendError(res, out.error, mode());
    sendOk(res, out.value, mode());
  } catch (e) {
    handleErr(res, e);
  }
});

// POST /api/seeker/facts
seekerRouter.post("/facts", async (req: Request, res: Response) => {
  const v = validate(SeekerFactsRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const data = await seekerFacts(v.value);
    const out = validateAi(SeekerFactsDataSchema, data);
    if (!out.ok) return sendError(res, out.error, mode());
    sendOk(res, out.value, mode());
  } catch (e) {
    handleErr(res, e);
  }
});

// POST /api/seeker/generate
seekerRouter.post("/generate", async (req: Request, res: Response) => {
  const v = validate(SeekerGenerateRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const data = await seekerGenerate(v.value);
    const out = validateAi(SeekerGenerateDataSchema, data);
    if (!out.ok) return sendError(res, out.error, mode());
    sendOk(res, out.value, mode());
  } catch (e) {
    handleErr(res, e);
  }
});
