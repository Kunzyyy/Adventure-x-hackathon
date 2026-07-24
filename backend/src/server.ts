import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { resumeRouter } from "./routes/resume.js";
import { jobRouter } from "./routes/job.js";
import { interviewRouter } from "./routes/interview.js";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { chatRouter } from "./routes/chat.js";
import { seekerRouter } from "./routes/seeker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/resume", resumeRouter);
app.use("/api/job", jobRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/chat", chatRouter);
app.use("/api/seeker", seekerRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log("🚀 AI Career Copilot API running on http://localhost:" + PORT);
});
