// test/services.seeker.test.ts
// Task 4-6 service-layer logic: mock-mode outputs validated through the
// contract schema, anti-fabrication checks, and source-quote verification.

import { describe, it, expect, beforeAll } from "vitest";
import { seekerAnalyze, seekerFacts, seekerGenerate, verifySourceQuotes } from "../src/services/seeker.js";
import { initLlm } from "../src/llm/index.js";
import {
  SeekerAnalyzeDataSchema,
  SeekerFactsDataSchema,
  SeekerGenerateDataSchema,
} from "../src/contracts/index.js";
import type { CandidateFact, JobProfile, QuestionAnswer } from "../src/contracts/index.js";

beforeAll(() => {
  process.env.LLM_MODE = "mock";
  delete process.env.AI_API_KEY;
  initLlm();
});

const JP: JobProfile = {
  jobTitle: "数据分析实习生",
  responsibilities: ["整理数据"],
  coreCompetencies: ["数据清洗"],
  mustHaves: ["SQL", "Excel"],
  niceToHaves: [],
  expectedOutcomes: ["分析结果"],
  constraints: [],
  keywords: ["SQL"],
  uncertainties: [],
};

const Q5 = [
  { id: "sq_1", text: "Excel清洗过什么数据？", reason: "r", answerType: "text" as const, required: true },
  { id: "sq_2", text: "真实项目用过SQL吗？", reason: "r", answerType: "text" as const, required: true },
  { id: "sq_3", text: "分析过哪些指标？", reason: "r", answerType: "text" as const, required: true },
  { id: "sq_4", text: "怎么展示结果？", reason: "r", answerType: "text" as const, required: true },
  { id: "sq_5", text: "每周可到岗几天？", reason: "r", answerType: "number" as const, required: true },
];

