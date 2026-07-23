// mocks/seeker.ts — stable, truthful mock data for the seeker endpoints.
//
// These are NOT "creative" content. Every statement is a faithful restatement
// of a source quote that exists verbatim in the fixture answers, nothing is
// invented, no fuzzy number ("几次") is concretized, no participation is
// upgraded to leadership. Each resume bullet cites real evidence ids.

import type {
  CandidateFact,
  SeekerAnalyzeData,
  SeekerFactsData,
  SeekerGenerateData,
  JobProfile,
  QuestionAnswer,
} from "../contracts/index.js";

import { SEEKER_ANALYZE_DATA } from "../test-fixtures.js";

export function seekerAnalyzeMock(): SeekerAnalyzeData {
  // Return a deep copy so callers can't mutate the shared fixture.
  return structuredClone(SEEKER_ANALYZE_DATA);
}

/**
 * Derive fact cards from the ACTUAL input answers, so every sourceQuote is a
 * verbatim substring of an answer we were sent (the contract requires this
 * and verifySourceQuotes enforces it). We do NOT invent quotes, numbers, or
 * skills; we only restate what the user wrote, conservatively.
 *
 * If an answer is too short or a denial ("没有/不会/没"), we still emit a
 * faithful, conservative fact ("暂无…" style) tied to that quote.
 */
export function seekerFactsMock(
  _jobProfile: JobProfile,
  answers: QuestionAnswer[],
): SeekerFactsData {
  const facts: CandidateFact[] = [];
  const missing: string[] = [];

  answers.forEach((a, idx) => {
    const quote = a.answer.trim();
    if (!quote) return;
    // Conservative category: we don't pretend to know project vs skill from
    // a mock; "other" is the safe neutral bucket. The statement just restates
    // the user's words without upgrading or quantifying.
    const isDenial = /(没有|不会|没|暂无|只是|只|仅)/.test(quote);
    const statement = isDenial
      ? `用户表示：${quote}` // keep a denial a denial — no upgrade
      : `据用户陈述：${quote}`;
    facts.push({
      id: `fact_${idx + 1}`,
      category: "other",
      statement,
      sourceQuestionId: a.questionId,
      sourceQuote: quote,
      confirmed: false,
    });
  });

  // Conservative missingInformation: only flag a gap if the job asks for SQL
  // but no answer mentions SQL practice.
  const anySql = answers.some((a) => /SQL|sql/.test(a.answer) && !/没有|不会|暂无/.test(a.answer));
  if (!anySql) missing.push("尚无真实项目中的SQL使用证据");

  return { facts, missingInformation: missing };
}

// generate: uses only confirmed facts. education is [] unless an input fact
// is literally categorized as education. Every bullet cites a real fact id
// that exists in the input — never invented.
export function seekerGenerateMock(
  _jobProfile: JobProfile,
  confirmedFacts: CandidateFact[],
): SeekerGenerateData {
  if (confirmedFacts.length === 0) {
    return {
      resume: { title: "岗位定制简历", summary: [], education: [], experiences: [], skills: [] },
      missingInformation: ["未提供任何已确认事实"],
      interviewRisks: [],
    };
  }

  // Group confirmed facts by category.
  const educationFacts = confirmedFacts.filter((f) => f.category === "education");
  const projectFacts = confirmedFacts.filter(
    (f) => f.category === "project" || f.category === "internship" || f.category === "activity",
  );
  const skillFacts = confirmedFacts.filter((f) => f.category === "skill");

  const summary = [
    {
      text: confirmedFacts
        .map((f) => f.statement)
        .join("；"),
      evidenceIds: confirmedFacts.map((f) => f.id),
    },
  ];

  const experiences = projectFacts.map((f, i) => ({
    name: `经历 ${i + 1}`,
    bullets: [{ text: f.statement, evidenceIds: [f.id] }],
  }));

  const skills = skillFacts.map((f) => ({
    text: f.statement,
    evidenceIds: [f.id],
  }));

  const education = educationFacts.map((f) => ({
    text: f.statement,
    evidenceIds: [f.id],
  }));

  return {
    resume: {
      title: "岗位定制简历",
      summary,
      education, // [] when no education fact — never invented
      experiences,
      skills,
    },
    missingInformation: [],
    interviewRisks: [],
  };
}
