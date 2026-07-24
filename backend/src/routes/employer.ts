// routes/employer.ts — 企业端契约接口
// MOCK 模式：不调用真实模型，按 roughRequirement 关键词派生岗位草稿 + RecruitmentKit。
// 规则：未经企业确认的薪资/福利/地点/到岗天数/硬性条件只能进入 uncertainties。
// 请求/响应均通过 contracts 层 zod schema 校验（对齐 main 分支 RecruitmentKit 正式结构）。

import { Router, Request, Response } from "express";
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
import type {
  APIMode,
  JobProfile,
  AIQuestion,
  EmployerAnalyzeData,
  RecruitmentKit,
  StandardizedJD,
  ScreeningDimension,
  InterviewQuestion,
  QuestionAnswer,
} from "../contracts/index.js";

export const employerRouter = Router();
const MODE: APIMode = "mock";

// ─── MOCK：关键词 → 技能 ───
const SKILL_BY_KEYWORD: Record<string, string> = {
  sql: "SQL", excel: "Excel", python: "Python",
  react: "React", vue: "Vue", typescript: "TypeScript", ts: "TypeScript",
  css: "CSS", html: "HTML",
  视频: "视频剪辑", 剪辑: "视频剪辑", 短视频: "视频剪辑", 抖音: "视频剪辑",
  小红书: "小红书运营", 运营: "内容运营",
  java: "Java", spring: "Spring", 接口: "接口开发", 数据库: "数据库",
};

interface EmpJobTemplate {
  responsibilities: string[];
  coreCompetencies: string[];
  expectedOutcomes: string[];
  keywords: string[];
}

const EMP_TEMPLATES: { match: RegExp; build: () => EmpJobTemplate }[] = [
  {
    match: /视频|剪辑|短视频|小红书|抖音|新媒体|内容运营/,
    build: () => ({
      responsibilities: ["制作短视频内容", "参与内容发布与运营", "跟踪内容数据并复盘"],
      coreCompetencies: ["视频剪辑", "内容运营", "数据复盘"],
      expectedOutcomes: ["按周完成内容产出并参与数据复盘"],
      keywords: ["视频剪辑", "内容运营", "小红书"],
    }),
  },
  {
    match: /react|vue|前端|组件|typescript|\bts\b|css|html|web/i,
    build: () => ({
      responsibilities: ["参与 Web 前端开发", "编写可复用组件", "配合后端联调接口"],
      coreCompetencies: ["前端框架", "组件开发", "接口联调"],
      expectedOutcomes: ["完成可上线的页面与组件"],
      keywords: ["React", "TypeScript", "组件开发"],
    }),
  },
  {
    match: /java|后端|服务端|spring|数据库|接口开发/,
    build: () => ({
      responsibilities: ["参与后端服务开发", "编写接口", "维护数据库"],
      coreCompetencies: ["后端框架", "接口开发", "数据库"],
      expectedOutcomes: ["完成可上线的接口与服务"],
      keywords: ["Java", "接口开发", "数据库"],
    }),
  },
  {
    match: /数据分析|sql|excel|指标分析|可视化|python|报表/,
    build: () => ({
      responsibilities: ["整理业务数据", "分析业务指标", "制作数据可视化"],
      coreCompetencies: ["数据清洗", "指标分析", "结果表达"],
      expectedOutcomes: ["形成可理解的业务分析结果"],
      keywords: ["SQL", "Excel", "数据分析"],
    }),
  },
];

