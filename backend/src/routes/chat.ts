import { Router, Request, Response } from "express";
import { streamChat, chat, getProviders, getRoles } from "../services/chat.js";
import { searchKnowledgeBase, isHighConfidence } from "../services/kb.js";

export const chatRouter = Router();

// ─── GET /api/chat/providers ─────────────────────────────────────
chatRouter.get("/providers", (_req: Request, res: Response) => {
  res.json({ providers: getProviders() });
});

// ─── GET /api/chat/roles ─────────────────────────────────────────
chatRouter.get("/roles", (_req: Request, res: Response) => {
  res.json({ roles: getRoles() });
});

// ─── GET /api/chat/kb-stats ───────────────────────────────────────
chatRouter.get("/kb-stats", (_req: Request, res: Response) => {
  const { getKBStats } = require("../services/kb.js");
  res.json(getKBStats());
});

// ─── POST /api/chat/stream (SSE) ─────────────────────────────────
chatRouter.post("/stream", async (req: Request, res: Response) => {
  try {
    const { message, history, provider, role, customSystemPrompt, model, apiKey, baseURL } = req.body;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // ─── Knowledge Base Check ──────────────────────────────────
    const kbMatch = searchKnowledgeBase(message);
    if (kbMatch) {
      if (isHighConfidence(kbMatch.score)) {
        // High confidence → return KB answer directly
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        res.write(`data: ${JSON.stringify({ type: "start", source: "knowledge_base" })}\n\n`);

        const answer = kbMatch.entry.answer;
        // Simulate streaming for smooth UX
        const CHUNK_SIZE = 3;
        for (let i = 0; i < answer.length; i += CHUNK_SIZE) {
          res.write(`data: ${JSON.stringify({ type: "chunk", content: answer.slice(i, i + CHUNK_SIZE) })}\n\n`);
          await new Promise((r) => setTimeout(r, 20));
        }

        res.write(`data: ${JSON.stringify({ type: "done", fullText: answer, source: "knowledge_base" })}\n\n`);
        res.end();
        return;
      }
      // Low confidence → augment AI prompt with KB context
      const kbContext = `\n\n[系统知识库参考] 以下内容来自平台知识库，仅供参考：\n问：${kbMatch.entry.question}\n答：${kbMatch.entry.answer}\n`;
      req.body.message = message + kbContext;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const chatReq = {
      message: req.body.message,
      history: history || [],
      provider: provider || "deepseek",
      role: role || "career_advisor",
      customSystemPrompt,
      model,
      apiKey,
      baseURL,
    };

    res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    const gen = streamChat(chatReq);
    let fullText = "";

    try {
      for await (const chunk of gen) {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      }

      res.write(
        `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
      );
    } catch (streamErr: any) {
      console.error("Stream error:", streamErr.message);
      res.write(
        `data: ${JSON.stringify({ type: "error", error: streamErr.message || "Stream failed" })}\n\n`
      );
    }

    res.end();
  } catch (err: any) {
    console.error("Chat stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed", detail: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      res.end();
    }
  }
});

// ─── POST /api/chat (sync, for simple use) ───────────────────────
chatRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { message, history, provider, role, customSystemPrompt, model, apiKey, baseURL } = req.body;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // ─── Knowledge Base Check ──────────────────────────────────
    const kbMatch = searchKnowledgeBase(message);
    if (kbMatch) {
      if (isHighConfidence(kbMatch.score)) {
        // High confidence → return KB answer directly
        res.json({
          reply: kbMatch.entry.answer,
          source: "knowledge_base",
          matchedQuestion: kbMatch.entry.question,
          score: kbMatch.score,
        });
        return;
      }
      // Low confidence → augment with KB context
      const kbContext = `\n\n[系统知识库参考] 以下内容来自平台知识库，仅供参考：\n问：${kbMatch.entry.question}\n答：${kbMatch.entry.answer}\n`;
      req.body.message = message + kbContext;
    }

    const result = await chat({
      message: req.body.message,
      history: history || [],
      provider: provider || "deepseek",
      role: role || "career_advisor",
      customSystemPrompt,
      model,
      apiKey,
      baseURL,
    });

    res.json({
      reply: result,
      source: kbMatch ? "ai_with_kb_context" : "ai",
      ...(kbMatch ? { matchedQuestion: kbMatch.entry.question, score: kbMatch.score } : {}),
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed", detail: err.message });
  }
});
