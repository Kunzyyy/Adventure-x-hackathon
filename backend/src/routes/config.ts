import { Router, Request, Response } from "express";
import { getCurrentConfig } from "../services/ai.js";
import fs from "fs";
import path from "path";

export const configRouter = Router();

const ENV_PATH = path.resolve(process.cwd(), ".env");

function readEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {};
  try {
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  } catch {}
  return vars;
}

function writeEnvFile(vars: Record<string, string>) {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf-8");
}

// GET current config (safe — hides full key)
configRouter.get("/", (_req: Request, res: Response) => {
  res.json(getCurrentConfig());
});

// PATCH update config
configRouter.patch("/", (req: Request, res: Response) => {
  const { provider, apiKey, baseURL, model } = req.body;

  // Read current .env
  const envVars = readEnvFile();

  if (provider !== undefined) envVars["AI_PROVIDER"] = String(provider);
  if (apiKey !== undefined && apiKey !== "") envVars["AI_API_KEY"] = String(apiKey);
  if (baseURL !== undefined) envVars["AI_BASE_URL"] = String(baseURL);
  if (model !== undefined) envVars["AI_MODEL"] = String(model);

  // Write back
  writeEnvFile(envVars);

  // Also update process.env in-memory (so current process picks it up immediately)
  if (provider !== undefined) process.env.AI_PROVIDER = String(provider);
  if (apiKey !== undefined && apiKey !== "") process.env.AI_API_KEY = String(apiKey);
  if (baseURL !== undefined) process.env.AI_BASE_URL = String(baseURL);
  if (model !== undefined) process.env.AI_MODEL = String(model);

  res.json({ ok: true, config: getCurrentConfig() });
});

// Preset quick-configs
configRouter.get("/presets", (_req: Request, res: Response) => {
  res.json({
    presets: [
      {
        id: "openai",
        name: "OpenAI",
        baseURL: "https://api.openai.com/v1",
        models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"],
        defaultModel: "gpt-4o-mini",
      },
      {
        id: "deepseek",
        name: "DeepSeek",
        baseURL: "https://api.deepseek.com",
        models: ["deepseek-chat", "deepseek-reasoner", "DeepseekV4Pro"],
        defaultModel: "deepseek-chat",
      },
      {
        id: "zhipu",
        name: "智谱 GLM",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        models: ["glm-4-flash", "glm-4-plus", "glm-4-air"],
        defaultModel: "glm-4-flash",
      },
      {
        id: "moonshot",
        name: "Moonshot (Kimi)",
        baseURL: "https://api.moonshot.cn/v1",
        models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        defaultModel: "moonshot-v1-8k",
      },
      {
        id: "qwen",
        name: "通义千问",
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        models: ["qwen-plus", "qwen-max", "qwen-turbo"],
        defaultModel: "qwen-plus",
      },
      {
        id: "custom",
        name: "自定义兼容 OpenAI API",
        baseURL: "https://your-api-endpoint.com/v1",
        models: [],
        defaultModel: "",
      },
    ],
  });
});
