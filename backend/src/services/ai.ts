import OpenAI from "openai";

// ─── Provider Configuration ──────────────────────────────────────

interface AiConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

function getConfig(): AiConfig {
  return {
    provider: process.env.AI_PROVIDER || "openai",
    apiKey: process.env.AI_API_KEY || "",
    baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };
}

function isMockKey(key: string): boolean {
  return !key || key === "sk-your-key-here" || key.length < 10;
}

function createClient(cfg: AiConfig): OpenAI | null {
  if (isMockKey(cfg.apiKey)) return null;
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 30000,
    maxRetries: 1,
  });
}

// ─── Resume Generation ────────────────────────────────────────────

interface ResumeInput {
  name: string;
  education: string;
  skills: string;
  experience: string;
  targetRole?: string;
}

export async function generateResume(data: ResumeInput) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockResume(data);

  const prompt = `你是一位资深HR兼职业顾问，请根据以下用户信息生成一份专业的中文简历。

用户信息：
姓名：${data.name}
教育背景：${data.education}
技能：${data.skills}
工作/项目经历：${data.experience}
${data.targetRole ? `目标岗位：${data.targetRole}` : ""}

请输出JSON格式：
{
  "optimizedResume": "优化后的简历全文（Markdown格式）",
  "starRewrite": "使用STAR法则重写的核心经历",
  "hrScore": 85,
  "suggestions": ["改进建议1", "改进建议2"],
  "matchedRoles": ["适合岗位1", "适合岗位2"]
}`;

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = res.choices[0].message.content || "{}";
  return JSON.parse(content);
}

function mockResume(data: ResumeInput) {
  return {
    optimizedResume: `# ${data.name} 的简历

## 教育背景
${data.education || "待补充"}

## 技能
${data.skills || "待补充"}

## 工作经历
${data.experience || "待补充"}

---
> 🤖 这是演示模式。配置 API 后可获得 AI 优化版本。`,
    starRewrite: `在${data.experience ? "工作" : "项目"}中，面对挑战，${data.name}利用${data.skills || "专业技能"}，成功交付了成果。`,
    hrScore: 78,
    suggestions: [
      "建议添加量化的成果数据（如提升了X%，减少了Y小时）",
      "可以在技能部分补充熟练程度（如 Python (熟练)、React (掌握)）",
      "教育背景中建议添加GPA或相关课程",
    ],
    matchedRoles: data.targetRole
      ? [data.targetRole, "高级" + data.targetRole]
      : ["前端开发工程师", "全栈开发工程师", "Python开发工程师"],
  };
}


// ─── Resume Polish / Refine ────────────────────────────────────────

export async function polishResume(
  resumeText: string,
  userInfo?: { name: string; education: string; skills: string; experience: string },
  targetRole?: string
) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockPolish(resumeText, userInfo);

  const prompt = `你是一位资深HR兼文案优化师。请深度优化以下简历内容，使其更具专业性和说服力。

优化要求：
1. 使用STAR法则重构经历描述（Situation-Task-Action-Result）
2. 添加量化数据（如果原文没有，请合理推断并标记为建议值）
3. 使用更有冲击力的动词（如"主导"替代"参与"，"设计"替代"写"）
4. 突出与${targetRole || "目标岗位"}相关的关键词
5. 保持原意，不编造不存在的经历

原始简历：
${resumeText}

${
  userInfo
    ? `用户背景（供上下文参考）：
姓名：${userInfo.name}
教育：${userInfo.education}
技能：${userInfo.skills}`
    : ""
}

请输出JSON格式：
{
  "optimizedResume": "优化后的简历全文（Markdown格式）",
  "changesSummary": "一句话总结做了哪些优化",
  "beforeAfter": {
    "before": "优化前片段（选取最需要改进的一句）",
    "after": "优化后版本"
  },
  "newScore": 88
}`;

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = res.choices[0].message.content || "{}";
  return JSON.parse(content);
}

