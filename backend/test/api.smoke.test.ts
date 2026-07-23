// test/api.smoke.test.ts
// Task 2: five MOCK endpoints, real HTTP requests via supertest.

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import { seekerRouter } from "../src/routes/seeker.js";
import { employerRouter } from "../src/routes/employer.js";
import { initLlm } from "../src/llm/index.js";
import {
  SEEKER_JOB_PROFILE,
  SEEKER_QUESTIONS,
  SEEKER_ANSWERS,
  SEEKER_CONFIRMED_FACTS,
  EMPLOYER_JOB_PROFILE,
  EMPLOYER_QUESTIONS,
  EMPLOYER_ANSWERS,
} from "../src/test-fixtures.js";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/seeker", seekerRouter);
  app.use("/api/employer", employerRouter);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  return app;
}

let app: Express;
beforeAll(() => {
  process.env.LLM_MODE = "mock"; // force mock; no network
  initLlm();
  app = buildApp();
});

describe("seeker analyze", () => {
  it("returns mock data for valid JD", async () => {
    const r = await request(app)
      .post("/api/seeker/analyze")
      .send({ jdText: "招聘数据分析实习生，要求熟悉SQL和Excel。" });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe("mock");
    expect(r.body.data.jobProfile.jobTitle).toBeTruthy();
    expect(r.body.data.questions.length).toBeGreaterThanOrEqual(5);
    expect(r.body.data.questions.length).toBeLessThanOrEqual(8);
  });
  it("rejects empty jdText with 400", async () => {
    const r = await request(app).post("/api/seeker/analyze").send({ jdText: "   " });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
    expect(r.body.error.code).toBe("INVALID_INPUT");
    expect(r.body.mode).toBe("mock");
  });
});

describe("seeker facts", () => {
  it("returns facts with confirmed:false", async () => {
    const r = await request(app)
      .post("/api/seeker/facts")
      .send({ jobProfile: SEEKER_JOB_PROFILE, questions: SEEKER_QUESTIONS, answers: SEEKER_ANSWERS });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe("mock");
    expect(Array.isArray(r.body.data.facts)).toBe(true);
    expect(r.body.data.facts.every((f: { confirmed: boolean }) => f.confirmed === false)).toBe(true);
  });
  it("rejects answer referencing unknown question", async () => {
    const r = await request(app)
      .post("/api/seeker/facts")
      .send({
        jobProfile: SEEKER_JOB_PROFILE,
        questions: SEEKER_QUESTIONS,
        answers: [{ questionId: "nope", answer: "x" }],
      });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
  });
});

describe("seeker generate", () => {
  it("generates resume from confirmed facts", async () => {
    const r = await request(app)
      .post("/api/seeker/generate")
      .send({ jobProfile: SEEKER_JOB_PROFILE, confirmedFacts: SEEKER_CONFIRMED_FACTS });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe("mock");
    // every bullet must have evidenceIds
    const allBullets = [
      ...r.body.data.resume.summary,
      ...r.body.data.resume.education,
      ...r.body.data.resume.experiences.flatMap((e: { bullets: { evidenceIds: unknown[] }[] }) => e.bullets),
      ...r.body.data.resume.skills,
    ];
    expect(allBullets.every((b: { evidenceIds: unknown[] }) => b.evidenceIds.length > 0)).toBe(true);
    // education empty (no education fact)
    expect(r.body.data.resume.education).toEqual([]);
    // interviewRisks is string[]
    expect(Array.isArray(r.body.data.interviewRisks)).toBe(true);
    expect(r.body.data.interviewRisks.every((x: unknown) => typeof x === "string")).toBe(true);
  });
  it("rejects confirmed:false facts", async () => {
    const bad = [{ ...SEEKER_CONFIRMED_FACTS[0], confirmed: false }];
    const r = await request(app)
      .post("/api/seeker/generate")
      .send({ jobProfile: SEEKER_JOB_PROFILE, confirmedFacts: bad });
    expect(r.status).toBe(400); // structural INVALID_INPUT (request schema)
    expect(r.body.ok).toBe(false);
  });
});

describe("employer analyze", () => {
  it("returns 3-5 questions", async () => {
    const r = await request(app)
      .post("/api/employer/analyze")
      .send({ jobTitle: "新媒体运营实习生", roughRequirement: "会剪视频，发发小红书，最好长期实习" });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe("mock");
    expect(r.body.data.questions.length).toBeGreaterThanOrEqual(3);
    expect(r.body.data.questions.length).toBeLessThanOrEqual(5);
  });
  it("rejects missing roughRequirement", async () => {
    const r = await request(app).post("/api/employer/analyze").send({ jobTitle: "x" });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
  });
});

describe("employer generate", () => {
  it("returns recruitment kit with weights 100 and 5 questions", async () => {
    const r = await request(app)
      .post("/api/employer/generate")
      .send({
        jobTitle: "新媒体运营实习生",
        roughRequirement: "会剪视频，发发小红书，最好长期实习",
        jobProfile: EMPLOYER_JOB_PROFILE,
        questions: EMPLOYER_QUESTIONS,
        answers: EMPLOYER_ANSWERS,
      });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe("mock");
    const sum = r.body.data.screeningDimensions.reduce(
      (a: number, d: { weight: number }) => a + d.weight,
      0,
    );
    expect(sum).toBe(100);
    expect(r.body.data.interviewQuestions.length).toBe(5);
    expect(
      r.body.data.interviewQuestions.every((q: { strongAnswerSignals: unknown[] }) =>
        Array.isArray(q.strongAnswerSignals),
      ),
    ).toBe(true);
  });
  it("rejects when required answer missing", async () => {
    const r = await request(app)
      .post("/api/employer/generate")
      .send({
        jobTitle: "新媒体运营实习生",
        roughRequirement: "x",
        jobProfile: EMPLOYER_JOB_PROFILE,
        questions: EMPLOYER_QUESTIONS,
        answers: [{ questionId: "eq_1", answer: "4" }],
      });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
  });
});

describe("health regression", () => {
  it("/api/health still works", async () => {
    const r = await request(app).get("/api/health");
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("ok");
  });
});
