// services/seeker.ts — seeker-pipeline business logic.
// Uses the LLM switchboard (mock now, live-ready). Enforces the contract's
// anti-fabrication rules both at the prompt level and via post-parse checks.

import type {
  SeekerAnalyzeRequest,
  SeekerAnalyzeData,
  SeekerFactsRequest,
  SeekerFactsData,
  SeekerGenerateRequest,
  SeekerGenerateData,
  APIMode,
} from "../contracts/index.js";
import {
  SeekerAnalyzeDataSchema,
  SeekerFactsDataSchema,
  SeekerGenerateDataSchema,
  findOrphanEvidenceIds,
} from "../contracts/index.js";
import { callStructured, type CallResult } from "../llm/index.js";
import {
  seekerAnalyzeMock,
  seekerFactsMock,
  seekerGenerateMock,
} from "../mocks/seeker.js";
import { ServiceError } from "./errors.js";

/** Services return the validated data plus the mode the LLM switchboard
 *  actually resolved (mock / live / fallback), so routes report the truth. */
export interface ServiceOutcome<T> {
  data: T;
  mode: APIMode;
}

// ────────────────────────── analyze ──────────────────────────

const ANALYZE_SYSTEM = `你是岗位分析助手。任务：把目标JD解析为结构化岗位画像，并生成5—8道用于收集求职者真实证据的问题。
规则：
- 只从JD提取信息，不补写JD没有的薪资、公司、地点、学历年限等；不确定项放入uncertainties。
- 不能把JD要求当成求职者已具备的能力。
- 生成5—8道问题，优先询问真实项目、个人行动、实际工具、可验证结果、到岗限制和缺少证据的必须条件。
- 问题id形如 sq_1..sq_N，唯一；choice题提供至少两个不重复options；其他题型不带options。
- reason解释为何提问；required标注是否必答。
- 不诱导用户编造数字、奖项、公司、技能和经历。
- 所有JobProfile数组字段必须存在，没有内容用空数组[]。`;

export async function seekerAnalyze(req: SeekerAnalyzeRequest): Promise<ServiceOutcome<SeekerAnalyzeData>> {
  const blocks = [
    "目标岗位JD：\n" + req.jdText,
    ...(req.oldResume ? ["求职者旧简历（仅用于发现已有证据和缺口，不是其能力背书）：\n" + req.oldResume] : []),
  ];
  const result = await callStructured({
    schema: SeekerAnalyzeDataSchema,
    system: ANALYZE_SYSTEM,
    userBlocks: blocks,
    maxTokens: 2000,
    mockFn: seekerAnalyzeMock,
    label: "seeker.analyze",
    onLiveFailure: "fallback",
  });
  return { data: result.data, mode: result.mode };
}

// ────────────────────────── facts ──────────────────────────

const FACTS_SYSTEM = `你是事实整理助手。任务：把用户回答整理成待确认的事实卡片，绝不替用户确认。
规则（反编造）：
- 只提取回答或旧简历中明确说过的信息；用户没说的公司、项目、奖项、工具、技能、数字、结果一律不能出现。
- "参与"不能写成"负责/主导"；"了解/接触过/会一点"不能写成"熟练/精通/掌握"。
- 模糊表达保持模糊："几次""十几个人""改短了一点"等不得替换成3次、10人、90秒到45秒等具体数字。
- 每条事实：唯一id(fact_N)、category、谨慎的statement、逐字sourceQuote(必须能在输入原文中找到连续原话)。
- 回答来源事实必须有sourceQuestionId；旧简历来源事实可省略sourceQuestionId但必须保留sourceQuote。
- 所有事实confirmed必须为false。
- 与岗位相比仍缺少的重要证据放入missingInformation，不能生成虚假事实补齐。
- 一个原话含多条独立事实可拆分，但每条仍引用真实sourceQuote。`;