function mockPolish(
  resumeText: string,
  userInfo?: { name: string; education: string; skills: string; experience: string }
) {
  const skills = userInfo?.skills?.split(",").map((s: string) => s.trim()).filter(Boolean) || [];
  const skillHighlights = skills.length > 0
    ? skills.map((s: string) => "**" + s + "**").join(" ")
    : "专业技能";

  const polished = resumeText
    .replace(/参与|做|写|负责/g, "主导并交付")
    .replace(/项目|产品|功能/g, "核心$&")
    .replace(/\n\n/g, "\n\n> 优化建议：可补充具体数据，如提升了X%");

  return {
    optimizedResume: polished,
    changesSummary: "已强化动词表达，突出" + skillHighlights + "等关键技能。",
    beforeAfter: {
      before: resumeText.slice(0, Math.min(80, resumeText.length)),
      after: polished.slice(0, Math.min(80, polished.length)),
    },
    newScore: 82,
  };
}

// ─── Job Matching ─────────────────────────────────────────────────

interface JobMatchInput {
  skills: string[];
  experience: string;
  education: string;
  preferredIndustry?: string;
  salaryExpectation?: string;
}

export async function matchJobs(profile: JobMatchInput) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockJobs(profile);

  const prompt = `你是一位资深职业匹配顾问。根据以下求职者画像，推荐5个最适合的岗位。

求职者信息：
${JSON.stringify(profile, null, 2)}

请输出JSON格式：
{
  "jobs": [
    {
      "title": "岗位名称",
      "company": "适合的公司类型",
      "matchScore": 92,
      "salaryRange": "15k-25k",
      "growthScore": 85,
      "stabilityScore": 80,
      "reason": "匹配理由"
    }
  ],
  "overallAnalysis": "整体分析"
}`;

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = res.choices[0].message.content || "{}";
  return JSON.parse(content);
}

function mockJobs(profile: JobMatchInput) {
  const primarySkill = profile.skills[0] || "技术";
  return {
    jobs: [
      {
        title: `${primarySkill}开发工程师`,
        company: "互联网科技公司",
        matchScore: 88,
        salaryRange: "15k-30k",
        growthScore: 85,
        stabilityScore: 75,
        reason: `你的${primarySkill}技能与岗位高度匹配`,
      },
      {
        title: `高级${primarySkill}工程师`,
        company: "中大型科技企业",
        matchScore: 82,
        salaryRange: "25k-45k",
        growthScore: 90,
        stabilityScore: 80,
        reason: "经验丰富，适合挑战更高难度项目",
      },
      {
        title: "技术顾问",
        company: "咨询公司",
        matchScore: 75,
        salaryRange: "20k-35k",
        growthScore: 80,
        stabilityScore: 70,
        reason: "综合能力适合咨询方向转型",
      },
    ],
    overallAnalysis: `基于你的${profile.skills.join("、")}技能组合，互联网行业和科技公司是最佳选择。`,
  };
}

// ─── Enterprise Match (Student Profile vs JD) ───────────────────

interface StudentProfile {
  name?: string;
  skills: string[];
  experience: string;
  education: string;
}

interface JobDescription {
  title: string;
  company: string;
  responsibilities: string[];
  requirements: string[];
  candidateProfile?: string;
}

