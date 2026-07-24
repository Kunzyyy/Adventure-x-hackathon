// mocks/employer.ts — deterministic mock behavior for employer endpoints.
//
// Mock mode must stay truthful: it never calls a model, but it still derives
// output from the employer's submitted role and confirmed answers instead of
// returning a fixed unrelated fixture.

import type {
  EmployerAnalyzeData,
  EmployerAnalyzeRequest,
  EmployerGenerateRequest,
  JobProfile,
  RecruitmentKit,
} from "../contracts/index.js";

const SKILLS: Array<[RegExp, string]> = [
  [/react/i, "React"],
  [/typescript|\bts\b/i, "TypeScript"],
  [/vue/i, "Vue"],
  [/前端|web/i, "前端开发"],
  [/java/i, "Java"],
  [/spring/i, "Spring"],
  [/后端|接口/, "后端开发"],
  [/sql/i, "SQL"],
  [/python/i, "Python"],
  [/excel/i, "Excel"],
  [/视频|剪辑|短视频/, "视频剪辑"],
  [/小红书/, "小红书运营"],
  [/运营/, "内容运营"],
];

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim())));
}

function inferRoleContent(jobTitle: string, roughRequirement: string) {
  const text = `${jobTitle}\n${roughRequirement}`;
  const detected = unique(
    SKILLS.filter(([pattern]) => pattern.test(text)).map(([, skill]) => skill),
  );

  if (/前端|react|vue|typescript|\bts\b|web/i.test(text)) {
    return {
      responsibilities: ["参与 Web 页面与组件开发", "配合后端完成接口联调", "维护响应式与可访问性体验"],
      competencies: unique([...detected, "组件开发", "接口联调"]).slice(0, 4),
      outcomes: ["交付可运行、可验收的页面功能"],
    };
  }
  if (/后端|java|spring|接口|数据库/i.test(text)) {
    return {
      responsibilities: ["参与后端服务与接口开发", "维护业务数据和错误处理", "配合前端完成联调"],
      competencies: unique([...detected, "接口开发", "数据处理"]).slice(0, 4),
      outcomes: ["交付稳定、可验证的业务接口"],
    };
  }
  if (/视频|剪辑|小红书|运营|内容/.test(text)) {
    return {
      responsibilities: ["制作并发布内容", "跟踪内容数据并参与复盘", "与团队协作推进选题"],
      competencies: unique([...detected, "内容策划", "数据复盘"]).slice(0, 4),
      outcomes: ["按约定节奏完成内容产出并复盘"],
    };
  }
  if (/数据|sql|python|excel|分析/i.test(text)) {
    return {
      responsibilities: ["整理业务数据", "分析关键指标", "输出可理解的分析结果"],
      competencies: unique([...detected, "数据清洗", "结果表达"]).slice(0, 4),
      outcomes: ["形成可以支持业务判断的数据结果"],
    };
  }
  return {
    responsibilities: ["参与岗位核心工作", "与团队协作完成交付", "跟踪结果并持续改进"],
    competencies: detected.length ? detected : ["岗位专业能力", "沟通协作", "结果复盘"],
    outcomes: ["完成岗位约定的核心工作结果"],
  };
}

export function employerAnalyzeMock(req: EmployerAnalyzeRequest): EmployerAnalyzeData {
  const inferred = inferRoleContent(req.jobTitle, req.roughRequirement);
  const employmentType = /实习/.test(`${req.jobTitle}${req.roughRequirement}`)
    ? "实习"
    : /兼职/.test(req.roughRequirement)
      ? "兼职"
      : /全职/.test(req.roughRequirement)
        ? "全职"
        : undefined;

  return {
    jobProfile: {
      jobTitle: req.jobTitle,
      employmentType,
      responsibilities: inferred.responsibilities,
      coreCompetencies: inferred.competencies,
      mustHaves: [],
      niceToHaves: [],
      expectedOutcomes: inferred.outcomes,
      constraints: [],
      keywords: inferred.competencies,
      uncertainties: [
        "薪资范围未确认",
        "工作地点未确认",
        "每周到岗天数未确认",
        "硬性技能要求未确认",
        "核心工作结果未确认",
      ],
    },
    questions: [
      { id: "eq_1", text: "这个岗位的薪资范围是多少？", reason: "确认薪资范围", answerType: "text", required: false },
      { id: "eq_2", text: "工作地点在哪里？是否支持远程？", reason: "确认工作地点", answerType: "text", required: false },
      { id: "eq_3", text: "每周至少需要到岗几天？", reason: "确认到岗要求", answerType: "number", required: false },
      { id: "eq_4", text: "哪些技能或经验是硬性要求？", reason: "确认硬性条件", answerType: "text", required: true },
      { id: "eq_5", text: "这个岗位最重要的工作结果是什么？", reason: "确认预期成果", answerType: "text", required: true },
    ],
  };
}

function removeUncertainty(profile: JobProfile, pattern: RegExp): void {
  profile.uncertainties = profile.uncertainties.filter((item) => !pattern.test(item));
}

function addUnique(target: string[], value: string): void {
  if (value && !target.includes(value)) target.push(value);
}

function answerMap(req: EmployerGenerateRequest): Map<string, string> {
  return new Map(req.answers.map((answer) => [answer.questionId, answer.answer.trim()]));
}

