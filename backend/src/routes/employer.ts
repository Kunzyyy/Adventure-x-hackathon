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