export async function seekerFacts(req: SeekerFactsRequest): Promise<ServiceOutcome<SeekerFactsData>> {
  const blocks = [
    "岗位画像：\n" + JSON.stringify(req.jobProfile),
    "AI提问：\n" + JSON.stringify(req.questions),
    "用户回答：\n" + JSON.stringify(req.answers),
    ...(req.oldResume ? ["旧简历：\n" + req.oldResume] : []),
  ];
  const result = await callStructured({
    schema: SeekerFactsDataSchema,
    system: FACTS_SYSTEM,
    userBlocks: blocks,
    maxTokens: 2500,
    mockFn: () => seekerFactsMock(req.jobProfile, req.answers),
    label: "seeker.facts",
    onLiveFailure: "fallback",
  });
  // Semantic source check: every sourceQuote must literally appear in the
  // answers/oldResume we sent. This is the safety net the prompt alone can't
  // guarantee. Failures are INVALID_AI_OUTPUT (retried once by the client).
  verifySourceQuotes(result.data.facts, req.answers, req.oldResume);
  return { data: result.data, mode: result.mode };
}

/** Verify each fact's sourceQuote is a verbatim substring of an answer or oldResume. */
export function verifySourceQuotes(
  facts: SeekerFactsData["facts"],
  answers: { questionId: string; answer: string }[],
  oldResume?: string,
): void {
  const corpus = answers.map((a) => a.answer);
  if (oldResume) corpus.push(oldResume);
  for (const f of facts) {
    if (f.sourceQuestionId) {
      // must match the answer to its question
      const a = answers.find((x) => x.questionId === f.sourceQuestionId);
      if (!a || !a.answer.includes(f.sourceQuote)) {
        throw new ServiceError(
          "INVALID_AI_OUTPUT",
          `事实 ${f.id} 的 sourceQuote 无法在其声称的回答中逐字找到`,
        );
      }
    } else {
      // oldResume-sourced: must be found somewhere in oldResume
      if (!oldResume || !corpus.some((c) => c.includes(f.sourceQuote))) {
        throw new ServiceError(
          "INVALID_AI_OUTPUT",
          `事实 ${f.id} 的 sourceQuote 无法在输入原文中逐字找到`,
        );
      }
    }
  }
}

// ────────────────────────── generate ──────────────────────────

const GENERATE_SYSTEM = `你是简历生成助手。任务：只用用户确认过的事实生成一页岗位定制简历，不能补经历。
规则（反编造）：
- 只能使用本次输入confirmedFacts中的信息；可以调整顺序、压缩、改善表达，但不能增加事实、数字、技能、学校、公司、奖项、结果。
- "参与"仍不能写成"负责/主导"；"了解"不能写成熟练。
- 每个简历要点evidenceIds至少一个、不重复、且全部引用本次confirmedFacts中的真实id。
- 没有教育事实时education返回[]，不得生成示例学校；没有某类事实时对应数组为空。
- 缺少的岗位能力进入missingInformation，不能偷偷写进简历正文。
- 容易被追问/证据较弱/熟练度有限的内容进入interviewRisks(字符串数组)，但风险描述也不能增加新事实。
- resume只含title/summary/education/experiences/skills；missingInformation与interviewRisks在resume外层同级返回。`;

export async function seekerGenerate(req: SeekerGenerateRequest): Promise<ServiceOutcome<SeekerGenerateData>> {
  const blocks = [
    "岗位画像：\n" + JSON.stringify(req.jobProfile),
    "已确认事实(只允许使用这些)：\n" + JSON.stringify(req.confirmedFacts),
  ];
  const result = await callStructured({
    schema: SeekerGenerateDataSchema,
    system: GENERATE_SYSTEM,
    userBlocks: blocks,
    maxTokens: 2500,
    mockFn: () => seekerGenerateMock(req.jobProfile, req.confirmedFacts),
    label: "seeker.generate",
    onLiveFailure: "fallback",
  });
  // Cross-check evidenceIds against the confirmedFacts we sent.
  const factIds = new Set(req.confirmedFacts.map((f) => f.id));
  const orphans = findOrphanEvidenceIds(result.data.resume, factIds);
  if (orphans.length > 0) {
    throw new ServiceError(
      "INVALID_AI_OUTPUT",
      `简历引用了不存在/未确认的事实ID：${orphans.join(", ")}`,
    );
  }
  return { data: result.data, mode: result.mode };
}
