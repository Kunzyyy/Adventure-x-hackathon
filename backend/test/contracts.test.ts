// test/contracts.test.ts
// Task 1: legal examples pass, illegal ones are rejected.

import { describe, it, expect } from "vitest";
import {
  SeekerAnalyzeRequestSchema,
  SeekerFactsRequestSchema,
  SeekerGenerateRequestSchema,
  EmployerAnalyzeRequestSchema,
  EmployerGenerateRequestSchema,
  SeekerAnalyzeDataSchema,
  SeekerFactsDataSchema,
  SeekerGenerateDataSchema,
  EmployerAnalyzeDataSchema,
  RecruitmentKitSchema,
  APIResponseSchema,
  AIQuestionSchema,
} from "../src/contracts/index.js";
import {
  SEEKER_ANALYZE_DATA,
  SEEKER_FACTS_DATA,
  SEEKER_GENERATE_DATA,
  SEEKER_JOB_PROFILE,
  SEEKER_QUESTIONS,
  SEEKER_ANSWERS,
  SEEKER_CONFIRMED_FACTS,
  EMPLOYER_ANALYZE_DATA,
  EMPLOYER_RECRUITMENT_KIT,
  EMPLOYER_JOB_PROFILE,
  EMPLOYER_QUESTIONS,
  EMPLOYER_ANSWERS,
} from "../src/test-fixtures.js";

const seekerAnalyzeReq = { jdText: "招聘数据分析实习生..." };
const seekerFactsReq = {
  jobProfile: SEEKER_JOB_PROFILE,
  questions: SEEKER_QUESTIONS,
  answers: SEEKER_ANSWERS,
};
const seekerGenerateReq = {
  jobProfile: SEEKER_JOB_PROFILE,
  confirmedFacts: SEEKER_CONFIRMED_FACTS,
};
const employerAnalyzeReq = {
  jobTitle: "新媒体运营实习生",
  roughRequirement: "会剪视频，平时发发小红书，最好长期实习",
};
const employerGenerateReq = {
  jobTitle: "新媒体运营实习生",
  roughRequirement: "会剪视频，平时发发小红书，最好长期实习",
  jobProfile: EMPLOYER_JOB_PROFILE,
  questions: EMPLOYER_QUESTIONS,
  answers: EMPLOYER_ANSWERS,
};

describe("legal examples pass", () => {
  it("seeker analyze request", () => {
    expect(SeekerAnalyzeRequestSchema.safeParse(seekerAnalyzeReq).success).toBe(true);
  });
  it("seeker facts request", () => {
    expect(SeekerFactsRequestSchema.safeParse(seekerFactsReq).success).toBe(true);
  });
  it("seeker generate request", () => {
    expect(SeekerGenerateRequestSchema.safeParse(seekerGenerateReq).success).toBe(true);
  });
  it("employer analyze request", () => {
    expect(EmployerAnalyzeRequestSchema.safeParse(employerAnalyzeReq).success).toBe(true);
  });
  it("employer generate request", () => {
    expect(EmployerGenerateRequestSchema.safeParse(employerGenerateReq).success).toBe(true);
  });
  it("seeker analyze data", () => {
    expect(SeekerAnalyzeDataSchema.safeParse(SEEKER_ANALYZE_DATA).success).toBe(true);
  });
  it("seeker facts data (all confirmed false)", () => {
    expect(SeekerFactsDataSchema.safeParse(SEEKER_FACTS_DATA).success).toBe(true);
  });
  it("seeker generate data", () => {
    expect(SeekerGenerateDataSchema.safeParse(SEEKER_GENERATE_DATA).success).toBe(true);
  });
  it("employer analyze data", () => {
    expect(EmployerAnalyzeDataSchema.safeParse(EMPLOYER_ANALYZE_DATA).success).toBe(true);
  });
  it("recruitment kit (weights 100, 5 questions)", () => {
    expect(RecruitmentKitSchema.safeParse(EMPLOYER_RECRUITMENT_KIT).success).toBe(true);
  });
});

describe("missing required fields fail", () => {
  it("seeker analyze without jdText", () => {
    expect(SeekerAnalyzeRequestSchema.safeParse({}).success).toBe(false);
  });
  it("employer analyze without roughRequirement", () => {
    expect(EmployerAnalyzeRequestSchema.safeParse({ jobTitle: "x" }).success).toBe(false);
  });
  it("seeker facts without answers", () => {
    expect(
      SeekerFactsRequestSchema.safeParse({ jobProfile: SEEKER_JOB_PROFILE, questions: SEEKER_QUESTIONS })
        .success,
    ).toBe(false);
  });
});

