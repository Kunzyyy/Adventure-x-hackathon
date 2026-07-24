// routes/employer.ts — 企业端契约接口
// 当前为 MOCK 模式：不调用真实模型，按 roughRequirement 关键词派生岗位草稿 + 澄清问题。
// 规则：未经企业确认的薪资/福利/地点/到岗天数/硬性条件只能进入 uncertainties，
// 不能直接写成 mustHaves/constraints 等正式岗位要求。

import { Router, Request, Response } from "express";

export const employerRouter = Router();

// ─── 契约类型（与 seeker 端 JobProfile/AIQuestion 对齐）───
type APIMode = "live" | "mock" | "fallback";
type AnswerType = "text" | "number" | "choice";

interface JobProfile {
  jobTitle: string;
  employmentType?: string;
  seniority?: string;
  responsibilities: string[];
  coreCompetencies: string[];
  mustHaves: string[];
  niceToHaves: string[];
  expectedOutcomes: string[];
  constraints: string[];
  keywords: string[];
  uncertainties: string[];
}

interface AIQuestion {
  id: string;
  text: string;
  reason: string;
  answerType: AnswerType;
  required: boolean;
  options?: string[];
}

interface EmployerAnalyzeData {
  jobProfile: JobProfile;
  questions: AIQuestion[];
}

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

  // 检测技能关键词（仅用于 keywords/coreCompetencies 描述，不进 mustHaves）
  const found: string[] = [];
  for (const kw of Object.keys(SKILL_BY_KEYWORD)) {
    const hay = /[a-z]/i.test(kw) ? lower : req;
    if (hay.includes(kw.toLowerCase())) {
      const skill = SKILL_BY_KEYWORD[kw];
      if (!found.includes(skill)) found.push(skill);
    }
  }

  // 匹配岗位模板
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

  // 用工类型（明确提及才设）
  let employmentType: string | undefined;
  if (/实习/.test(req)) employmentType = "实习";
  else if (/兼职/.test(req)) employmentType = "兼职";
  else if (/全职/.test(req)) employmentType = "全职";

  // 不确定项：未经企业确认的 5 类信息 → uncertainties
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

  // 澄清问题（5 道），让企业确认上述不确定项
  const questions: AIQuestion[] = [
    { id: "eq_1", text: "这个岗位的薪资范围是多少？", reason: "确认薪资范围", answerType: "text", required: false },
    { id: "eq_2", text: "工作地点在哪里？是否支持远程？", reason: "确认工作地点", answerType: "text", required: false },
    { id: "eq_3", text: "每周需要到岗几天？", reason: "确认到岗要求", answerType: "number", required: false },
    {
      id: "eq_4",
      text: found.length > 0
        ? "哪些技能是硬性要求？（当前识别到：" + found.join("、") + "）"
        : "这个岗位有哪些硬性技能要求？",
      reason: "确认硬性条件",
      answerType: "text",
      required: false,
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
      mustHaves: [],        // 硬性条件未确认，留空
      niceToHaves: [],      // 加分项未确认，留空
      expectedOutcomes,
      constraints: [],      // 约束条件（地点/到岗）未确认，留空
      keywords,
      uncertainties,
    },
    questions,
  };
}

// ─── POST /api/employer/analyze ───
employerRouter.post("/analyze", (req: Request, res: Response) => {
  const mode: APIMode = "mock";
  const body = req.body || {};

  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
  const roughRequirement =
    typeof body.roughRequirement === "string" ? body.roughRequirement.trim() : "";
  const fieldErrors: Record<string, string[]> = {};
  if (!jobTitle) fieldErrors.jobTitle = ["请输入岗位名称"];
  if (!roughRequirement) fieldErrors.roughRequirement = ["请输入模糊招聘要求"];
  if (Object.keys(fieldErrors).length > 0) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_INPUT", message: "请求内容不完整", fieldErrors },
      mode,
    });
    return;
  }

  const data = deriveEmployerProfile(jobTitle, roughRequirement);
  res.json({ ok: true, data, mode });
});

// ─── 契约类型：企业端生成（EmployerGenerateRequest/Response）───
interface AnswerItem { questionId: string; answer: string; }

interface ScreeningDimension {
  name: string;
  weight: number;
  description: string;
}

interface InterviewQuestionItem {
  question: string;
  dimension: string;
  whatToLookFor: string;
  weight: string;
}

interface StandardJD {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
}