export async function enterpriseMatch(student: StudentProfile, jd: JobDescription) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockEnterpriseMatch(student, jd);

  const prompt = `你是一位资深企业招聘顾问。请将学生求职者与岗位需求进行深度匹配分析。

【岗位信息】
公司: ${jd.company}
岗位: ${jd.title}
岗位职责:
${jd.responsibilities.map((r) => "- " + r).join("\n")}
任职要求:
${jd.requirements.map((r) => "- " + r).join("\n")}
${jd.candidateProfile ? "候选人画像: " + jd.candidateProfile : ""}

【学生信息】
技能: ${student.skills.join("、")}
${student.experience ? "经历: " + student.experience : ""}
${student.education ? "学历: " + student.education : ""}

请输出JSON格式，不要输出其他任何内容:
{
  "matchScore": 78,
  "dimensionScores": {
    "skillMatch": 80,
    "experienceMatch": 75,
    "educationMatch": 85,
    "cultureFit": 72
  },
  "strengths": [
    {"point": "匹配优势1", "detail": "详细说明"}
  ],
  "gaps": [
    {"point": "不足之处1", "detail": "详细说明"}
  ],
  "suggestions": [
    {"point": "提升建议1", "detail": "具体行动步骤"}
  ],
  "interviewQuestions": [
    {"round": "第一轮 · 基础能力", "questions": ["问题1", "问题2"]},
    {"round": "第二轮 · 项目深挖", "questions": ["问题1", "问题2"]},
    {"round": "第三轮 · 价值观匹配", "questions": ["问题1", "问题2"]}
  ],
  "overallSummary": "整体匹配分析总结，2-3句话",
  "salaryRecommendation": "建议薪资范围"
}`;

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = res.choices[0].message.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
    }
  }
  if (!parsed) throw new Error("AI 返回的内容无法解析为 JSON");
  return parsed;
}

function mockEnterpriseMatch(student: StudentProfile, jd: JobDescription) {
  const primarySkill = student.skills[0] || "相关技能";

  // Compute a realistic mock score based on skill overlap
  const jdKeywords = [
    ...jd.requirements.join(" ").toLowerCase().split(/\s+/),
    ...jd.responsibilities.join(" ").toLowerCase().split(/\s+/),
  ];
  const studentSkillsLower = student.skills.map((s) => s.toLowerCase());
  const overlapCount = studentSkillsLower.filter(
    (s) => jdKeywords.some((k) => k.includes(s) || s.includes(k))
  ).length;
  const baseScore = 55 + Math.min(overlapCount * 8, 40);

  return {
    matchScore: baseScore,
    dimensionScores: {
      skillMatch: baseScore - 2 + Math.floor(Math.random() * 5),
      experienceMatch: baseScore - 8 + Math.floor(Math.random() * 10),
      educationMatch: 75 + Math.floor(Math.random() * 15),
      cultureFit: 68 + Math.floor(Math.random() * 18),
    },
    strengths: [
      {
        point: `${primarySkill}技能与岗位需求匹配`,
        detail: `你的${primarySkill}背景与${jd.title}岗位的核心职责有较强的相关性。`,
      },
      {
        point: "项目经验体现协作能力",
        detail: student.experience
          ? `你在${student.experience.slice(0, 30)}...等方面的经验能够胜任跨部门协调工作。`
          : "你的项目经验展示了跨团队协作的潜力。",
      },
      {
        point: "学习能力强",
        detail: "能够快速适应新环境和新技术栈，这在快速变化的业务场景中非常重要。",
      },
    ],
    gaps: [
      { point: "缺少部分硬技能", detail: `建议补充${jd.requirements[0] || "岗位核心"}方面的实操经验。` },
      { point: "商业思维有待加强", detail: "建议更关注业务指标和商业逻辑，而非仅仅技术实现。" },
    ],
    suggestions: [
      { point: "学习相关技能", detail: `建议通过在线课程或实战项目补充${jd.requirements[0] || "核心技能"}。` },
      { point: "参与开源/实践项目", detail: "积累真实项目经验，用成果而非描述来证明能力。" },
      { point: "准备STAR面试案例", detail: "为每段经历准备Situation-Task-Action-Result的结构化案例。" },
    ],
    interviewQuestions: [
      {
        round: "第一轮 · 基础能力",
        questions: [
          `请分享一个你运用${primarySkill}解决实际问题的案例。`,
          `你对${jd.title}这个岗位的理解是什么？`,
        ],
      },
      {
        round: "第二轮 · 项目深挖",
        questions: [
          "在你过往的项目中，遇到的最大挑战是什么？你是如何克服的？",
          "如果项目上线后效果不达预期，你会采取什么措施？",
        ],
      },
      {
        round: "第三轮 · 价值观匹配",
        questions: [
          `你为什么想加入${jd.company}？你期望在这里获得什么？`,
          "描述一次你和团队成员产生分歧的经历，最终是如何解决的。",
        ],
      },
    ],
    overallSummary: `基于${student.skills.join("、")}的技能组合，该候选人与${jd.title}岗位整体匹配度约为${baseScore}%。优势在于${primarySkill}相关能力，建议针对性补充岗位所需的硬技能和商业思维。`,
    salaryRecommendation: "15k-25k（根据面试表现浮动）",
  };
}

