import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { resumeRouter } from "./routes/resume.js";
import { jobRouter } from "./routes/job.js";
import { interviewRouter } from "./routes/interview.js";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { chatRouter } from "./routes/chat.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// backend/src -> backend -> repo root (where MVP static pages live)
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// ─── API routes (mounted BEFORE static so /api/* is never shadowed) ───
app.use("/api/resume", resumeRouter);
app.use("/api/job", jobRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/chat", chatRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── MVP static pages (root directory), served over HTTP not file:// ───
// Whitelist of top-level MVP entry HTML files. We serve these explicitly so we
// never expose backend source, node_modules or frontend internals.
const MVP_HTML_FILES = [
  "index.html",
  "student.html",
  "enterprise.html",
  "resume.html",
  "resume-builder.html",
  "chat.html",
  "interview.html",
  "lab.html",
];

for (const file of MVP_HTML_FILES) {
  app.get("/" + file, (_req, res) => {
    res.sendFile(path.join(REPO_ROOT, file));
  });
}

// "/" serves the landing page.
app.get("/", (_req, res) => {
  res.sendFile(path.join(REPO_ROOT, "index.html"));
});

// Whitelisted static asset directories under repo root.
app.use("/css", express.static(path.join(REPO_ROOT, "css")));
app.use("/js", express.static(path.join(REPO_ROOT, "js")));
app.use("/resume-editor", express.static(path.join(REPO_ROOT, "resume-editor")));

// SPA fallback for the React app's client routing (frontend/dist), if built.
// Kept separate so the root MVP pages above still win for /student.html etc.
app.use(
  express.static(path.join(REPO_ROOT, "frontend", "dist"), {
    index: false,
    fallthrough: true,
  }),
);

// Centralized error handler — never leak stack traces / env to the client.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[server] unhandled error:", err instanceof Error ? err.message : err);
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
    mode: "live",
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log("🚀 AI Career Copilot API running on http://localhost:" + PORT);
  // eslint-disable-next-line no-console
  console.log("   MVP pages: http://localhost:" + PORT + "/  /student.html  /enterprise.html");
});