// ─── MOCK：从 roughRequirement 派生岗位草稿 + 澄清问题 ───
// 注意：薪资/福利/地点/到岗天数/硬性条件均未确认 → uncertainties
function deriveEmployerProfile(jobTitle: string, roughRequirement: string): EmployerAnalyzeData {
  const req = roughRequirement || "";
  const lower = req.toLowerCase();

  const found: string[] = [];
  for (const kw of Object.keys(SKILL_BY_KEYWORD)) {
    const hay = /[a-z]/i.test(kw) ? lower : req;
    if (hay.includes(kw.toLowerCase())) {
      const skill = SKILL_BY_KEYWORD[kw];
      if (!found.includes(skill)) found.push(skill);
    }
  }

  let responsibilities = ["参与岗位相关工作"];
  let coreCompetencies = found.slice(0, 3);
  let expectedOutcomes: string[] = [];
  let keywords = found.slice(0, 5);
  for (const t of EMP_TEMPLATES) {
    if (t.match.test(req)) {
      const tpl = t.build();
      responsibilities = tpl.responsibilities;
      coreCompetencies = tpl.coreCompetencies;
      expectedOutcomes = tpl.expectedOutcomes;
      keywords = tpl.keywords;
      break;
    }
  }

  let employmentType: string | undefined;
  if (/实习/.test(req)) employmentType = "实习";
  else if (/兼职/.test(req)) employmentType = "兼职";
  else if (/全职/.test(req)) employmentType = "全职";

  const uncertainties: string[] = [
    "薪资范围未确认",
    "福利待遇未确认",
    "工作地点未确认",
    "每周到岗天数未确认",
  ];
  if (found.length > 0) {
    uncertainties.push("硬性技能要求未确认（识别到：" + found.join("、") + "）");
  } else {
    uncertainties.push("硬性技能要求未确认");
  }

  // 澄清问题（5 道）：eq_4 硬性技能为必答，其余选答
  const questions: AIQuestion[] = [
    { id: "eq_1", text: "这个岗位的薪资范围是多少？", reason: "确认薪资范围", answerType: "text", required: false },
    { id: "eq_2", text: "工作地点在哪里？是否支持远程？", reason: "确认工作地点", answerType: "text", required: false },
    { id: "eq_3", text: "每周需要到岗几天？", reason: "确认到岗要求", answerType: "number", required: false },
    {
      id: "eq_4",
      text: found.length > 0
        ? "哪些技能是硬性要求？（当前识别到：" + found.join("、") + "）"
        : "这个岗位有哪些硬性技能要求？",
      reason: "确认硬性条件（必答）",
      answerType: "text",
      required: true,
    },
    { id: "eq_5", text: "有哪些福利待遇？", reason: "确认福利", answerType: "text", required: false },
  ];

  return {
    jobProfile: {
      jobTitle: jobTitle || "目标岗位",
      employmentType,
      seniority: undefined,
      responsibilities,
      coreCompetencies,
      mustHaves: [],
      niceToHaves: [],
      expectedOutcomes,
      constraints: [],
      keywords,
      uncertainties,
    },
    questions,
  };
}

// ─── 歧视性词 / 录用淘汰决策词自检 ───
const DISCRIMINATION_PATTERNS: RegExp[] = [
  /性别/, /年龄|岁数/, /婚育|婚否|生育情况/, /籍贯|户籍|出生地/,
  /外貌|长相|相貌|身高|体重/, /民族|种族/, /宗教信仰/,
];
const DECISION_PATTERNS: RegExp[] = [
  /录用|淘汰|录取|不予录用|拒绝录用|建议录用|建议淘汰/,
];

function scanTexts(texts: string[]): { discrimination: string[]; decisions: string[] } {
  const discrimination: string[] = [];
  const decisions: string[] = [];
  for (const t of texts) {
    if (!t) continue;
    for (const re of DISCRIMINATION_PATTERNS) {
      const m = t.match(re);
      if (m && discrimination.indexOf(m[0]) < 0) discrimination.push(m[0]);
    }
    for (const re of DECISION_PATTERNS) {
      const m = t.match(re);
      if (m && decisions.indexOf(m[0]) < 0) decisions.push(m[0]);
    }
  }
  return { discrimination, decisions };
}

function removeFromUncertainties(arr: string[], re: RegExp): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (re.test(arr[i])) arr.splice(i, 1);
  }
}