// ─── Interview Coach ──────────────────────────────────────────────

interface InterviewMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const INTERVIEW_SYSTEM_PROMPT = `你是一位专业的AI面试官。你的职责是：
1. 模拟真实面试场景，根据用户的回答进行追问
2. 评估用户的回答质量（逻辑性、表达清晰度、结构化程度）
3. 在适当的时候给出建设性的反馈
4. 面试结束后给出0-100的综合评分

请始终保持专业、友善但略带挑战性的面试官风格。
在每次回复末尾，附上一个JSON评分块：
{"score": {"logic": 0-100, "expression": 0-100, "structure": 0-100}}`;

export async function interviewChat(
  history: InterviewMessage[],
  userMessage: string
) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockInterview(history, userMessage);

  const messages: InterviewMessage[] = [
    { role: "system", content: INTERVIEW_SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: messages as any,
    temperature: 0.8,
  });

  const reply = res.choices[0].message.content || "";

  let scores = null;
  const scoreMatch = reply.match(/\{"score":\s*\{[^}]+\}\}/);
  if (scoreMatch) {
    try {
      scores = JSON.parse(scoreMatch[0]).score;
    } catch {}
  }

  return { reply, scores };
}

function mockInterview(history: InterviewMessage[], _userMessage: string) {
  const conversationCount = history.filter((m) => m.role === "user").length;
  const mockReplies = [
    "很好的自我介绍！请分享一下你最有挑战性的一个项目经历。",
    "有意思。在这个项目中你遇到了什么具体的困难？你是如何解决的？",
    "如果让你重新做这个项目，你会有什么不同的做法？",
    "很好，你的回答很有条理。最后一个问题：你未来3年的职业规划是什么？",
    "非常好！感谢你的分享。面试结束。\n综合评分：逻辑清晰、表达流畅、结构完整。",
  ];

  const reply = mockReplies[Math.min(conversationCount, mockReplies.length - 1)];
  const isLast = conversationCount >= mockReplies.length - 1;

  return {
    reply,
    scores: isLast
      ? null
      : {
          logic: 75 + Math.floor(Math.random() * 20),
          expression: 70 + Math.floor(Math.random() * 25),
          structure: 72 + Math.floor(Math.random() * 22),
        },
  };
}

// ─── Config API (for frontend settings page) ──────────────────────

// ─── Full JD Generation (Enterprise-side) ─────────────────────────

/**
 * Generate a complete, structured JD from structured hiring inputs.
 * This is the enterprise-side counterpart to the student-side resume gen.
 */
