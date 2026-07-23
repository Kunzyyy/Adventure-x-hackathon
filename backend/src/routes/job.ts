import { Router, Request, Response } from "express";
import { matchJobs } from "../services/ai.js";

export const jobRouter = Router();

jobRouter.post("/match", async (req: Request, res: Response) => {
  try {
    const profile = req.body;

    if (!profile.skills || profile.skills.length === 0) {
      res.status(400).json({ error: "Skills are required for job matching" });
      return;
    }

    const result = await matchJobs(profile);
    res.json(result);
  } catch (err: any) {
    console.error("Job matching error:", err);
    res.status(500).json({ error: "Failed to match jobs", detail: err.message });
  }
});
