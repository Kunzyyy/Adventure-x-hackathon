// routes/seeker.ts — 求职者端契约接口（team-contract/API-CONTRACT.md）
// 当前为 MOCK 模式：不调用真实模型，返回按 JD 关键词派生的固定演示数据。
// 响应格式严格遵循契约 §4：{ ok, data, mode } / { ok, error, mode }。

import { Router, Request, Response } from "express";

export const seekerRouter = Router();

// ─── 契约类型（§3 共享 TypeScript 类型）───
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

interface SeekerAnalyzeData {
  jobProfile: JobProfile;
  questions: AIQuestion[];
}

// ─── MOCK：JD 关键词 → 岗位画像 + 问题（移植自团队参考实现）───
// 规则：mustHaves/questions 只取 JD 中真实出现或合理推断的词，不凭空编造。

const SKILL_BY_KEYWORD: Record<string, string> = {
  sql: "SQL", excel: "Excel", python: "Python",
  react: "React", vue: "Vue", typescript: "TypeScript", ts: "TypeScript",
  css: "CSS", html: "HTML",
  视频: "视频剪辑", 剪辑: "视频剪辑", 短视频: "视频剪辑", 抖音: "视频剪辑",
  小红书: "小红书运营", 运营: "内容运营",
  java: "Java", spring: "Spring", 接口: "接口开发", 数据库: "数据库",
};

interface JobTemplate {
  jobTitle: string;
  responsibilities: string[];
  coreCompetencies: string[];
  mustHaves: string[];
  niceToHaves: string[];
  expectedOutcomes: string[];
  keywords: string[];
  questions: AIQuestion[];
}