export async function generateFullJD(rawInput: {
  company?: string;
  role: string;
  skills: string[];
  salaryRange: string;
  industry: string;
  notes?: string;
}) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockFullJD(rawInput);

  const skillList = rawInput.skills.length > 0
    ? rawInput.skills.join("、")
    : "根据行业和岗位自行推断所需核心技能";

  const prompt = `你是一位资深的招聘顾问和HR专家。请根据以下结构化信息，生成专业、标准化的岗位描述。

【企业输入】
公司：${rawInput.company || "未提供"}
岗位：${rawInput.role}
行业：${rawInput.industry}
所需技能：${skillList}
薪资范围：${rawInput.salaryRange || "面议"}
补充说明：${rawInput.notes || "无"}

请严格按照以下JSON格式输出，不要输出任何其他内容：
{
  "company": "公司名称",
  "role": "标准岗位名称",
  "standardJD": {
    "overview": "岗位概述，2-3句话，结合行业和技能描述",
    "responsibilities": ["职责1", "职责2", "职责3", "职责4", "职责5"],
    "requirements": ["要求1", "要求2", "要求3", "要求4"],
    "niceToHave": ["加分项1", "加分项2", "加分项3"]
  },
  "coreCompetencies": [
    {"name": "能力维度1", "weight": 25, "description": "为什么重要的一句话说明"},
    {"name": "能力维度2", "weight": 25, "description": "为什么重要的一句话说明"},
    {"name": "能力维度3", "weight": 20, "description": "为什么重要的一句话说明"},
    {"name": "能力维度4", "weight": 15, "description": "为什么重要的一句话说明"},
    {"name": "能力维度5", "weight": 15, "description": "为什么重要的一句话说明"}
  ],
  "mustHave": ["必须条件1", "必须条件2", "必须条件3"],
  "preferred": ["加分条件1", "加分条件2", "加分条件3"],
  "candidateProfile": "理想候选人一句话画像",
  "interviewQuestions": [
    {
      "question": "面试问题1（结合岗位和技能设计）",
      "dimension": "考察维度",
      "whatToLookFor": "关注点：什么是好答案，什么是差答案",
      "weight": "高/中/低"
    },
    {
      "question": "面试问题2",
      "dimension": "考察维度",
      "whatToLookFor": "关注点",
      "weight": "高/中/低"
    },
    {
      "question": "面试问题3",
      "dimension": "考察维度",
      "whatToLookFor": "关注点",
      "weight": "高/中/低"
    },
    {
      "question": "面试问题4",
      "dimension": "考察维度",
      "whatToLookFor": "关注点",
      "weight": "高/中/低"
    },
    {
      "question": "面试问题5",
      "dimension": "考察维度",
      "whatToLookFor": "关注点",
      "weight": "高/中/低"
    }
  ],
  "salaryReference": "基于市场数据的薪资参考范围"
}`;

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = res.choices[0].message.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
    }
  }
  if (!parsed) throw new Error("AI 返回的内容无法解析为 JSON");
  return parsed;
}

