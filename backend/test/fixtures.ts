// test/fixtures.ts
// Canonical examples lifted from team-contract/API-CONTRACT.md, used both as
// the seed data for MOCK responses (Task 2) and as the "legal examples must
// pass" suite for the contract tests (Task 1).

import type {
  CandidateFact,
  JobProfile,
  SeekerAnalyzeData,
  SeekerFactsData,
  SeekerGenerateData,
  EmployerAnalyzeData,
  RecruitmentKit,
} from "../src/contracts/index.js";

// ─── jobProfile from the seeker analyze example ───
export const SEEKER_JOB_PROFILE: JobProfile = {
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
};

export const SEEKER_QUESTIONS = [
  { id: "sq_1", text: "你使用Excel清洗过哪些类型的数据？", reason: "确认数据清洗经验", answerType: "text" as const, required: true },
  { id: "sq_2", text: "你是否在真实项目中使用过SQL？请如实说明。", reason: "核实岗位必须技能", answerType: "text" as const, required: true },
  { id: "sq_3", text: "你分析过哪些业务指标？", reason: "寻找指标分析证据", answerType: "text" as const, required: true },
  { id: "sq_4", text: "你用什么方式展示过分析结果？", reason: "确认可视化与表达经验", answerType: "text" as const, required: true },
  { id: "sq_5", text: "你每周可以到岗几天？", reason: "补充实习可用时间", answerType: "number" as const, required: true },
];

export const SEEKER_ANSWERS = [
  { questionId: "sq_1", answer: "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。" },
  { questionId: "sq_2", answer: "只在课程作业里写过基础查询，没有实际项目经验。" },
  { questionId: "sq_3", answer: "比较过每周销售额和不同品类销量。" },
  { questionId: "sq_4", answer: "用Excel柱状图向小组展示。" },
  { questionId: "sq_5", answer: "4" },
];

export const SEEKER_FACTS: CandidateFact[] = [
  {
    id: "fact_1",
    category: "project",
    statement: "使用Excel对便利店一个学期的销售明细进行去重和日期格式统一。",
    sourceQuestionId: "sq_1",
    sourceQuote: "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。",
    confirmed: false,
  },
  {
    id: "fact_2",
    category: "skill",
    statement: "在课程作业中使用过SQL基础查询，暂无实际项目经验。",
    sourceQuestionId: "sq_2",
    sourceQuote: "只在课程作业里写过基础查询，没有实际项目经验。",
    confirmed: false,
  },
];

export const SEEKER_MISSING_INFORMATION = ["尚无真实项目中的SQL使用证据"];

export const SEEKER_FACTS_DATA: SeekerFactsData = {
  facts: SEEKER_FACTS,
  missingInformation: SEEKER_MISSING_INFORMATION,
};

export const SEEKER_ANALYZE_DATA: SeekerAnalyzeData = {
  jobProfile: SEEKER_JOB_PROFILE,
  questions: SEEKER_QUESTIONS,
};

// Confirmed facts used to exercise seeker/generate (the contract's example).
export const SEEKER_CONFIRMED_FACTS: CandidateFact[] = SEEKER_FACTS.map((f) => ({
  ...f,
  confirmed: true,
}));

export const SEEKER_GENERATE_DATA: SeekerGenerateData = {
  resume: {
    title: "数据分析实习生方向简历",
    summary: [
      {
        text: "具备Excel数据清洗实践，并在课程中使用过SQL基础查询。",
        evidenceIds: ["fact_1", "fact_2"],
      },
    ],
    education: [],
    experiences: [
      {
        name: "校园便利店销售数据分析",
        bullets: [
          {
            text: "使用Excel对一个学期的销售明细进行去重和日期格式统一。",
            evidenceIds: ["fact_1"],
          },
        ],
      },
    ],
    skills: [
      {
        text: "Excel数据清洗；SQL基础查询（课程作业）",
        evidenceIds: ["fact_1", "fact_2"],
      },
    ],
  },
  missingInformation: ["缺少真实项目中的SQL使用证据"],
  interviewRisks: ["面试官可能追问SQL查询的具体课程任务"],
};

// ─── employer fixtures (from API-CONTRACT.md employer examples) ───
export const EMPLOYER_JOB_PROFILE: JobProfile = {
  jobTitle: "新媒体运营实习生",
  employmentType: "实习",
  responsibilities: ["制作短视频内容", "参与小红书内容发布"],
  coreCompetencies: ["视频剪辑", "内容运营"],
  mustHaves: ["具备基础视频剪辑能力"],
  niceToHaves: ["有小红书内容经验", "可长期实习"],
  expectedOutcomes: [],
  constraints: [],
  keywords: ["视频剪辑", "小红书", "内容运营"],
  uncertainties: ["每周到岗天数未确认", "实习期限未确认", "内容产出目标未确认"],
};