const TEMPLATES: { match: RegExp; build: (title: string) => JobTemplate }[] = [
  // 新媒体运营
  {
    match: /视频|剪辑|短视频|小红书|抖音|新媒体|内容运营/,
    build: (title) => ({
      jobTitle: title,
      responsibilities: ["制作短视频内容", "参与小红书内容发布", "跟踪内容数据并复盘"],
      coreCompetencies: ["视频剪辑", "内容运营", "数据复盘"],
      mustHaves: ["视频剪辑", "小红书运营", "内容策划"],
      niceToHaves: ["有抖音运营经验", "可长期实习"],
      expectedOutcomes: ["按周完成内容产出并参与数据复盘"],
      keywords: ["视频剪辑", "小红书", "内容运营"],
      questions: [
        { id: "sq_1", text: "你剪过什么视频？用什么工具剪的？", reason: "确认视频剪辑经验", answerType: "text", required: true },
        { id: "sq_2", text: "小红书做过什么内容？数据怎么样？", reason: "确认小红书运营经验", answerType: "text", required: true },
        { id: "sq_3", text: "内容选题一般怎么定的？", reason: "确认内容策划能力", answerType: "text", required: true },
        { id: "sq_4", text: "发布后会盯哪些数据？", reason: "确认数据复盘意识", answerType: "text", required: true },
        { id: "sq_5", text: "每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
      ],
    }),
  },
  // 前端开发
  {
    match: /react|vue|前端|组件|typescript|\bts\b|css|html|web/i,
    build: (title) => ({
      jobTitle: title,
      responsibilities: ["参与 Web 前端开发", "编写可复用组件", "配合后端联调接口"],
      coreCompetencies: ["前端框架", "组件开发", "接口联调"],
      mustHaves: ["React", "TypeScript", "组件开发"],
      niceToHaves: ["有 Vue 经验", "了解后端"],
      expectedOutcomes: ["完成可上线的页面与组件"],
      keywords: ["React", "TypeScript", "组件开发"],
      questions: [
        { id: "sq_1", text: "用过 React 做过什么项目？", reason: "确认 React 实操经验", answerType: "text", required: true },
        { id: "sq_2", text: "组件一般怎么拆的？", reason: "确认组件开发能力", answerType: "text", required: true },
        { id: "sq_3", text: "TypeScript 熟到什么程度？", reason: "确认 TS 熟练度", answerType: "text", required: true },
        { id: "sq_4", text: "调过后端接口吗？怎么联调的？", reason: "确认接口联调经验", answerType: "text", required: true },
        { id: "sq_5", text: "每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
      ],
    }),
  },
  // 后端开发 —— 必须排在“数据分析”之前，否则“数据库”里的“数据”会被数据分析抢先匹配
  {
    match: /java|后端|服务端|spring|数据库|接口开发/,
    build: (title) => ({
      jobTitle: title,
      responsibilities: ["参与后端服务开发", "编写接口", "维护数据库"],
      coreCompetencies: ["后端框架", "接口开发", "数据库"],
      mustHaves: ["Java", "接口开发", "数据库"],
      niceToHaves: ["有 Spring 经验", "了解分布式"],
      expectedOutcomes: ["完成可上线的接口与服务"],
      keywords: ["Java", "接口开发", "数据库"],
      questions: [
        { id: "sq_1", text: "用 Java 做过什么项目？", reason: "确认 Java 实操经验", answerType: "text", required: true },
        { id: "sq_2", text: "写过什么接口？怎么设计的？", reason: "确认接口开发能力", answerType: "text", required: true },
        { id: "sq_3", text: "数据库用过哪些？写过复杂查询吗？", reason: "确认数据库经验", answerType: "text", required: true },
        { id: "sq_4", text: "了解 Spring 吗？用到什么程度？", reason: "确认框架经验", answerType: "text", required: true },
        { id: "sq_5", text: "每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
      ],
    }),
  },
  // 数据分析
  {
    match: /数据分析|sql|excel|指标分析|可视化|python|报表/,
    build: (title) => ({
      jobTitle: title,
      responsibilities: ["整理业务数据", "分析业务指标", "制作数据可视化"],
      coreCompetencies: ["数据清洗", "指标分析", "结果表达"],
      mustHaves: ["SQL", "Excel", "指标分析"],
      niceToHaves: ["有 Python 经验", "会数据可视化"],
      expectedOutcomes: ["形成可理解的业务分析结果"],
      keywords: ["SQL", "Excel", "数据分析", "可视化"],
      questions: [
        { id: "sq_1", text: "你使用 Excel 清洗过哪些类型的数据？", reason: "确认数据清洗经验", answerType: "text", required: true },
        { id: "sq_2", text: "你是否在真实项目中使用过 SQL？请如实说明。", reason: "核实岗位必须技能", answerType: "text", required: true },
        { id: "sq_3", text: "你分析过哪些业务指标？", reason: "寻找指标分析证据", answerType: "text", required: true },
        { id: "sq_4", text: "你用什么方式展示过分析结果？", reason: "确认可视化与表达经验", answerType: "text", required: true },
        { id: "sq_5", text: "你每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
      ],
    }),
  },
];

/** 抽取 JD 第一句/第一行当 jobTitle（去掉“招聘”之类的引导词）。 */
function jdTitle(jdText: string): string {
  const firstLine =
    jdText
      .split(/[\n。；;.!！]/)
      .map((s) => s.trim())
      .find((s) => s.length >= 2) || "目标岗位";
  return (
    firstLine
      .replace(/^(招聘|招|诚聘|招募)\s*/u, "")
      .slice(0, 30)
      .trim() || "目标岗位"
  );
}

/** 从 JD 文本派生岗位画像 + 问题；认不出返回 null（让调用方用兜底）。 */
function deriveJobProfile(jdText: string): SeekerAnalyzeData | null {
  if (!jdText || !jdText.trim()) return null;
  const title = jdTitle(jdText);
  for (const t of TEMPLATES) {
    if (t.match.test(jdText)) {
      const tpl = t.build(title);
      return {
        jobProfile: {
          jobTitle: tpl.jobTitle,
          employmentType: "实习",
          seniority: "在校生",
          responsibilities: tpl.responsibilities,
          coreCompetencies: tpl.coreCompetencies,
          mustHaves: tpl.mustHaves,
          niceToHaves: tpl.niceToHaves,
          expectedOutcomes: tpl.expectedOutcomes,
          constraints: [],
          keywords: tpl.keywords,
          uncertainties: ["每周到岗天数未说明"],
        },
        questions: tpl.questions,
      };
    }
  }
  // 没匹配上任何类型：从 JD 里抠出现过的技能关键词当 mustHaves
  const found: string[] = [];
  const lower = jdText.toLowerCase();
  for (const kw of Object.keys(SKILL_BY_KEYWORD)) {
    const hay = /[a-z]/i.test(kw) ? lower : jdText;
    if (hay.includes(kw.toLowerCase())) {
      const skill = SKILL_BY_KEYWORD[kw];
      if (!found.includes(skill)) found.push(skill);
    }
  }
  if (found.length === 0) return null;
  return {
    jobProfile: {
      jobTitle: title,
      employmentType: "实习",
      seniority: "在校生",
      responsibilities: ["参与岗位相关工作"],
      coreCompetencies: found.slice(0, 3),
      mustHaves: found.slice(0, 3),
      niceToHaves: [],
      expectedOutcomes: [],
      constraints: [],
      keywords: found.slice(0, 5),
      uncertainties: ["每周到岗天数未说明"],
    },
    questions: [
      { id: "sq_1", text: `你在 ${found[0]} 方面做过什么？`, reason: "确认关键技能经验", answerType: "text", required: true },
      { id: "sq_2", text: "做过什么相关项目？承担什么角色？", reason: "确认项目经验", answerType: "text", required: true },
      { id: "sq_3", text: "用过哪些工具？熟到什么程度？", reason: "确认工具熟练度", answerType: "text", required: true },
      { id: "sq_4", text: "有什么可展示的成果？", reason: "确认可验证结果", answerType: "text", required: true },
      { id: "sq_5", text: "每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
    ],
  };
}

/** 兜底 fixture（契约 §5.1 示例数据），派生不出时使用。 */
const FALLBACK_DATA: SeekerAnalyzeData = {
  jobProfile: {
    jobTitle: "数据分析实习生",
    employmentType: "实习",
    seniority: "在校生",
    responsibilities: ["整理业务数据", "分析业务指标", "制作数据可视化"],
    coreCompetencies: ["数据清洗", "指标分析", "结果表达"],
    mustHaves: ["SQL", "Excel"],
    niceToHaves: [],
    expectedOutcomes: ["形成可理解的业务分析结果"],
    constraints: [],
    keywords: ["SQL", "Excel", "数据分析", "可视化"],
    uncertainties: ["每周到岗天数未说明"],
  },
  questions: [
    { id: "sq_1", text: "你使用 Excel 清洗过哪些类型的数据？", reason: "确认数据清洗经验", answerType: "text", required: true },
    { id: "sq_2", text: "你是否在真实项目中使用过 SQL？请如实说明。", reason: "核实岗位必须技能", answerType: "text", required: true },
    { id: "sq_3", text: "你分析过哪些业务指标？", reason: "寻找指标分析证据", answerType: "text", required: true },
    { id: "sq_4", text: "你用什么方式展示过分析结果？", reason: "确认可视化与表达经验", answerType: "text", required: true },
    { id: "sq_5", text: "你每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number", required: true },
  ],
};

// ─── POST /api/seeker/analyze ───
seekerRouter.post("/analyze", (req: Request, res: Response) => {
  const mode: APIMode = "mock";
  const body = req.body || {};

  // 校验（契约 §2：字符串先 trim；必填 trim 后不能为空；oldResume 可选但传入不能为空串）
  const jdText = typeof body.jdText === "string" ? body.jdText.trim() : "";
  const fieldErrors: Record<string, string[]> = {};
  if (!jdText) fieldErrors.jdText = ["请输入目标岗位JD"];
  if (body.oldResume !== undefined && (typeof body.oldResume !== "string" || !body.oldResume.trim())) {
    fieldErrors.oldResume = ["oldResume 传入时不能为空字符串"];
  }
  if (Object.keys(fieldErrors).length > 0) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_INPUT", message: "请求内容不完整", fieldErrors },
      mode,
    });
    return;
  }

  const data = deriveJobProfile(jdText) || FALLBACK_DATA;
  res.json({ ok: true, data, mode });
});
