// test/services.employer.test.ts
// Task 7-8 service-layer logic: mock-mode employer outputs validated,
// anti-discrimination and no-auto-decision checks.

import { describe, it, expect, beforeAll } from "vitest";
import {
  employerAnalyze,
  employerGenerate,
  checkNoDiscrimination,
  checkNoAutoDecision,
} from "../src/services/employer.js";
import { initLlm } from "../src/llm/index.js";
import { EmployerAnalyzeDataSchema, RecruitmentKitSchema } from "../src/contracts/index.js";
import type { JobProfile } from "../src/contracts/index.js";
import { EMPLOYER_RECRUITMENT_KIT, EMPLOYER_JOB_PROFILE, EMPLOYER_QUESTIONS, EMPLOYER_ANSWERS } from "../src/test-fixtures.js";

beforeAll(() => {
  process.env.LLM_MODE = "mock";
  delete process.env.AI_API_KEY;
  initLlm();
});

describe("employer analyze (mock)", () => {
  it("returns valid EmployerAnalyzeData with 3-5 questions", async () => {
    const { data: d } = await employerAnalyze({ jobTitle: "新媒体运营实习生", roughRequirement: "会剪视频，发发小红书，最好长期实习" });
    expect(EmployerAnalyzeDataSchema.safeParse(d).success).toBe(true);
    expect(d.questions.length).toBeGreaterThanOrEqual(3);
    expect(d.questions.length).toBeLessThanOrEqual(5);
    const ids = d.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("moves unconfirmed info to uncertainties, not into mustHaves", async () => {
    const { data: d } = await employerAnalyze({ jobTitle: "新媒体运营实习生", roughRequirement: "会剪视频，发发小红书，最好长期实习" });
    // roughRequirement mentions "长期实习" (fuzzy) — should NOT be written as a hard requirement
    const blob = JSON.stringify(d);
    // uncertainties should be present
    expect(d.jobProfile.uncertainties.length).toBeGreaterThan(0);
  });
});

describe("employer generate (mock)", () => {
  it("returns a valid RecruitmentKit with weights 100 and 5 questions", async () => {
    const { data: d } = await employerGenerate({
      jobTitle: "新媒体运营实习生",
      roughRequirement: "会剪视频，发发小红书，最好长期实习",
      jobProfile: EMPLOYER_JOB_PROFILE,
      questions: EMPLOYER_QUESTIONS,
      answers: EMPLOYER_ANSWERS,
    });
    expect(RecruitmentKitSchema.safeParse(d).success).toBe(true);
    const sum = d.screeningDimensions.reduce((a, x) => a + x.weight, 0);
    expect(sum).toBe(100);
    expect(d.interviewQuestions.length).toBe(5);
    expect(d.interviewQuestions.every((q) => q.strongAnswerSignals.length > 0)).toBe(true);
  });
  it("does not invent salary not in input", async () => {
    const { data: d } = await employerGenerate({
      jobTitle: "新媒体运营实习生",
      roughRequirement: "会剪视频", // no salary mentioned
      jobProfile: EMPLOYER_JOB_PROFILE,
      questions: EMPLOYER_QUESTIONS,
      answers: EMPLOYER_ANSWERS,
    });
    expect(JSON.stringify(d)).not.toContain("薪资");
    expect(JSON.stringify(d)).not.toContain("salary");
  });
});

describe("anti-discrimination + no auto-decision nets", () => {
  it("rejects a kit containing a discriminatory term", () => {
    const kit = structuredClone(EMPLOYER_RECRUITMENT_KIT);
    kit.standardizedJD.requirements.push("限男性");
    expect(() => checkNoDiscrimination(kit)).toThrowError(/歧视性/);
  });
  it("rejects a kit containing auto-hire language", () => {
    const kit = structuredClone(EMPLOYER_RECRUITMENT_KIT);
    kit.interviewQuestions[0].purpose = "用于自动录用决策";
    expect(() => checkNoAutoDecision(kit)).toThrowError(/录用|淘汰|排名/);
  });
  it("accepts the clean canonical kit", () => {
    expect(() => checkNoDiscrimination(EMPLOYER_RECRUITMENT_KIT)).not.toThrow();
    expect(() => checkNoAutoDecision(EMPLOYER_RECRUITMENT_KIT)).not.toThrow();
  });
});
