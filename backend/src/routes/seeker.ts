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

// ─── 契约类型：事实（§3，SeekerFactsRequest/Response）───
type FactCategory = "education" | "project" | "internship" | "skill" | "activity" | "other";

interface Fact {
  id: string;
  category: FactCategory;
  statement: string;
  sourceQuestionId: string;
  sourceQuote: string;
  confirmed: boolean;
}

interface AnswerItem {
  questionId: string;
  answer: string;
}

// ─── MOCK：从用户回答派生事实（只用候选人原话，不虚构）───
function deriveCategory(hay: string): FactCategory {
  if (/学校|大学|学院|专业|课程|毕业|学位|GPA|绩点/.test(hay)) return "education";
  if (/实习|入职|公司|在职|工作经历/.test(hay)) return "internship";
  if (/项目|作品|开发|做过|搭建|实现|系统|网站|小程序|页面|app/i.test(hay)) return "project";
  if (/社团|学生会|志愿|比赛|活动|组织|团队|班长/.test(hay)) return "activity";
  if (/SQL|Excel|Python|剪辑|工具|技能|掌握|熟练|会用|了解/i.test(hay)) return "skill";
  return "other";
}

function deriveFacts(answers: AnswerItem[], questions: AIQuestion[]): Fact[] {
  const qById: Record<string, AIQuestion> = {};
  (questions || []).forEach((q: any) => {
    if (q && typeof q.id === "string" && q.id.trim()) qById[q.id] = q;
  });
  const out: Fact[] = [];
  let n = 0;
  for (const a of answers) {
    const ans = typeof a.answer === "string" ? a.answer.trim() : "";
    if (!ans) continue;
    n += 1;
    const q = qById[a.questionId];
    const qText = q && typeof q.text === "string" ? q.text : "";
    out.push({
      id: "f" + n,
      category: deriveCategory(ans + " " + qText),
      statement: ans.length > 120 ? ans.slice(0, 120) : ans,
      sourceQuestionId: typeof a.questionId === "string" ? a.questionId : "",
      sourceQuote: ans.length > 60 ? ans.slice(0, 60) : ans,
      confirmed: false,
    });
  }
  return out;
}

// ─── MOCK：派生「待补充信息」（基于岗位 mustHaves 与回答覆盖度，不虚构）───
function deriveMissingInformation(jobProfile: any, answers: AnswerItem[]): string[] {
  const out: string[] = [];
  const hay = (answers || []).map((a) => (typeof a.answer === "string" ? a.answer : "")).join(" ");
  const lower = hay.toLowerCase();
  const mentions = (kw: string) => {
    if (!kw) return false;
    return /[a-z]/i.test(kw) ? lower.includes(kw.toLowerCase()) : hay.includes(kw);
  };
  if (!/学校|大学|学院|专业|课程|毕业|学位|GPA|绩点/.test(hay)) {
    out.push("未提供教育背景（学校/专业/时间）");
  }
  if (!/实习|入职|公司|在职|工作经历/.test(hay)) {
    out.push("未提供实习或工作经历");
  }
  const mustHaves: string[] = jobProfile && Array.isArray(jobProfile.mustHaves) ? jobProfile.mustHaves : [];
  mustHaves.forEach((s: any) => {
    const skill = typeof s === "string" ? s.trim() : "";
    if (skill && !mentions(skill)) {
      out.push("未说明 " + skill + " 相关经验");
    }
  });
  if (out.length === 0) {
    out.push("未提供可量化的成果数据（如规模/比例/排名）");
  }
  return out;
}

