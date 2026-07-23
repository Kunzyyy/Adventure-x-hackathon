import { Router, Request, Response } from "express";
import { generateResume, polishResume } from "../services/ai.js";

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