interface EmployerGenerateData {
  jobProfile: JobProfile;
  standardJD: StandardJD;
  screeningDimensions: ScreeningDimension[];
  interviewQuestions: InterviewQuestionItem[];
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
  jobProfile: any,
  answers: AnswerItem[]
): JobProfile {
  const ansMap: Record<string, string> = {};
  answers.forEach((a) => {
    if (a && typeof a.questionId === "string") {
      ansMap[a.questionId] = typeof a.answer === "string" ? a.answer.trim() : "";
    }
  });

  const base = jobProfile && typeof jobProfile === "object" ? jobProfile : {};
  const mustHaves: string[] = Array.isArray(base.mustHaves) ? base.mustHaves.slice() : [];
  const niceToHaves: string[] = Array.isArray(base.niceToHaves) ? base.niceToHaves.slice() : [];
  const constraints: string[] = Array.isArray(base.constraints) ? base.constraints.slice() : [];
  const uncertainties: string[] = Array.isArray(base.uncertainties) ? base.uncertainties.slice() : [];

  // 按 clarify 问题 id 落实（eq_1 薪资 / eq_2 地点 / eq_3 到岗 / eq_4 硬性技能 / eq_5 福利）
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
    jobTitle: jobTitle || base.jobTitle || "目标岗位",
    employmentType: base.employmentType,
    seniority: base.seniority,
    responsibilities: Array.isArray(base.responsibilities) ? base.responsibilities : [],
    coreCompetencies: Array.isArray(base.coreCompetencies) ? base.coreCompetencies : [],
    mustHaves,
    niceToHaves,
    expectedOutcomes: Array.isArray(base.expectedOutcomes) ? base.expectedOutcomes : [],
    constraints,
    keywords: Array.isArray(base.keywords) ? base.keywords : [],
    uncertainties,
  };
}

function deriveStandardJD(jobTitle: string, jobProfile: JobProfile): StandardJD {
  const p = jobProfile;
  const skills = Array.from(new Set((p.mustHaves || []).concat(p.coreCompetencies || []))).slice(0, 3);
  const resp = (p.responsibilities || []).length
    ? p.responsibilities
    : ["负责岗位日常核心工作，确保按时高质量交付"];
  const reqs = (p.mustHaves || []).length
    ? p.mustHaves.map((s) => "熟练掌握" + s)
    : ["具备岗位相关专业能力"];
  const nice = (p.niceToHaves || []).length ? p.niceToHaves : ["有相关行业经验"];
  return {
    overview:
      "我们正在寻找一位" +
      jobTitle +
      "，负责" +
      ((p.responsibilities || [])[0] || "岗位相关工作") +
      "。理想候选人应具备" +
      (skills.length ? skills.join("、") : "相关专业能力") +
      "等能力。",
    responsibilities: resp,
    requirements: reqs,
    niceToHave: nice,
  };
}

// ─── MOCK：筛选维度及权重（正整数，总和严格=100）───
function deriveScreeningDimensions(jobProfile: JobProfile): ScreeningDimension[] {
  let comps = (jobProfile.coreCompetencies || []).slice(0, 4);
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
  return comps.map((name, i) => ({
    name,
    weight: base + (i < remainder ? 1 : 0),
    description: name + "是本岗位的核心筛选维度",
  }));
}

// ─── MOCK：面试题（严格 5 道）───
function deriveInterviewQuestions(jobTitle: string, jobProfile: JobProfile): InterviewQuestionItem[] {
  const primary =
    (jobProfile.mustHaves || [])[0] ||
    (jobProfile.coreCompetencies || [])[0] ||
    "专业能力";
  return [
    {
      question: "请分享一个你运用" + primary + "完成的最满意的项目案例。",
      dimension: "专业能力",
      whatToLookFor: "好答案：清晰的项目背景、个人角色、具体行动和量化成果。差答案：描述模糊。",
      weight: "高",
    },
    {
      question: "在" + jobTitle + "工作中，遇到过最棘手的问题是什么？怎么解决的？",
      dimension: "问题解决",
      whatToLookFor: "好答案：描述问题背景、分析思路、尝试方案、最终结果。差答案：归因于外部。",
      weight: "高",
    },
    {
      question: "你如何保持对行业趋势的了解？",
      dimension: "行业认知",
      whatToLookFor: "好答案：有具体关注渠道、能说出行业趋势。差答案：泛泛而谈。",
      weight: "中",
    },
    {
      question: "当多个紧急任务同时出现时，你如何安排优先级？",
      dimension: "时间管理",
      whatToLookFor: "好答案：有判断标准、能解释取舍逻辑。差答案：没有具体方法。",
      weight: "中",
    },
    {
      question: "在团队协作中，如果你发现某个流程效率很低，你会怎么做？",
      dimension: "主动性",
      whatToLookFor: "好答案：先调研原因、提出方案、推动落地。差答案：抱怨或等着别人解决。",
      weight: "低",
    },
  ];
}

