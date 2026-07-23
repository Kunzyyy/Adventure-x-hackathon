import { Router, Request, Response } from "express";
import { interviewChat } from "../services/ai.js";

export const interviewRouter = Router();

interface StoredSession {
  id: string;
  userId: string;
  createdAt: string;
  messages: { role: "user" | "assistant"; content: string; scores?: any; timestamp: string }[];
}

const sessions: Map<string, StoredSession> = new Map();

// In production, replace with DB. For now, sessions are keyed by id.

interviewRouter.post("/start", (req: Request, res: Response) => {
  const userId = String((req as any).userId || "anonymous");
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const openingMessage = "你好！我是你的AI面试官。今天我们将进行一次模拟面试。请先简单介绍一下你自己。";

  sessions.set(sessionId, {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
    messages: [{ role: "assistant", content: openingMessage, timestamp: new Date().toISOString() }],
  });

  res.json({ sessionId, message: openingMessage });
});

interviewRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      res.status(400).json({ error: "sessionId and message are required" });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const history = session.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const result = await interviewChat(history, message);

    session.messages.push({ role: "user", content: message, timestamp: new Date().toISOString() });
    session.messages.push({ role: "assistant", content: result.reply, scores: result.scores, timestamp: new Date().toISOString() });

    res.json(result);
  } catch (err: any) {
    console.error("Interview chat error:", err);
    res.status(500).json({ error: "Interview error", detail: err.message });
  }
});

// ─── History Endpoints ───────────────────────────────────

interviewRouter.get("/history", (req: Request, res: Response) => {
  const userId = String((req as any).userId || "anonymous");
  const allSessions = Array.from(sessions.values())
    .filter((s) => s.userId === userId)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
      preview: s.messages[0]?.content?.slice(0, 100) || "",
      lastMessage: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || "",
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ sessions: allSessions });
});

interviewRouter.get("/history/:sessionId", (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId as string);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ session });
});
