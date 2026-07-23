// mocks/employer.ts — stable, truthful mock data for the employer endpoints.
//
// Mirrors the canonical RecruitmentKit example from the contract: weights
// sum to exactly 100, exactly 5 interview questions each with competency /
// purpose / strongAnswerSignals, no discriminatory conditions, no auto-hire.

import type { RecruitmentKit, EmployerAnalyzeData } from "../contracts/index.js";
import { EMPLOYER_ANALYZE_DATA, EMPLOYER_RECRUITMENT_KIT } from "../test-fixtures.js";

export function employerAnalyzeMock(): EmployerAnalyzeData {
  return structuredClone(EMPLOYER_ANALYZE_DATA);
}

export function employerGenerateMock(): RecruitmentKit {
  return structuredClone(EMPLOYER_RECRUITMENT_KIT);
}
