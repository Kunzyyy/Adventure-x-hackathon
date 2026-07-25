// services/employer.ts — employer-pipeline business logic.

import type {
  EmployerAnalyzeRequest,
  EmployerAnalyzeData,
  EmployerGenerateRequest,
  RecruitmentKit,
  APIMode,
} from "../contracts/index.js";
import { EmployerAnalyzeDataSchema, RecruitmentKitSchema } from "../contracts/index.js";
import { callStructured } from "../llm/index.js";
import { employerAnalyzeMock, employerGenerateMock } from "../mocks/employer.js";
import { ServiceError } from "./errors.js";

export interface ServiceOutcome<T> {
  data: T;
  mode: APIMode;
}


// ────────────────────────── output shapes ──────────────────────────
// 显式喂给模型的契约结构，防止 live 模型自造键名（见 services/seeker.ts 同名说明）。

const JOB_PROFILE_SHAPE = `{
    "jobTitle": "岗位名称",
    "employmentType": "全职/实习（可省略）",
    "seniority": "级别（可省略）",
    "responsibilities": ["岗位职责"],
    "coreCompetencies": ["核心能力"],
    "mustHaves": ["硬性要求"],
    "niceToHaves": ["加分项"],
    "expectedOutcomes": ["预期成果"],
    "constraints": ["约束条件"],
    "keywords": ["关键词"],
    "uncertainties": ["不确定项"]
  }`;

const ANALYZE_SHAPE = `{
  "jobProfile": ${JOB_PROFILE_SHAPE},
  "questions": [
    {"id": "eq_1", "text": "问题内容", "reason": "提问原因", "answerType": "text", "required": true},
    {"id": "eq_2", "text": "选择题示例", "reason": "提问原因", "answerType": "choice", "required": false, "options": ["选项A", "选项B"]}
  ]
}`;

const KIT_SHAPE = `{
  "jobProfile": ${JOB_PROFILE_SHAPE},
  "standardizedJD": {"title": "岗位名", "summary": "一句话概述", "responsibilities": ["职责"], "requirements": ["必须条件"], "niceToHaves": ["加分条件"], "workingConditions": ["工作条件"]},
  "screeningDimensions": [{"name": "维度名", "weight": 40, "description": "说明", "evidenceToLookFor": ["证据线索"]}],
  "interviewQuestions": [{"question": "面试问题", "competency": "考察能力", "purpose": "目的", "strongAnswerSignals": ["优秀回答信号"], "followUpQuestion": "可选追问"}]
}`;

const ANALYZE_SYSTEM = `你是企业招聘需求解析助手。任务：把模糊招聘需求整理成初步岗位画像，并提出3—5道补充问题。
规则：
- 只把企业明确表达的内容写入JobProfile；含糊条件放入uncertainties。
- 不自行补写薪资、福利、地点、学历、年限或硬性条件。
- 生成3—5道问题，优先询问岗位性质、到岗天数、实习期限、必须能力、经验要求、工作结果和必要工作条件。
- 问题id形如 eq_1..eq_N，唯一；choice题options合法；reason清楚。
- 不生成性别、年龄、婚育、籍贯、外貌等歧视性条件或问题。
- 所有JobProfile数组必须存在，没有内容用[]。`;

export async function employerAnalyze(req: EmployerAnalyzeRequest): Promise<ServiceOutcome<EmployerAnalyzeData>> {
  const blocks = [
    "岗位名称：\n" + req.jobTitle,
    "模糊招聘需求：\n" + req.roughRequirement,
  ];
  const result = await callStructured({
    schema: EmployerAnalyzeDataSchema,
    system: ANALYZE_SYSTEM,
    userBlocks: blocks,
    maxTokens: 4000,
    mockFn: employerAnalyzeMock,
    label: "employer.analyze",
    outputShape: ANALYZE_SHAPE,
    onLiveFailure: "fallback",
  });
  return { data: result.data, mode: result.mode };
}

const GENERATE_SYSTEM = `你是企业招聘材料生成助手。任务：把原始需求和补充回答合并，生成可编辑的标准招聘材料。
规则：
- 只把已确认信息写入最终JobProfile；不凭空补写公司、薪资、福利、地点和工作条件。
- standardizedJD含title/summary/responsibilities/requirements/niceToHaves/workingConditions。
- 清楚区分必须条件与加分条件，不擅自提高门槛。
- screeningDimensions至少一项，每项含name/weight/description/evidenceToLookFor；weight为正整数，总和严格等于100。
- interviewQuestions严格5道，每题含question/competency/purpose/strongAnswerSignals(可选followUpQuestion)。
- 围绕岗位工作和可验证证据，不询问隐私或无关个人特征。
- 不生成性别、年龄、婚育、籍贯、外貌等歧视性标准。
- 不输出自动录用、淘汰、候选人排名或匹配分数。筛选维度只是人工参考。`;

// Discriminatory terms that must never appear in employer material.
const DISCRIMINATION_TERMS = [
  "性别",
  "男",
  "女",
  "年龄",
  "婚育",
  "婚",
  "育",
  "籍贯",
  "户籍",
  "户口",
  "外貌",
  "长相",
  "身高",
  "相貌",
];

const AUTO_DECISION_TERMS = ["录用", "淘汰", "排名", "评分", "匹配分数", "自动筛选", "决定录用"];

export async function employerGenerate(req: EmployerGenerateRequest): Promise<ServiceOutcome<RecruitmentKit>> {
  const blocks = [
    "原始需求：\n" + req.roughRequirement,
    "岗位名称：\n" + req.jobTitle,
    "初步岗位画像：\n" + JSON.stringify(req.jobProfile),
    "补充问题：\n" + JSON.stringify(req.questions),
    "企业回答：\n" + JSON.stringify(req.answers),
  ];
  const result = await callStructured({
    schema: RecruitmentKitSchema,
    system: GENERATE_SYSTEM,
    userBlocks: blocks,
    maxTokens: 6000,
    mockFn: employerGenerateMock,
    label: "employer.generate",
    outputShape: KIT_SHAPE,
    onLiveFailure: "fallback",
  });
  // Semantic safety nets the schema can't express:
  checkNoDiscrimination(result.data);
  checkNoAutoDecision(result.data);
  return { data: result.data, mode: result.mode };
}

/** Reject any discriminatory condition leaking into the kit. */
export function checkNoDiscrimination(kit: RecruitmentKit): void {
  const blob = JSON.stringify(kit);
  const hit = DISCRIMINATION_TERMS.find((t) => blob.includes(t));
  if (hit) {
    throw new ServiceError(
      "INVALID_AI_OUTPUT",
      `招聘材料包含歧视性条件：${hit}`,
    );
  }
}

/** Reject any auto hire/reject/rank language. */
export function checkNoAutoDecision(kit: RecruitmentKit): void {
  const blob = JSON.stringify(kit);
  const hit = AUTO_DECISION_TERMS.find((t) => blob.includes(t));
  if (hit) {
    throw new ServiceError(
      "INVALID_AI_OUTPUT",
      `招聘材料包含自动录用/淘汰/排名结论：${hit}`,
    );
  }
}

// Re-export schema for tests that want to validate mock/live shapes.
export { RecruitmentKitSchema };