// ─── MOCK：根据 answers 把 uncertainties 落实为正式岗位要求 ───
function deriveConfirmedJobProfile(
  jobTitle: string,
  jobProfile: JobProfile,
  answers: QuestionAnswer[],
): JobProfile {
  const ansMap: Record<string, string> = {};
  answers.forEach((a) => {
    if (a && typeof a.questionId === "string") {
      ansMap[a.questionId] = typeof a.answer === "string" ? a.answer.trim() : "";
    }
  });

  const mustHaves: string[] = Array.isArray(jobProfile.mustHaves) ? jobProfile.mustHaves.slice() : [];
  const niceToHaves: string[] = Array.isArray(jobProfile.niceToHaves) ? jobProfile.niceToHaves.slice() : [];
  const constraints: string[] = Array.isArray(jobProfile.constraints) ? jobProfile.constraints.slice() : [];
  const uncertainties: string[] = Array.isArray(jobProfile.uncertainties) ? jobProfile.uncertainties.slice() : [];

  const salary = ansMap["eq_1"];
  if (salary) {
    constraints.push("薪资范围：" + salary);
    removeFromUncertainties(uncertainties, /薪资范围未确认/);
  }
  const location = ansMap["eq_2"];
  if (location) {
    constraints.push("工作地点：" + location);
    removeFromUncertainties(uncertainties, /工作地点未确认/);
  }
  const attendance = ansMap["eq_3"];
  if (attendance) {
    constraints.push("每周到岗：" + attendance + " 天");
    removeFromUncertainties(uncertainties, /每周到岗天数未确认/);
  }
  const hardSkills = ansMap["eq_4"];
  if (hardSkills) {
    hardSkills.split(/[、,，/;\s]+/).filter((s) => s).forEach((s) => {
      if (mustHaves.indexOf(s) < 0) mustHaves.push(s);
    });
    removeFromUncertainties(uncertainties, /硬性技能要求未确认/);
  }
  const benefits = ansMap["eq_5"];
  if (benefits) {
    niceToHaves.push("福利：" + benefits);
    removeFromUncertainties(uncertainties, /福利待遇未确认/);
  }

  return {
    jobTitle: jobTitle || jobProfile.jobTitle || "目标岗位",
    employmentType: jobProfile.employmentType,
    seniority: jobProfile.seniority,
    responsibilities: Array.isArray(jobProfile.responsibilities) ? jobProfile.responsibilities : [],
    coreCompetencies: Array.isArray(jobProfile.coreCompetencies) ? jobProfile.coreCompetencies : [],
    mustHaves,
    niceToHaves,
    expectedOutcomes: Array.isArray(jobProfile.expectedOutcomes) ? jobProfile.expectedOutcomes : [],
    constraints,
    keywords: Array.isArray(jobProfile.keywords) ? jobProfile.keywords : [],
    uncertainties,
  };
}

// ─── MOCK：标准化 JD（RecruitmentKit.standardizedJD）───
function deriveStandardizedJD(jobTitle: string, p: JobProfile): StandardizedJD {
  const skills = Array.from(new Set((p.mustHaves || []).concat(p.coreCompetencies || []))).slice(0, 3);
  const resp = (p.responsibilities || []).length
    ? p.responsibilities
    : ["负责岗位日常核心工作，确保按时高质量交付"];
  const reqs = (p.mustHaves || []).length
    ? p.mustHaves.map((s) => "熟练掌握" + s)
    : ["具备岗位相关专业能力"];
  const nice = (p.niceToHaves || []).length ? p.niceToHaves : ["有相关行业经验"];
  const wc = (p.constraints || []).length ? p.constraints : ["工作条件待确认"];
  return {
    title: jobTitle || p.jobTitle || "目标岗位",
    summary:
      "我们正在寻找一位" +
      (jobTitle || p.jobTitle || "目标岗位") +
      "，负责" +
      ((p.responsibilities || [])[0] || "岗位相关工作") +
      "。理想候选人应具备" +
      (skills.length ? skills.join("、") : "相关专业能力") +
      "等能力。",
    responsibilities: resp,
    requirements: reqs,
    niceToHaves: nice,
    workingConditions: wc,
  };
}

// ─── MOCK：筛选维度及权重（正整数，总和=100，含 evidenceToLookFor）───
function deriveScreeningDimensions(p: JobProfile): ScreeningDimension[] {
  let comps = (p.coreCompetencies || []).slice(0, 4);
  if (comps.length < 3) {
    const fill = ["专业能力", "项目经验", "沟通协作", "学习潜力"];
    for (const f of fill) {
      if (comps.length >= 4) break;
      if (comps.indexOf(f) < 0) comps.push(f);
    }
  }
  const n = comps.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  const evidenceMap: Record<string, string[]> = {
    "专业能力": ["相关项目案例", "具体工具或方法的使用经验"],
    "项目经验": ["项目背景描述", "个人承担环节", "量化成果"],
    "沟通协作": ["跨角色协作案例", "冲突处理方式"],
    "学习潜力": ["自主学习案例", "新技术掌握经历"],
  };
  return comps.map((name, i) => ({
    name,
    weight: base + (i < remainder ? 1 : 0),
    description: name + "是本岗位的核心筛选维度",
    evidenceToLookFor: evidenceMap[name] || ["相关经历或作品", "可验证的具体细节"],
  }));
}

