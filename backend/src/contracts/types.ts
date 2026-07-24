// contracts/types.ts
// Public TypeScript types for the MVP. Derived from the Zod schemas in
// ./schemas.ts so there is exactly one source of truth — change a schema and
// the type follows automatically. Never redeclare these by hand.

import type { z } from "zod";
import type {
  APIModeSchema,
  JobProfileSchema,
  AIQuestionSchema,
  QuestionAnswerSchema,
  CandidateFactSchema,
  ResumeBulletSchema,
  ExperienceSchema,
  GeneratedResumeSchema,
  ScreeningDimensionSchema,
  InterviewQuestionSchema,
  StandardizedJDSchema,
  RecruitmentKitSchema,
  APIErrorCodeSchema,
  APIErrorSchema,
  SeekerAnalyzeRequestSchema,
  SeekerFactsRequestSchema,
  SeekerGenerateRequestSchema,
  EmployerAnalyzeRequestSchema,
  EmployerGenerateRequestSchema,
  SeekerAnalyzeDataSchema,
  SeekerFactsDataSchema,
  SeekerGenerateDataSchema,
  EmployerAnalyzeDataSchema,
} from "./schemas.js";

export type APIMode = z.infer<typeof APIModeSchema>;
export type JobProfile = z.infer<typeof JobProfileSchema>;
export type AIQuestion = z.infer<typeof AIQuestionSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type CandidateFact = z.infer<typeof CandidateFactSchema>;
export type ResumeBullet = z.infer<typeof ResumeBulletSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type GeneratedResume = z.infer<typeof GeneratedResumeSchema>;
export type ScreeningDimension = z.infer<typeof ScreeningDimensionSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type StandardizedJD = z.infer<typeof StandardizedJDSchema>;
export type RecruitmentKit = z.infer<typeof RecruitmentKitSchema>;

export type APIErrorCode = z.infer<typeof APIErrorCodeSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;

/** The discriminated success/failure envelope. `data` and `error` are mutually exclusive. */
export type APIResponse<T> =
  | { ok: true; data: T; mode: APIMode }
  | { ok: false; error: APIError; mode: APIMode };

// Request types
export type SeekerAnalyzeRequest = z.infer<typeof SeekerAnalyzeRequestSchema>;
export type SeekerFactsRequest = z.infer<typeof SeekerFactsRequestSchema>;
export type SeekerGenerateRequest = z.infer<typeof SeekerGenerateRequestSchema>;
export type EmployerAnalyzeRequest = z.infer<typeof EmployerAnalyzeRequestSchema>;
export type EmployerGenerateRequest = z.infer<typeof EmployerGenerateRequestSchema>;

// Response data types
export type SeekerAnalyzeData = z.infer<typeof SeekerAnalyzeDataSchema>;
export type SeekerFactsData = z.infer<typeof SeekerFactsDataSchema>;
export type SeekerGenerateData = z.infer<typeof SeekerGenerateDataSchema>;
export type EmployerAnalyzeData = z.infer<typeof EmployerAnalyzeDataSchema>;

// Convenience aliases for full responses
export type SeekerAnalyzeResponse = APIResponse<SeekerAnalyzeData>;
export type SeekerFactsResponse = APIResponse<SeekerFactsData>;
export type SeekerGenerateResponse = APIResponse<SeekerGenerateData>;
export type EmployerAnalyzeResponse = APIResponse<EmployerAnalyzeData>;
export type EmployerGenerateResponse = APIResponse<RecruitmentKit>;
