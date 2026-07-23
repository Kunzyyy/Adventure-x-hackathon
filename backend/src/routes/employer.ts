// routes/employer.ts — the two employer POST endpoints.

import { Router, type Request, type Response } from "express";
import {
  EmployerAnalyzeRequestSchema,
  EmployerGenerateRequestSchema,
  EmployerAnalyzeDataSchema,
  RecruitmentKitSchema,
  validate,
  validateAi,
  sendOk,
  sendError,
  apiError,
} from "../contracts/index.js";
import { employerAnalyze, employerGenerate } from "../services/employer.js";
import { isServiceError } from "../services/errors.js";
import { getLlmMode } from "../llm/index.js";

export const employerRouter = Router();

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

// POST /api/employer/analyze
employerRouter.post("/analyze", async (req: Request, res: Response) => {
  const v = validate(EmployerAnalyzeRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const out = await employerAnalyze(v.value);
    const checked = validateAi(EmployerAnalyzeDataSchema, out.data);
    if (!checked.ok) return sendError(res, checked.error, out.mode);
    sendOk(res, checked.value, out.mode);
  } catch (e) {
    handleErr(res, e);
  }
});

// POST /api/employer/generate
employerRouter.post("/generate", async (req: Request, res: Response) => {
  const v = validate(EmployerGenerateRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, "mock");
  try {
    const out = await employerGenerate(v.value);
    const checked = validateAi(RecruitmentKitSchema, out.data);
    if (!checked.ok) return sendError(res, checked.error, out.mode);
    sendOk(res, checked.value, out.mode);
  } catch (e) {
    handleErr(res, e);
  }
});