describe("empty strings fail", () => {
  it("whitespace jdText rejected", () => {
    expect(SeekerAnalyzeRequestSchema.safeParse({ jdText: "   " }).success).toBe(false);
  });
  it("empty oldResume rejected (when provided)", () => {
    expect(
      SeekerAnalyzeRequestSchema.safeParse({ jdText: "ok", oldResume: "  " }).success,
    ).toBe(false);
  });
});

describe("question count bounds", () => {
  const q = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `q${i + 1}`,
      text: "t",
      reason: "r",
      answerType: "text" as const,
      required: true,
    }));
  it("seeker 4 questions rejected", () => {
    const data = { ...SEEKER_ANALYZE_DATA, questions: q(4) };
    expect(SeekerAnalyzeDataSchema.safeParse(data).success).toBe(false);
  });
  it("seeker 9 questions rejected", () => {
    const data = { ...SEEKER_ANALYZE_DATA, questions: q(9) };
    expect(SeekerAnalyzeDataSchema.safeParse(data).success).toBe(false);
  });
  it("seeker 5 and 8 accepted", () => {
    expect(
      SeekerAnalyzeDataSchema.safeParse({ ...SEEKER_ANALYZE_DATA, questions: q(5) }).success,
    ).toBe(true);
    expect(
      SeekerAnalyzeDataSchema.safeParse({ ...SEEKER_ANALYZE_DATA, questions: q(8) }).success,
    ).toBe(true);
  });
  it("employer 2 questions rejected", () => {
    const data = { ...EMPLOYER_ANALYZE_DATA, questions: q(2) };
    expect(EmployerAnalyzeDataSchema.safeParse(data).success).toBe(false);
  });
  it("employer 6 questions rejected", () => {
    const data = { ...EMPLOYER_ANALYZE_DATA, questions: q(6) };
    expect(EmployerAnalyzeDataSchema.safeParse(data).success).toBe(false);
  });
});

describe("choice options rules", () => {
  it("choice without options fails", () => {
    const q = { id: "q1", text: "t", reason: "r", answerType: "choice" as const, required: true };
    expect(AIQuestionSchema.safeParse(q).success).toBe(false);
  });
  it("choice with one option fails", () => {
    const q = {
      id: "q1",
      text: "t",
      reason: "r",
      answerType: "choice" as const,
      required: true,
      options: ["only"],
    };
    expect(AIQuestionSchema.safeParse(q).success).toBe(false);
  });
  it("choice with duplicate options fails", () => {
    const q = {
      id: "q1",
      text: "t",
      reason: "r",
      answerType: "choice" as const,
      required: true,
      options: ["a", "a"],
    };
    expect(AIQuestionSchema.safeParse(q).success).toBe(false);
  });
  it("text question with options fails", () => {
    const q = {
      id: "q1",
      text: "t",
      reason: "r",
      answerType: "text" as const,
      required: true,
      options: ["a", "b"],
    };
    expect(AIQuestionSchema.safeParse(q).success).toBe(false);
  });
});