// ─── MOCK：面试题（严格 5 道，competency/purpose/strongAnswerSignals）───
function deriveInterviewQuestions(jobTitle: string, p: JobProfile): InterviewQuestion[] {
  const primary =
    (p.mustHaves || [])[0] ||
    (p.coreCompetencies || [])[0] ||
    "专业能力";
  return [
    {
      question: "请分享一个你运用" + primary + "完成的最满意的项目案例。",
      competency: "专业能力",
      purpose: "确认候选人真实的专业实践经验和承担环节。",
      strongAnswerSignals: ["清晰的项目背景", "具体的个人角色", "量化的成果"],
    },
    {
      question: "在" + jobTitle + "工作中，遇到过最棘手的问题是什么？怎么解决的？",
      competency: "问题解决",
      purpose: "观察分析思路和解决问题的能力。",
      strongAnswerSignals: ["描述问题背景", "分析思路清晰", "有最终结果"],
    },
    {
      question: "你如何保持对行业趋势的了解？",
      competency: "行业认知",
      purpose: "确认是否具备持续学习意识。",
      strongAnswerSignals: ["有具体关注渠道", "能说出行业趋势"],
    },
    {
      question: "当多个紧急任务同时出现时，你如何安排优先级？",
      competency: "时间管理",
      purpose: "观察优先级判断和取舍能力。",
      strongAnswerSignals: ["有判断标准", "能解释取舍逻辑"],
    },
    {
      question: "在团队协作中，如果你发现某个流程效率很低，你会怎么做？",
      competency: "主动性",
      purpose: "观察改进意识和推动力。",
      strongAnswerSignals: ["先调研原因", "提出可执行方案", "推动落地"],
    },
  ];
}

// ─── POST /api/employer/analyze ───
employerRouter.post("/analyze", (req: Request, res: Response) => {
  const v = validate(EmployerAnalyzeRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, MODE, v.status);

  const data = deriveEmployerProfile(v.value.jobTitle, v.value.roughRequirement);
  const checked = validateAi(EmployerAnalyzeDataSchema, data);
  if (!checked.ok) return sendError(res, checked.error, MODE, checked.status);
  sendOk(res, checked.value, MODE);
});

// ─── POST /api/employer/generate ───
employerRouter.post("/generate", (req: Request, res: Response) => {
  const v = validate(EmployerGenerateRequestSchema, req.body);
  if (!v.ok) return sendError(res, v.error, MODE, v.status);

  const { jobTitle, jobProfile, answers } = v.value;
  const confirmedProfile = deriveConfirmedJobProfile(jobTitle, jobProfile, answers);
  const standardizedJD = deriveStandardizedJD(jobTitle, confirmedProfile);
  const screeningDimensions = deriveScreeningDimensions(confirmedProfile);
  const interviewQuestions = deriveInterviewQuestions(jobTitle, confirmedProfile);

  // 业务自检：歧视性要求 / 录用淘汰决策
  const texts: string[] = [];
  texts.push(standardizedJD.title);
  texts.push(standardizedJD.summary);
  standardizedJD.responsibilities.forEach((s) => texts.push(s));
  standardizedJD.requirements.forEach((s) => texts.push(s));
  standardizedJD.niceToHaves.forEach((s) => texts.push(s));
  standardizedJD.workingConditions.forEach((s) => texts.push(s));
  screeningDimensions.forEach((d) => {
    texts.push(d.name);
    texts.push(d.description);
    d.evidenceToLookFor.forEach((s) => texts.push(s));
  });
  interviewQuestions.forEach((q) => {
    texts.push(q.question);
    texts.push(q.competency);
    texts.push(q.purpose);
    q.strongAnswerSignals.forEach((s) => texts.push(s));
    if (q.followUpQuestion) texts.push(q.followUpQuestion);
  });
  confirmedProfile.mustHaves.forEach((s) => texts.push(s));
  confirmedProfile.constraints.forEach((s) => texts.push(s));
  confirmedProfile.niceToHaves.forEach((s) => texts.push(s));

  const scan = scanTexts(texts);
  if (scan.discrimination.length > 0) {
    return sendError(
      res,
      apiError("INVALID_AI_OUTPUT", "生成内容含歧视性要求：" + scan.discrimination.join("、")),
      MODE,
    );
  }
  if (scan.decisions.length > 0) {
    return sendError(
      res,
      apiError("INVALID_AI_OUTPUT", "生成内容含录用/淘汰决策：" + scan.decisions.join("、")),
      MODE,
    );
  }

  const kit: RecruitmentKit = {
    jobProfile: confirmedProfile,
    standardizedJD,
    screeningDimensions,
    interviewQuestions,
  };

  // 契约校验：RecruitmentKitSchema（含权重正整数且总和=100、面试题严格 5 道）
  const checked = validateAi(RecruitmentKitSchema, kit);
  if (!checked.ok) return sendError(res, checked.error, MODE, checked.status);

  sendOk(res, checked.value, MODE);
});
