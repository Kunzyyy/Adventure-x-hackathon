import { Router, Request, Response } from "express";
import { generateResume, polishResume, templateOptimize } from "../services/ai.js";

export const resumeRouter = Router();

resumeRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.skills) {
      res.status(400).json({ error: "Name and skills are required" });
      return;
    }
    const result = await generateResume(data);
    res.json(result);
  } catch (err: any) {
    console.error("Resume generation error:", err);
    res.status(500).json({ error: "Failed to generate resume", detail: err.message });
  }
});

resumeRouter.post("/optimize", async (req: Request, res: Response) => {
  try {
    const { currentResume, targetRole } = req.body;
    const result = await generateResume({
      name: "",
      education: "",
      skills: "",
      experience: currentResume,
      targetRole,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to optimize resume", detail: err.message });
  }
});

// NEW: Polish / refine an already-generated resume
resumeRouter.post("/polish", async (req: Request, res: Response) => {
  try {
    const { resumeText, userInfo, targetRole } = req.body;
    if (!resumeText) {
      res.status(400).json({ error: "resumeText is required" });
      return;
    }
    const result = await polishResume(resumeText, userInfo, targetRole);
    res.json(result);
  } catch (err: any) {
    console.error("Resume polish error:", err);
    res.status(500).json({ error: "Failed to polish resume", detail: err.message });
  }
});

// ─── POST /api/resume/template-optimize ──────────────────────────
// 供 resume-editor/chat.html 调用，后端代理 DeepSeek/OpenAI
resumeRouter.post("/template-optimize", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      res.status(400).json({ error: "简历文本太短，请至少输入10个字" });
      return;
    }
    const result = await templateOptimize(text);
    res.json(result);
  } catch (err: any) {
    console.error("Template optimize error:", err);
    res.status(500).json({ error: "AI优化失败", detail: err.message });
  }
});
