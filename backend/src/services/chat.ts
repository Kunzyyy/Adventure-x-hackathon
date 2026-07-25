import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────

export type ModelProvider = "openai" | "deepseek" | "claude" | "custom";

export type ChatRole = "hr" | "interviewer" | "resume_expert" | "career_advisor" | "custom";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatConfig {
  provider: ModelProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  provider: ModelProvider;
  role: ChatRole;
  customSystemPrompt?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

// ─── Role System Prompts ──────────────────────────────────────────

const ROLE_PROMPTS: Record<ChatRole, string> = {
  hr: `你是一位拥有10年经验的资深HR专家。你在顶级科技公司（如Google、Apple）担任招聘负责人。
你的专长是：
1. 评估简历的质量和匹配度
2. 给出专业的简历优化建议
3. 分析候选人的优势和不足
4. 提供行业薪资和职业发展建议

请用专业、直接但不失友善的语气回复。每次给出建议时，尽量提供具体的例子。`,

  interviewer: `你是一位严格但公正的技术面试官。你在大型科技公司负责技术面试。
你的面试风格：
1. 从基础问题开始，逐步深入
2. 关注候选人的思考过程而非仅仅答案
3. 在回答后给出简短评价和改进建议
4. 模拟真实面试的压力感，但保持尊重

请根据候选人的回答进行追问，评估其技术深度和沟通能力。`,

  resume_expert: `你是一位专业的简历优化专家，曾帮助超过1000名求职者优化简历并获得面试机会。
你的专长：
1. 使用STAR法则重构经历描述
2. 添加量化数据增强说服力
3. 优化关键词以通过ATS筛选
4. 根据不同岗位定制简历版本

请对用户提供的简历内容进行深度分析和优化，给出具体的改写建议。`,

  career_advisor: `你是一位资深的职业规划顾问，拥有15年职业咨询经验。
你的专长：
1. 帮助用户明确职业方向
2. 分析行业趋势和机会
3. 制定短期和长期职业目标
4. 提供技能提升和转型建议

请以温暖、鼓励但专业的语气，帮助用户规划职业生涯。`,

  custom: `你是一位AI求职助手。请根据用户的需求提供帮助。`,
};

// ─── Provider Defaults ────────────────────────────────────────────

const PROVIDER_DEFAULTS: Record<ModelProvider, { baseURL: string; defaultModel: string }> = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  deepseek: {
    baseURL: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
  },
  claude: {
    baseURL: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  custom: {
    baseURL: "",
    defaultModel: "",
  },
};

// ─── Build Config from Request + Env ──────────────────────────────

function buildConfig(req: ChatRequest): ChatConfig {
  const defaults = PROVIDER_DEFAULTS[req.provider] || PROVIDER_DEFAULTS.openai;

  return {
    provider: req.provider,
    apiKey: req.apiKey || process.env.AI_API_KEY || "",
    baseURL: req.baseURL || process.env.AI_BASE_URL || defaults.baseURL,
    model: req.model || process.env.AI_MODEL || defaults.defaultModel,
  };
}

function getSystemPrompt(req: ChatRequest): string {
  if (req.role === "custom" && req.customSystemPrompt) {
    return req.customSystemPrompt;
  }
  return ROLE_PROMPTS[req.role] || ROLE_PROMPTS.career_advisor;
}

// ─── Streaming Chat ───────────────────────────────────────────────

export async function* streamChat(req: ChatRequest): AsyncGenerator<string> {
  const cfg = buildConfig(req);
  const systemPrompt = getSystemPrompt(req);

  // Build messages: system + last N history + new user message
  const MAX_HISTORY = 20; // Keep last 20 messages for context
  const recentHistory = req.history.slice(-MAX_HISTORY);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: req.message },
  ];

  // Create client
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 60000,
    maxRetries: 1,
  });

  // Try streaming first; fall back to non-streaming if model doesn't support it
  try {
    const stream = await client.chat.completions.create({
      model: cfg.model,
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  } catch (streamErr: any) {
    // Fallback to non-streaming
    if (streamErr?.status === 400 || streamErr?.message?.includes("stream")) {
      const res = await client.chat.completions.create({
        model: cfg.model,
        messages: messages as any,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
      });
      const fullText = res.choices?.[0]?.message?.content || "";
      // Simulate streaming by yielding in chunks
      const CHUNK_SIZE = 5;
      for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        yield fullText.slice(i, i + CHUNK_SIZE);
        await new Promise((r) => setTimeout(r, 30));
      }
    } else {
      throw streamErr;
    }
  }
}

// ─── Sync Chat (for compatibility) ────────────────────────────────

export async function chat(req: ChatRequest): Promise<string> {
  const cfg = buildConfig(req);
  const systemPrompt = getSystemPrompt(req);
  const recentHistory = req.history.slice(-20);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: req.message },
  ];

  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 60000,
    maxRetries: 1,
  });

  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return res.choices?.[0]?.message?.content || "";
}

// ─── Get Available Providers & Roles ──────────────────────────────

export function getProviders() {
  return [
    {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"],
      defaultModel: "gpt-4o-mini",
      baseURL: "https://api.openai.com/v1",
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      models: ["deepseek-v4-flash", "deepseek-v4-pro"],
      defaultModel: "deepseek-v4-flash",
      baseURL: "https://api.deepseek.com",
    },
    {
      id: "claude",
      name: "Claude (Anthropic)",
      models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
      defaultModel: "claude-3-5-sonnet-20241022",
      baseURL: "https://api.anthropic.com/v1",
    },
    {
      id: "custom",
      name: "自定义",
      models: [],
      defaultModel: "",
      baseURL: "",
    },
  ];
}

export function getRoles() {
  return [
    { id: "hr", name: "HR 专家", description: "简历评估、优化建议、行业薪资" },
    { id: "interviewer", name: "面试官", description: "模拟面试、技术追问、实时评分" },
    { id: "resume_expert", name: "简历优化师", description: "STAR法则、量化改写、ATS优化" },
    { id: "career_advisor", name: "职业规划师", description: "职业方向、行业趋势、技能规划" },
    { id: "custom", name: "自定义角色", description: "自定义系统提示词" },
  ];
}