function mockFullJD(rawInput: {
  company?: string;
  role: string;
  skills: string[];
  salaryRange: string;
  industry: string;
  notes?: string;
}) {
  const role = rawInput.role;
  const company = rawInput.company || "您的公司";
  const skills = rawInput.skills.length > 0 ? rawInput.skills : ["专业技能", "沟通能力", "执行力"];
  const industry = rawInput.industry;

  // Build role-specific mock content
  const respByIndustry: Record<string, string[]> = {
    "互联网/科技": [
      `负责${role}的全流程工作，包括策略制定、执行落地和效果复盘`,
      `与产品、设计、研发等多团队协作，推动项目按时高质量交付`,
      `通过数据驱动的方法持续优化${role}相关指标`,
      `关注行业动态和竞品，输出有洞察的分析报告`,
      `制定并管理${role}相关标准流程和最佳实践`
    ],
    "电商/零售": [
      `负责${role}相关业务，包括选品策略、店铺运营和活动策划`,
      `分析销售数据和用户行为，优化商品展示和转化率`,
      `管理和维护商品信息，确保及时更新和准确展示`,
      `策划并执行线上促销活动，提升GMV和复购率`,
      `协同供应链、客服、市场团队，确保运营效率`
    ],
    "金融/银行": [
      `负责${role}相关工作，包括产品需求分析和方案设计`,
      `跟进监管政策变化，确保业务合规运营`,
      `与风控、法务、技术团队协作，推动产品安全上线`,
      `分析用户数据，优化产品体验和风险控制`,
      `撰写业务文档和数据分析报告`
    ],
    "教育/培训": [
      `负责${role}课程/内容的规划、设计和迭代`,
      `与教研、运营团队合作，提升学员体验和完课率`,
      `通过数据分析和用户反馈持续优化教学内容`,
      `探索新的教学模式和互动形式`,
      `维护与名师/KOL的合作关系`
    ]
  };

  const responsibilities = respByIndustry[industry] || respByIndustry["互联网/科技"];

  const reqByRole: Record<string, string[]> = {
    "运营": ["本科及以上学历", "1年以上互联网运营经验", "熟练使用Excel和数据分析工具", "具备良好的文案能力和沟通能力"],
    "产品经理": ["本科及以上学历", "2年以上产品经验", "熟练使用Axure/Figma等原型工具", "具备数据分析能力和用户洞察力"],
    "开发": ["本科及以上学历，计算机相关专业", "精通至少一门主流编程语言", "熟悉常用的开发框架和工具链", "有良好的代码规范和文档习惯"],
    "设计": ["本科及以上学历，设计相关专业", "精通Figma/Sketch/PS等设计工具", "有完整的设计作品集", "对用户体验有深入理解"],
    "营销": ["本科及以上学历，市场营销相关专业", "1年以上营销推广经验", "熟悉各社交媒体平台运营规则", "具备数据分析能力和创意思维"]
  };

  const roleKey = Object.keys(reqByRole).find(k => role.includes(k)) || "运营";
  const requirements = reqByRole[roleKey] || reqByRole["运营"];

  // Build skills-based competencies
  const primarySkill = skills[0] || "专业能力";
  const comps = skills.slice(0, 5);
  while (comps.length < 5) comps.push("综合能力");

  const competencyWeights = comps.length === 3 ? [40, 35, 25]
    : comps.length === 4 ? [30, 28, 22, 20]
    : [30, 25, 20, 15, 10];

  const coreCompetencies = comps.map((s, i) => ({
    name: s,
    weight: competencyWeights[i] || 15,
    description: `${s}是${role}岗位的核心能力要求，直接影响工作质量和效率。`
  }));

  return {
    company,
    role,
    standardJD: {
      overview: `我们是一家${industry}领域的公司，正在寻找一位${role}，负责${role}相关工作。理想候选人应具备${skills.slice(0,3).join("、")}等能力，薪资范围${rawInput.salaryRange || "面议"}。`,
      responsibilities,
      requirements,
      niceToHave: [`有${industry}行业经验`, `有${primarySkill}相关证书或作品集`, "能接受快节奏工作环境"]
    },
    coreCompetencies,
    mustHave: [`具备${primarySkill}能力`, "能全职工作", "有相关经验"],
    preferred: [`有${industry}行业背景`, "能长期稳定工作", "有出色的案例/作品"],
    candidateProfile: `具备${skills.slice(0,3).join("、")}等核心能力，${industry}行业背景优先，能快速融入团队并产出价值的${role}。`,
    interviewQuestions: [
      { question: `请分享一个你运用${primarySkill}完成的最满意的案例。`, dimension: "专业能力", whatToLookFor: "好答案：有清晰的项目背景、个人角色、具体行动和量化成果。差答案：描述模糊，只说团队做了什么。", weight: "高" },
      { question: `在${role}工作中，遇到过最棘手的问题是什么？怎么解决的？`, dimension: "问题解决能力", whatToLookFor: "好答案：描述问题背景、分析思路、尝试过的方案、最终结果。差答案：轻描淡写或归因于外部。", weight: "高" },
      { question: `你如何保持对${industry}行业趋势的了解？最近关注到什么新变化？`, dimension: "行业认知 + 学习能力", whatToLookFor: "好答案：有具体的关注渠道、能说出行业趋势、有自己的思考。差答案：泛泛而谈。", weight: "中" },
      { question: "当多个紧急任务同时出现时，你如何安排优先级？", dimension: "时间管理 + 抗压能力", whatToLookFor: "好答案：有判断标准、能解释取舍逻辑、会主动沟通预期。差答案：说都做或没有具体方法。", weight: "中" },
      { question: "在团队协作中，如果你发现某个流程效率很低，你会怎么做？", dimension: "主动性 + 协作能力", whatToLookFor: "好答案：先调研原因、提出改进方案、推动落地。差答案：抱怨或等着别人解决。", weight: "低" }
    ],
    salaryReference: rawInput.salaryRange ? `${rawInput.salaryRange}（${industry}行业参考范围）` : `面议（建议参考${industry}行业同类岗位）`
  };
}

