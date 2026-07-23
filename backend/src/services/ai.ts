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