describe("seeker analyze (mock)", () => {
  it("returns valid SeekerAnalyzeData", async () => {
    const { data: d } = await seekerAnalyze({ jdText: "招聘数据分析实习生，要求熟悉SQL和Excel。" });
    expect(SeekerAnalyzeDataSchema.safeParse(d).success).toBe(true);
    expect(d.questions.length).toBeGreaterThanOrEqual(5);
    expect(d.questions.length).toBeLessThanOrEqual(8);
    const ids = d.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("seeker facts (mock) — anti-fabrication", () => {
  const answers: QuestionAnswer[] = [
    { questionId: "sq_1", answer: "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。" },
    { questionId: "sq_2", answer: "只在课程作业里写过基础查询，没有实际项目经验。" },
    { questionId: "sq_3", answer: "比较过每周销售额和不同品类销量。" },
    { questionId: "sq_4", answer: "用Excel柱状图向小组展示。" },
    { questionId: "sq_5", answer: "4" },
  ];
  it("returns facts whose sourceQuote is verbatim in the answers", async () => {
    const { data: d } = await seekerFacts({ jobProfile: JP, questions: Q5, answers });
    expect(SeekerFactsDataSchema.safeParse(d).success).toBe(true);
    for (const f of d.facts) {
      const a = answers.find((x) => x.questionId === f.sourceQuestionId);
      expect(a?.answer.includes(f.sourceQuote)).toBe(true);
    }
  });
  it("all facts start confirmed:false", async () => {
    const { data: d } = await seekerFacts({ jobProfile: JP, questions: Q5, answers });
    expect(d.facts.every((f) => f.confirmed === false)).toBe(true);
  });
  it("does not upgrade a denial into proficiency", async () => {
    const denyAnswers: QuestionAnswer[] = [
      { questionId: "sq_1", answer: "我没有用过Excel做数据清洗。" },
      { questionId: "sq_2", answer: "我不会SQL。" },
      { questionId: "sq_3", answer: "没分析过业务指标。" },
      { questionId: "sq_4", answer: "没展示过分析结果。" },
      { questionId: "sq_5", answer: "0" },
    ];
    const { data: d } = await seekerFacts({ jobProfile: JP, questions: Q5, answers: denyAnswers });
    const blob = JSON.stringify(d);
    expect(blob).not.toContain("熟练");
    expect(blob).not.toContain("精通");
    expect(blob).not.toContain("负责");
    // denials are faithfully restated, not turned into capabilities
    expect(d.facts.length).toBeGreaterThan(0);
  });
  it("does not concretize fuzzy numbers", async () => {
    const fuzzy: QuestionAnswer[] = [
      { questionId: "sq_1", answer: "我做过几次数据整理。" },
      { questionId: "sq_2", answer: "了解一点SQL。" },
      { questionId: "sq_3", answer: "看过几个指标。" },
      { questionId: "sq_4", answer: "改短了一点数据就上去了。" },
      { questionId: "sq_5", answer: "3" },
    ];
    const { data: d } = await seekerFacts({ jobProfile: JP, questions: Q5, answers: fuzzy });
    const blob = JSON.stringify(d);
    // fuzzy tokens preserved
    expect(blob).toContain("几次");
    // not turned into specific counts
    expect(blob).not.toContain("3次");
  });
});

describe("verifySourceQuotes rejects fabricated quotes", () => {
  it("throws when sourceQuote is not in the answer", () => {
    const facts: CandidateFact[] = [
      {
        id: "f1",
        category: "project",
        statement: "x",
        sourceQuestionId: "sq_1",
        sourceQuote: "我从未说过的原话",
        confirmed: false,
      },
    ];
    expect(() =>
      verifySourceQuotes(facts, [{ questionId: "sq_1", answer: "真实的回答内容" }]),
    ).toThrowError(/sourceQuote|无法/);
  });
  it("accepts a verbatim quote", () => {
    const facts: CandidateFact[] = [
      {
        id: "f1",
        category: "project",
        statement: "x",
        sourceQuestionId: "sq_1",
        sourceQuote: "真实的回答内容",
        confirmed: false,
      },
    ];
    expect(() => verifySourceQuotes(facts, [{ questionId: "sq_1", answer: "真实的回答内容" }])).not.toThrow();
  });
});

describe("seeker generate (mock) — evidence integrity", () => {
  const confirmed: CandidateFact[] = [
    {
      id: "fact_1",
      category: "project",
      statement: "使用Excel对便利店销售明细去重和统一日期格式。",
      sourceQuestionId: "sq_1",
      sourceQuote: "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。",
      confirmed: true,
    },
  ];
  it("generates a valid resume with evidenceIds", async () => {
    const { data: d } = await seekerGenerate({ jobProfile: JP, confirmedFacts: confirmed });
    expect(SeekerGenerateDataSchema.safeParse(d).success).toBe(true);
    const allBullets = [
      ...d.resume.summary,
      ...d.resume.education,
      ...d.resume.experiences.flatMap((e) => e.bullets),
      ...d.resume.skills,
    ];
    expect(allBullets.every((b) => b.evidenceIds.length > 0)).toBe(true);
    // every evidenceId references a real input fact
    const ids = new Set(confirmed.map((f) => f.id));
    expect(allBullets.every((b) => b.evidenceIds.every((id: string) => ids.has(id)))).toBe(true);
  });
  it("leaves education empty when no education fact", async () => {
    const { data: d } = await seekerGenerate({ jobProfile: JP, confirmedFacts: confirmed });
    expect(d.resume.education).toEqual([]);
    // no invented school
    expect(JSON.stringify(d)).not.toContain("大学");
    expect(JSON.stringify(d)).not.toContain("学院");
  });
  it("interviewRisks is string[]", async () => {
    const { data: d } = await seekerGenerate({ jobProfile: JP, confirmedFacts: confirmed });
    expect(Array.isArray(d.interviewRisks)).toBe(true);
    expect(d.interviewRisks.every((r) => typeof r === "string")).toBe(true);
  });
});
