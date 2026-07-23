import { Router, Request, Response } from "express";
import { streamChat, chat, getProviders, getRoles } from "../services/chat.js";

export const chatRouter = Router();

// ─── GET /api/chat/providers ─────────────────────────────────────
chatRouter.get("/providers", (_req: Request, res: Response) => {
  res.json({ providers: getProviders() });
});

// ─── GET /api/chat/roles ─────────────────────────────────────────
chatRouter.get("/roles", (_req: Request, res: Response) => {
  res.json({ roles: getRoles() });
});

// ─── POST /api/chat/stream (SSE) ─────────────────────────────────
chatRouter.post("/stream", async (req: Request, res: Response) => {
  try {
    const { message, history, provider, role, customSystemPrompt, model, apiKey, baseURL } = req.body;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    const chatReq = {
      message,
      history: history || [],
      provider: provider || "deepseek",
      role: role || "career_advisor",
      customSystemPrompt,
      model,
      apiKey,
      baseURL,
    };

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    const gen = streamChat(chatReq);
    let fullText = "";

    try {
      for await (const chunk of gen) {
        fullText += chunk;
        // SSE format: data: {...}\n\n
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      }

      // Send completion
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

    const result = await chat({
      message,
      history: history || [],
      provider: provider || "deepseek",
      role: role || "career_advisor",
      customSystemPrompt,
      model,
      apiKey,
      baseURL,
    });

    res.json({ reply: result });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed", detail: err.message });
  }
});
