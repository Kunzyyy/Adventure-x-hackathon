import { Router, Request, Response } from "express";
import { matchJobs, enterpriseMatch, generateFullJD } from "../services/ai.js";

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

// ─── POST /api/job/enterprise-match ────────────────────────────
// Enterprise-side: match a student profile against a job description
jobRouter.post("/enterprise-match", async (req: Request, res: Response) => {
  try {
    const { student, jd } = req.body;

    if (!student || !jd) {
      res.status(400).json({ error: "Both student and jd are required" });
      return;
    }

    if (!student.skills || student.skills.length === 0) {
      res.status(400).json({ error: "Student skills are required" });
      return;
    }

    if (!jd.title || !jd.company) {
      res.status(400).json({ error: "JD title and company are required" });
      return;
    }

    const result = await enterpriseMatch(student, jd);
    res.json(result);
  } catch (err: any) {
    console.error("Enterprise match error:", err);
    res.status(500).json({ error: "Failed to match", detail: err.message });
  }
});

// ─── POST /api/job/generate-jd ──────────────────────────────────
// Enterprise-side: structured hiring inputs → full JD package
jobRouter.post("/generate-jd", async (req: Request, res: Response) => {
  try {
    const { company, role, skills, salaryRange, industry, notes } = req.body;

    if (!role || role.trim().length < 1) {
      res.status(400).json({ error: "请输入岗位名称" });
      return;
    }

    const result = await generateFullJD({
      company: company || "",
      role: role.trim(),
      skills: skills || [],
      salaryRange: salaryRange || "",
      industry: industry || "互联网/科技",
      notes: notes || "",
    });

    res.json(result);
  } catch (err: any) {
    console.error("JD generation error:", err);
    res.status(500).json({ error: "JD生成失败", detail: err.message });
  }
});