// ─── POST /api/seeker/facts（SeekerFactsRequest/Response，mock）───
// 请求：{ jobProfile, questions, answers:[{questionId, answer}] }
// 校验：三者必填；questions 5~8 道且 id 不重复；answer.questionId 必须对应问题 id；
//       必答题必须有非空回答；同一问题不能重复回答。
seekerRouter.post("/facts", (req: Request, res: Response) => {
  const mode: APIMode = "mock";
  const body = req.body || {};
  const fieldErrors: Record<string, string[]> = {};

  // jobProfile 必填
  const jobProfile = body.jobProfile;
  if (!jobProfile || typeof jobProfile !== "object" || Array.isArray(jobProfile)) {
    fieldErrors.jobProfile = ["jobProfile 为必填项"];
  }

  // questions 必填 + 5~8 道 + id 不重复
  const questions = Array.isArray(body.questions) ? body.questions : null;
  if (!questions) {
    fieldErrors.questions = ["questions 为必填项"];
  } else {
    if (questions.length < 5 || questions.length > 8) {
      fieldErrors.questions = ["questions 数量必须为 5～8 道，当前 " + questions.length + " 道"];
    }
    const seenQ: Record<string, boolean> = {};
    const dupQ: string[] = [];
    questions.forEach((q: any, i: number) => {
      if (!q || typeof q.id !== "string" || !q.id.trim()) {
        fieldErrors["questions[" + i + "].id"] = ["问题缺少 id"];
      } else if (seenQ[q.id]) {
        if (!dupQ.includes(q.id)) dupQ.push(q.id);
      } else {
        seenQ[q.id] = true;
      }
    });
    if (dupQ.length) {
      fieldErrors.questions = (fieldErrors.questions || []).concat([
        "questions 中存在重复的 id：" + dupQ.join(", "),
      ]);
    }
  }

  // answers 必填 + questionId 必须对应问题 + 不重复回答
  const answers = Array.isArray(body.answers) ? body.answers : null;
  const validQIds: string[] = questions
    ? (questions as any[])
        .map((q) => (q && typeof q.id === "string" ? q.id : null))
        .filter((x): x is string => typeof x === "string")
    : [];
  if (!answers) {
    fieldErrors.answers = ["answers 为必填项"];
  } else {
    const seenA: Record<string, boolean> = {};
    answers.forEach((a: any, i: number) => {
      if (!a || typeof a.questionId !== "string" || !a.questionId.trim()) {
        fieldErrors["answers[" + i + "].questionId"] = ["回答缺少 questionId"];
        return;
      }
      if (validQIds.length && !validQIds.includes(a.questionId)) {
        fieldErrors["answers[" + i + "].questionId"] = ["questionId 不存在于问题列表：" + a.questionId];
      }
      if (seenA[a.questionId]) {
        fieldErrors["answers[" + i + "].questionId"] = ["同一问题被重复回答：" + a.questionId];
      } else {
        seenA[a.questionId] = true;
      }
    });
  }

  // 必答题必须有非空回答
  if (questions && answers) {
    const ansByQ: Record<string, string> = {};
    answers.forEach((a: any) => {
      if (a && typeof a.questionId === "string" && typeof a.answer === "string") {
        ansByQ[a.questionId] = a.answer;
      }
    });
    questions.forEach((q: any) => {
      if (q && q.required && typeof q.id === "string" && q.id.trim()) {
        const v = ansByQ[q.id];
        if (v === undefined || !String(v).trim()) {
          fieldErrors.answers = (fieldErrors.answers || []).concat([
            "必答题未作答：" + q.id + "（" + String(q.text || "").slice(0, 20) + "）",
          ]);
        }
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

  const facts = deriveFacts(answers as AnswerItem[], questions as AIQuestion[]);
  const missingInformation = deriveMissingInformation(jobProfile, answers as AnswerItem[]);
  res.json({ ok: true, data: { facts, missingInformation }, mode });
});

// ─── 契约类型：简历生成（SeekerGenerateRequest/Response）───
interface ResumeBullet { text: string; evidenceIds: string[]; }
interface ResumeExperience { name: string; role: string; period: string; bullets: ResumeBullet[]; }
interface ResumeObject {
  title: string;
  name: string;
  summary: ResumeBullet[];
  education: ResumeBullet[];
  experiences: ResumeExperience[];
  projects: any[];
  skills: ResumeBullet[];
  awards: ResumeBullet[];
  certifications: ResumeBullet[];
  languages: ResumeBullet[];
  selfEvaluation: string;
}
interface InterviewRisk { risk: string; relatedFactId: string; }

// ─── MOCK：从已确认事实派生简历（每条要点 evidenceIds 只引用本次事实）───
function deriveMockResume(jobProfile: any, confirmedFacts: Fact[]): ResumeObject {
  const ids = confirmedFacts.map((f) => f.id);
  const byCat: Record<FactCategory, Fact[]> = {
    education: [], internship: [], project: [], skill: [], activity: [], other: [],
  };
  confirmedFacts.forEach((f) => {
    (byCat[f.category] || byCat.other).push(f);
  });
  const jobTitle =
    jobProfile && typeof jobProfile.jobTitle === "string" && jobProfile.jobTitle
      ? jobProfile.jobTitle
      : "目标岗位";

  const summary: ResumeBullet[] = [
    {
      text: "求职 " + jobTitle + " 方向，具备以下相关经历与技能。",
      evidenceIds: ids.slice(0, Math.min(4, ids.length)),
    },
  ];
  const education: ResumeBullet[] = byCat.education.map((f) => ({
    text: f.statement,
    evidenceIds: [f.id],
  }));

  const expFacts = byCat.internship
    .concat(byCat.project)
    .concat(byCat.activity)
    .concat(byCat.other)
    .filter((f) => f.statement && f.statement.trim().length >= 3);
  const nameByCat: Record<string, string> = {
    internship: "工作经历",
    project: "项目经历",
    activity: "实践经历",
    other: "相关经历",
  };
  let counter = 0;
  const experiences: ResumeExperience[] = expFacts.map((f) => {
    counter += 1;
    return {
      name: (nameByCat[f.category] || "相关经历") + " " + counter,
      role: "参与者",
      period: "",
      bullets: [{ text: f.statement, evidenceIds: [f.id] }],
    };
  });

  const skills: ResumeBullet[] = byCat.skill.map((f) => ({
    text: f.statement,
    evidenceIds: [f.id],
  }));

  return {
    title: jobTitle + " · 简历",
    name: "候选人",
    summary,
    education,
    experiences,
    projects: [],
    skills,
    awards: [],
    certifications: [],
    languages: [],
    selfEvaluation:
      "基于已确认事实整理的 " + jobTitle + " 方向简历，各条目均可追溯至候选人原话。",
  };
}

// ─── MOCK：派生「待补充信息」（基于岗位 mustHaves 与事实覆盖度）───
function missingInfoFromHay(jobProfile: any, hay: string): string[] {
  const out: string[] = [];
  const lower = hay.toLowerCase();
  const mentions = (kw: string) =>
    !kw ? false : /[a-z]/i.test(kw) ? lower.includes(kw.toLowerCase()) : hay.includes(kw);
  if (!/学校|大学|学院|专业|课程|毕业|学位|GPA|绩点/.test(hay)) {
    out.push("未提供教育背景（学校/专业/时间）");
  }
  if (!/实习|入职|公司|在职|工作经历/.test(hay)) {
    out.push("未提供实习或工作经历");
  }
  const mustHaves: string[] =
    jobProfile && Array.isArray(jobProfile.mustHaves) ? jobProfile.mustHaves : [];
  mustHaves.forEach((s: any) => {
    const skill = typeof s === "string" ? s.trim() : "";
    if (skill && !mentions(skill)) out.push("未说明 " + skill + " 相关经验");
  });
  if (out.length === 0) out.push("未提供可量化的成果数据（如规模/比例/排名）");
  return out;
}

// ─── MOCK：派生面试追问风险（relatedFactId 只引用本次事实 id）───
function deriveMockInterviewRisks(
  jobProfile: any,
  resume: ResumeObject,
  missingInfo: string[]
): InterviewRisk[] {
  const risks: InterviewRisk[] = [];
  const expBullets: ResumeBullet[] = (resume.experiences || []).flatMap((e) => e.bullets || []);
  if (expBullets.length) {
    const evId = (expBullets[0].evidenceIds || [])[0] || "";
    risks.push({
      risk: "面试官可能追问「" + expBullets[0].text + "」的具体角色、时间跨度与量化成果",
      relatedFactId: evId,
    });
  }
  const mustHaves: string[] =
    jobProfile && Array.isArray(jobProfile.mustHaves) ? jobProfile.mustHaves : [];
  if (mustHaves.length) {
    risks.push({
      risk: "可能追问硬性要求 " + mustHaves.slice(0, 3).join("/") + " 的真实熟练度与使用场景",
      relatedFactId: "",
    });
  }
  if (missingInfo.length) {
    risks.push({
      risk: "简历缺少：" + missingInfo.slice(0, 2).join("；") + "，可能被追问补全",
      relatedFactId: "",
    });
  }
  if (!risks.length) {
    risks.push({ risk: "可能追问项目细节与团队协作经历", relatedFactId: "" });
  }
  return risks;
}

// ─── POST /api/seeker/generate（mock）───
// 请求：{ jobProfile, confirmedFacts: Fact[] }
// 响应：{ ok, data: { resume, missingInformation, interviewRisks }, mode }
// 简历每条要点的 evidenceIds 只引用 confirmedFacts 中的 id。
seekerRouter.post("/generate", (req: Request, res: Response) => {
  const mode: APIMode = "mock";
  const body = req.body || {};
  const fieldErrors: Record<string, string[]> = {};

  const jobProfile = body.jobProfile;
  if (!jobProfile || typeof jobProfile !== "object" || Array.isArray(jobProfile)) {
    fieldErrors.jobProfile = ["jobProfile 为必填项"];
  }

  const cf = Array.isArray(body.confirmedFacts) ? body.confirmedFacts : null;
  if (!cf || cf.length === 0) {
    fieldErrors.confirmedFacts = ["confirmedFacts 为必填项且不能为空"];
  } else {
    const idSet: Record<string, boolean> = {};
    cf.forEach((f: any, i: number) => {
      if (!f || typeof f.id !== "string" || !f.id.trim()) {
        fieldErrors["confirmedFacts[" + i + "].id"] = ["事实缺少 id"];
      } else if (idSet[f.id]) {
        fieldErrors["confirmedFacts[" + i + "].id"] = ["事实 id 重复：" + f.id];
      } else {
        idSet[f.id] = true;
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

  const validCats = ["education", "internship", "project", "skill", "activity", "other"];
  const confirmedFacts: Fact[] = (cf as any[]).map((f: any) => ({
    id: String(f.id),
    category: (validCats.indexOf(f.category) >= 0 ? f.category : "other") as FactCategory,
    statement: typeof f.statement === "string" ? f.statement : "",
    sourceQuestionId: typeof f.sourceQuestionId === "string" ? f.sourceQuestionId : "",
    sourceQuote: typeof f.sourceQuote === "string" ? f.sourceQuote : "",
    confirmed: true,
  }));

  const resume = deriveMockResume(jobProfile, confirmedFacts);
  const hay = confirmedFacts.map((f) => f.statement).join(" ");
  const missingInformation = missingInfoFromHay(jobProfile, hay);
  const interviewRisks = deriveMockInterviewRisks(jobProfile, resume, missingInformation);
  res.json({ ok: true, data: { resume, missingInformation, interviewRisks }, mode });
});