describe("answer references", () => {
  it("answer to unknown question fails", () => {
    const bad = {
      ...seekerFactsReq,
      answers: [{ questionId: "nope", answer: "x" }],
    };
    expect(SeekerFactsRequestSchema.safeParse(bad).success).toBe(false);
  });
  it("duplicate answer fails", () => {
    const bad = {
      ...seekerFactsReq,
      answers: [
        { questionId: "sq_1", answer: "a" },
        { questionId: "sq_1", answer: "b" },
      ],
    };
    expect(SeekerFactsRequestSchema.safeParse(bad).success).toBe(false);
  });
  it("missing required answer fails", () => {
    const bad = {
      ...seekerFactsReq,
      answers: [{ questionId: "sq_1", answer: "a" }],
    };
    expect(SeekerFactsRequestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("facts response confirmed must be false", () => {
  it("confirmed:true fact rejected", () => {
    const bad = {
      ...SEEKER_FACTS_DATA,
      facts: [{ ...SEEKER_FACTS_DATA.facts[0], confirmed: true }],
    };
    expect(SeekerFactsDataSchema.safeParse(bad).success).toBe(false);
  });
});

describe("generate input confirmed must be true", () => {
  it("confirmed:false fact rejected", () => {
    const bad = {
      jobProfile: SEEKER_JOB_PROFILE,
      confirmedFacts: [{ ...SEEKER_CONFIRMED_FACTS[0], confirmed: false }],
    };
    expect(SeekerGenerateRequestSchema.safeParse(bad).success).toBe(false);
  });
  it("empty confirmedFacts rejected", () => {
    const bad = { jobProfile: SEEKER_JOB_PROFILE, confirmedFacts: [] };
    expect(SeekerGenerateRequestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("evidenceIds rules", () => {
  it("empty evidenceIds rejected", () => {
    const bad = {
      ...SEEKER_GENERATE_DATA,
      resume: {
        ...SEEKER_GENERATE_DATA.resume,
        summary: [{ text: "x", evidenceIds: [] }],
      },
    };
    expect(SeekerGenerateDataSchema.safeParse(bad).success).toBe(false);
  });
  it("duplicate evidenceIds within a bullet rejected", () => {
    const bad = {
      ...SEEKER_GENERATE_DATA,
      resume: {
        ...SEEKER_GENERATE_DATA.resume,
        summary: [{ text: "x", evidenceIds: ["fact_1", "fact_1"] }],
      },
    };
    expect(SeekerGenerateDataSchema.safeParse(bad).success).toBe(false);
  });
});

describe("screening weights must sum to 100", () => {
  it("sum 99 rejected", () => {
    const kit = {
      ...EMPLOYER_RECRUITMENT_KIT,
      screeningDimensions: EMPLOYER_RECRUITMENT_KIT.screeningDimensions.map((d, i) =>
        i === 0 ? { ...d, weight: 39 } : d,
      ),
    };
    expect(RecruitmentKitSchema.safeParse(kit).success).toBe(false);
  });
  it("sum 101 rejected", () => {
    const kit = {
      ...EMPLOYER_RECRUITMENT_KIT,
      screeningDimensions: EMPLOYER_RECRUITMENT_KIT.screeningDimensions.map((d, i) =>
        i === 0 ? { ...d, weight: 41 } : d,
      ),
    };
    expect(RecruitmentKitSchema.safeParse(kit).success).toBe(false);
  });
  it("zero weight rejected (positive int)", () => {
    const kit = {
      ...EMPLOYER_RECRUITMENT_KIT,
      screeningDimensions: EMPLOYER_RECRUITMENT_KIT.screeningDimensions.map((d, i) =>
        i === 0 ? { ...d, weight: 0 } : d,
      ),
    };
    expect(RecruitmentKitSchema.safeParse(kit).success).toBe(false);
  });
});

describe("interview questions must be exactly 5", () => {
  it("4 questions rejected", () => {
    const kit = {
      ...EMPLOYER_RECRUITMENT_KIT,
      interviewQuestions: EMPLOYER_RECRUITMENT_KIT.interviewQuestions.slice(0, 4),
    };
    expect(RecruitmentKitSchema.safeParse(kit).success).toBe(false);
  });
  it("6 questions rejected", () => {
    const kit = {
      ...EMPLOYER_RECRUITMENT_KIT,
      interviewQuestions: [
        ...EMPLOYER_RECRUITMENT_KIT.interviewQuestions,
        { ...EMPLOYER_RECRUITMENT_KIT.interviewQuestions[0] },
      ],
    };
    expect(RecruitmentKitSchema.safeParse(kit).success).toBe(false);
  });
});

describe("response envelope mutual exclusion", () => {
  const ok = (x: unknown) => APIResponseSchema(SeekerAnalyzeDataSchema).safeParse(x).success;
  it("success with data accepted", () => {
    expect(ok({ ok: true, data: SEEKER_ANALYZE_DATA, mode: "mock" })).toBe(true);
  });
  it("failure with error accepted", () => {
    expect(
      ok({ ok: false, error: { code: "INVALID_INPUT", message: "x" }, mode: "mock" }),
    ).toBe(true);
  });
  it("carrying both data and error rejected", () => {
    expect(
      ok({
        ok: true,
        data: SEEKER_ANALYZE_DATA,
        error: { code: "INVALID_INPUT", message: "x" },
        mode: "mock",
      }),
    ).toBe(false);
  });
  it("invalid mode rejected", () => {
    expect(ok({ ok: true, data: SEEKER_ANALYZE_DATA, mode: "real" })).toBe(false);
  });
});