// ─── POST /api/employer/generate ───
employerRouter.post("/generate", (req: Request, res: Response) => {
  const mode: APIMode = "mock";
  const body = req.body || {};
  const fieldErrors: Record<string, string[]> = {};

  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
  const roughRequirement =
    typeof body.roughRequirement === "string" ? body.roughRequirement.trim() : "";
  if (!jobTitle) fieldErrors.jobTitle = ["请输入岗位名称"];
  if (!roughRequirement) fieldErrors.roughRequirement = ["请输入模糊招聘要求"];

  const jobProfile = body.jobProfile;
  if (!jobProfile || typeof jobProfile !== "object" || Array.isArray(jobProfile)) {
    fieldErrors.jobProfile = ["jobProfile 为必填项"];
  }

  const questions = Array.isArray(body.questions) ? body.questions : null;
  if (!questions || questions.length === 0) {
    fieldErrors.questions = ["questions 为必填项且不能为空"];
  } else {
    const qIdSet: Record<string, boolean> = {};
    questions.forEach((q: any, i: number) => {
      if (!q || typeof q.id !== "string" || !q.id.trim()) {
        fieldErrors["questions[" + i + "].id"] = ["问题缺少 id"];
      } else if (qIdSet[q.id]) {
        fieldErrors["questions[" + i + "].id"] = ["问题 id 重复：" + q.id];
      } else {
        qIdSet[q.id] = true;
      }
    });
  }

  const answers = Array.isArray(body.answers) ? body.answers : null;
  if (!answers || answers.length === 0) {
    fieldErrors.answers = ["answers 为必填项且不能为空"];
  } else {
    const qIdLookup: Record<string, boolean> = {};
    (questions || []).forEach((q: any) => {
      if (q && typeof q.id === "string") qIdLookup[q.id] = true;
    });
    const aIdSet: Record<string, boolean> = {};
    answers.forEach((a: any, i: number) => {
      const path = "answers[" + i + "]";
      if (!a || typeof a.questionId !== "string" || !a.questionId.trim()) {
        fieldErrors[path + ".questionId"] = ["answer 缺少 questionId"];
      } else if (!qIdLookup[a.questionId]) {
        fieldErrors[path + ".questionId"] = ["questionId 不存在：" + a.questionId];
      } else if (aIdSet[a.questionId]) {
        fieldErrors[path + ".questionId"] = ["questionId 重复：" + a.questionId];
      } else {
        aIdSet[a.questionId] = true;
      }
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_INPUT", message: "请求内容不完整", fieldErrors },
      mode,
    });
    return;
  }

  const confirmedProfile = deriveConfirmedJobProfile(
    jobTitle,
    jobProfile,
    answers as AnswerItem[]
  );
  const standardJD = deriveStandardJD(jobTitle, confirmedProfile);
  const screeningDimensions = deriveScreeningDimensions(confirmedProfile);
  const interviewQuestions = deriveInterviewQuestions(jobTitle, confirmedProfile);

  // 自检：歧视性要求 / 录用淘汰决策
  const texts: string[] = [];
  texts.push(standardJD.overview);
  standardJD.responsibilities.forEach((s) => texts.push(s));
  standardJD.requirements.forEach((s) => texts.push(s));
  standardJD.niceToHave.forEach((s) => texts.push(s));
  screeningDimensions.forEach((d) => {
    texts.push(d.name);
    texts.push(d.description);
  });
  interviewQuestions.forEach((q) => {
    texts.push(q.question);
    texts.push(q.dimension);
  });
  confirmedProfile.mustHaves.forEach((s) => texts.push(s));
  confirmedProfile.constraints.forEach((s) => texts.push(s));
  confirmedProfile.niceToHaves.forEach((s) => texts.push(s));
  const scan = scanTexts(texts);
  if (scan.discrimination.length > 0) {
    res.status(500).json({
      ok: false,
      error: {
        code: "DISCRIMINATION_DETECTED",
        message: "生成内容含歧视性要求：" + scan.discrimination.join("、"),
      },
      mode,
    });
    return;
  }
  if (scan.decisions.length > 0) {
    res.status(500).json({
      ok: false,
      error: {
        code: "DECISION_DETECTED",
        message: "生成内容含录用/淘汰决策：" + scan.decisions.join("、"),
      },
      mode,
    });
    return;
  }

  // 自检：筛选权重正整数且总和=100
  const weightSum = screeningDimensions.reduce((acc, d) => acc + d.weight, 0);
  const badWeights = screeningDimensions.filter((d) => !Number.isInteger(d.weight) || d.weight <= 0);
  if (badWeights.length > 0 || weightSum !== 100) {
    res.status(500).json({
      ok: false,
      error: {
        code: "WEIGHT_INVALID",
        message: "筛选权重必须为正整数且总和=100，当前总和=" + weightSum,
      },
      mode,
    });
    return;
  }

  // 自检：面试题严格 5 道
  if (interviewQuestions.length !== 5) {
    res.status(500).json({
      ok: false,
      error: {
        code: "INTERVIEW_COUNT_INVALID",
        message: "面试题必须为 5 道，当前=" + interviewQuestions.length,
      },
      mode,
    });
    return;
  }

  res.json({
    ok: true,
    data: { jobProfile: confirmedProfile, standardJD, screeningDimensions, interviewQuestions },
    mode,
  });
});