function confirmedProfile(req: EmployerGenerateRequest): JobProfile {
  const profile = structuredClone(req.jobProfile);
  profile.jobTitle = req.jobTitle;
  const answers = answerMap(req);

  for (const question of req.questions) {
    const answer = answers.get(question.id);
    if (!answer) continue;
    const meaning = `${question.text} ${question.reason}`;

    if (/薪资/.test(meaning)) {
      addUnique(profile.constraints, `薪资范围：${answer}`);
      removeUncertainty(profile, /薪资/);
    } else if (/地点|远程/.test(meaning)) {
      addUnique(profile.constraints, `工作地点：${answer}`);
      removeUncertainty(profile, /地点|远程/);
    } else if (/到岗.*天|每周.*天/.test(meaning)) {
      const normalized = /天/.test(answer) ? answer : `${answer}天`;
      addUnique(profile.mustHaves, `每周到岗${normalized}`);
      addUnique(profile.constraints, `每周到岗${normalized}`);
      removeUncertainty(profile, /到岗/);
    } else if (/期限|几个月|多久/.test(meaning)) {
      addUnique(profile.mustHaves, `可连续实习${answer}`);
      addUnique(profile.constraints, `连续实习${answer}`);
      removeUncertainty(profile, /期限|实习时长/);
    } else if (/硬性|必须.*技能|技能.*要求/.test(meaning)) {
      answer
        .split(/[、,，/；;\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => addUnique(profile.mustHaves, item));
      removeUncertainty(profile, /硬性技能|技能要求/);
    } else if (/结果|产出|目标/.test(meaning)) {
      addUnique(profile.expectedOutcomes, answer);
      removeUncertainty(profile, /结果|产出|目标/);
    } else if (/福利/.test(meaning)) {
      addUnique(profile.niceToHaves, `福利：${answer}`);
      removeUncertainty(profile, /福利/);
    } else {
      addUnique(profile.expectedOutcomes, answer);
    }
  }

  profile.mustHaves = unique(profile.mustHaves);
  profile.niceToHaves = unique(profile.niceToHaves);
  profile.expectedOutcomes = unique(profile.expectedOutcomes);
  profile.constraints = unique(profile.constraints);
  return profile;
}

function screeningDimensions(profile: JobProfile): RecruitmentKit["screeningDimensions"] {
  const names = unique([
    ...profile.coreCompetencies,
    "沟通协作",
    "学习与改进",
  ]).slice(0, 3);
  const base = Math.floor(100 / names.length);
  const remainder = 100 - base * names.length;
  return names.map((name, index) => ({
    name,
    weight: base + (index < remainder ? 1 : 0),
    description: `${name}是完成本岗位核心工作的参考维度。`,
    evidenceToLookFor: ["相关项目或作品", "本人承担的具体环节", "可以核实的工作结果"],
  }));
}

function interviewQuestions(
  jobTitle: string,
  profile: JobProfile,
): RecruitmentKit["interviewQuestions"] {
  const competencies = unique([
    ...profile.coreCompetencies,
    "问题解决",
    "沟通协作",
    "学习与改进",
    "工作安排",
  ]);
  const primary = competencies[0] || "岗位专业能力";
  const condition = profile.constraints[0] || "岗位工作安排";
  return [
    {
      question: `请分享一个你运用${primary}完成的真实项目或任务。`,
      competency: primary,
      purpose: "确认候选人的真实实践经验和个人承担环节。",
      strongAnswerSignals: ["背景清楚", "个人角色具体", "结果可以核实"],
    },
    {
      question: `在${jobTitle}相关工作中，你遇到过最棘手的问题是什么？`,
      competency: "问题解决",
      purpose: "观察分析问题和推进解决的方式。",
      strongAnswerSignals: ["说明限制条件", "解释判断过程", "复盘最终结果"],
    },
    {
      question: "当任务需要与不同角色协作时，你通常怎么推进？",
      competency: "沟通协作",
      purpose: "确认协作方式是否清晰、主动且可复盘。",
      strongAnswerSignals: ["主动同步边界", "记录关键决定", "及时暴露风险"],
    },
    {
      question: "请举例说明你如何学习并应用一个新的工具或方法。",
      competency: "学习与改进",
      purpose: "观察学习过程是否能落到真实工作。",
      strongAnswerSignals: ["有具体学习目标", "实际使用过", "能说明改进结果"],
    },
    {
      question: `请说明你如何满足这项已确认条件：${condition}。`,
      competency: "工作安排",
      purpose: "核实企业已经确认的必要工作条件。",
      strongAnswerSignals: ["安排具体", "如实说明冲突", "能够满足已确认条件"],
    },
  ];
}

export function employerGenerateMock(req: EmployerGenerateRequest): RecruitmentKit {
  const profile = confirmedProfile(req);
  const competencies = profile.coreCompetencies.length
    ? profile.coreCompetencies.join("、")
    : "岗位相关专业能力";
  return {
    jobProfile: profile,
    standardizedJD: {
      title: req.jobTitle,
      summary: `负责${profile.responsibilities[0] || "岗位核心工作"}，需要具备${competencies}。`,
      responsibilities: profile.responsibilities,
      requirements: profile.mustHaves,
      niceToHaves: profile.niceToHaves,
      workingConditions: profile.constraints,
    },
    screeningDimensions: screeningDimensions(profile),
    interviewQuestions: interviewQuestions(req.jobTitle, profile),
  };
}