// ─── Config API ────────────────────────────────────────────────────

export function getCurrentConfig() {
  const cfg = getConfig();
  return {
    provider: cfg.provider,
    baseURL: cfg.baseURL,
    model: cfg.model,
    hasKey: !isMockKey(cfg.apiKey),
    keyPreview: cfg.apiKey
      ? cfg.apiKey.slice(0, 8) + "..." + cfg.apiKey.slice(-4)
      : "",
  };
}

// ─── Template Resume Optimize (for resume-editor) ─────────────────

const TEMPLATE_SYSTEM_PROMPT = `你是一个专业的简历优化助手。请优化用户的简历内容，并严格按照以下JSON格式输出结果。

要求：
1. 只输出 JSON，不要输出任何其他文字、不要 markdown 代码块标记
2. 工作经历用 STAR 法则重写，量化成果（数字、百分比）
3. 技能按岗位相关性排序
4. 自我评价简洁有力，3-4 句话

JSON 格式：
{
  "name": "姓名",
  "title": "求职意向/目标岗位",
  "phone": "电话",
  "email": "邮箱",
  "location": "所在城市",
  "education": [
    {"school": "学校名", "major": "专业", "degree": "学历", "period": "时间段"}
  ],
  "experience": [
    {"company": "公司名", "role": "职位", "period": "时间段", "desc": "工作描述，用STAR法则，量化成果"}
  ],
  "skills": "技能1, 技能2, 技能3",
  "eval": "自我评价"
}`;

export async function templateOptimize(text: string) {
  const cfg = getConfig();
  const client = createClient(cfg);
  if (!client) return mockTemplateOptimize(text);

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [
      { role: "system", content: TEMPLATE_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0.7,
  });

  const content = res.choices[0].message.content || "{}";
  // Try to extract JSON from the response
  let parsed: any;
  try { parsed = JSON.parse(content); } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
    }
  }
  if (!parsed) throw new Error("AI 返回的内容无法解析为 JSON");

  return parsed;
}

function mockTemplateOptimize(text: string) {
  const lines = text.split('\n').filter((l: string) => l.trim());
  let name = "求职者", phone = "", email = "";
  for (const line of lines) {
    const phoneMatch = line.match(/1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/);
    if (phoneMatch) phone = phoneMatch[0];
    const emailMatch = line.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) email = emailMatch[0];
    const nameMatch = line.match(/[\u4e00-\u9fa5]{2,4}/);
    if (nameMatch && name === "求职者") name = nameMatch[0];
  }
  return {
    name,
    title: "个人简历",
    phone: phone || "未提供",
    email: email || "未提供",
    location: "未提供",
    education: [
      { school: "请补充学校", major: "请补充专业", degree: "本科", period: "" }
    ],
    experience: [
      { company: "请补充公司", role: "请补充职位", period: "", desc: "请补充工作描述" }
    ],
    skills: "请补充技能",
    eval: "🤖 这是演示模式。配置后端 API 后可获得 AI 优化版本。"
  };
}