export const EMPLOYER_QUESTIONS = [
  { id: "eq_1", text: "每周至少需要到岗几天？", reason: "明确实习时间要求", answerType: "number" as const, required: true },
  { id: "eq_2", text: "最低实习期限是多少？", reason: "明确长期实习的具体含义", answerType: "choice" as const, required: true, options: ["3个月", "6个月", "其他"] },
  { id: "eq_3", text: "该岗位最重要的内容产出结果是什么？", reason: "明确岗位预期成果", answerType: "text" as const, required: true },
];

export const EMPLOYER_ANSWERS = [
  { questionId: "eq_1", answer: "4" },
  { questionId: "eq_2", answer: "6个月" },
  { questionId: "eq_3", answer: "每周完成短视频和小红书图文内容，并根据数据复盘。" },
];

export const EMPLOYER_ANALYZE_DATA: EmployerAnalyzeData = {
  jobProfile: EMPLOYER_JOB_PROFILE,
  questions: EMPLOYER_QUESTIONS,
};

export const EMPLOYER_RECRUITMENT_KIT: RecruitmentKit = {
  jobProfile: {
    jobTitle: "新媒体运营实习生",
    employmentType: "实习",
    responsibilities: ["制作短视频和小红书图文内容", "跟踪内容数据并参与复盘"],
    coreCompetencies: ["视频剪辑", "内容策划", "数据复盘"],
    mustHaves: ["具备基础视频剪辑能力", "每周到岗4天", "可连续实习6个月"],
    niceToHaves: ["有小红书内容经验"],
    expectedOutcomes: ["按周完成内容产出并参与数据复盘"],
    constraints: ["每周到岗4天", "连续实习6个月"],
    keywords: ["视频剪辑", "小红书", "内容运营", "数据复盘"],
    uncertainties: [],
  },
  standardizedJD: {
    title: "新媒体运营实习生",
    summary: "参与短视频和小红书内容制作，并结合内容数据进行复盘。",
    responsibilities: ["制作短视频和小红书图文内容", "跟踪内容数据并参与复盘"],
    requirements: ["具备基础视频剪辑能力", "每周到岗4天", "可连续实习6个月"],
    niceToHaves: ["有小红书内容经验"],
    workingConditions: ["实习期限6个月", "每周到岗4天"],
  },
  screeningDimensions: [
    {
      name: "视频剪辑基础",
      weight: 40,
      description: "能够完成岗位所需的基础视频制作。",
      evidenceToLookFor: ["剪辑作品", "使用过的剪辑工具", "本人承担的制作环节"],
    },
    {
      name: "内容策划与表达",
      weight: 35,
      description: "能够围绕目标用户组织图文或短视频内容。",
      evidenceToLookFor: ["内容案例", "选题思路", "文案或脚本"],
    },
    {
      name: "数据复盘意识",
      weight: 25,
      description: "能够根据内容数据总结问题并提出调整方向。",
      evidenceToLookFor: ["关注的内容指标", "复盘案例", "根据数据做出的调整"],
    },
  ],
  interviewQuestions: [
    {
      question: "请介绍一个你参与制作的短视频。",
      competency: "视频剪辑",
      purpose: "确认候选人的真实制作经验和承担环节。",
      strongAnswerSignals: ["说明具体职责", "展示作品或过程", "不夸大个人贡献"],
    },
    {
      question: "你会怎样为一个新账号规划第一周的小红书内容？",
      competency: "内容策划",
      purpose: "观察选题和内容组织能力。",
      strongAnswerSignals: ["明确目标用户", "给出选题依据", "考虑内容形式"],
    },
    {
      question: "发布内容后你会重点关注哪些数据？",
      competency: "数据复盘",
      purpose: "确认是否具备基本的数据意识。",
      strongAnswerSignals: ["指标与目标对应", "能够解释指标意义", "提出后续调整"],
    },
    {
      question: "遇到素材不足但临近发布时间时，你会怎么处理？",
      competency: "执行与协作",
      purpose: "观察时间压力下的沟通和执行方式。",
      strongAnswerSignals: ["及时沟通风险", "提出可执行替代方案", "不牺牲基本质量"],
    },
    {
      question: "请说明你未来6个月的到岗安排。",
      competency: "实习稳定性",
      purpose: "核实已明确的到岗要求。",
      strongAnswerSignals: ["时间安排具体", "能够满足每周4天", "如实说明可能冲突"],
    },
  ],
};
