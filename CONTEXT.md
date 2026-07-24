# Keal 项目上下文（AI 续接用）

> 给 AI 工具（ChatGPT / 通义千问 / Codex）看的上下文摘要。
> 新任务开始时让 AI 先 `read` 此文件，即可续接，不用粘贴历史、不用贴截图。

## 项目是什么
AI 求职助手（面向大学生）。用户对话优化简历 → 选模板 → 套用 → 导出 PDF。纯前端为主，后端做 AI 代理。

## 目录结构（keal 项目根：/Users/mac/Documents/keal）
- `student.html` — 学生主页，含 AI 对话 + 简历生成流程（已精简为 **3 步**：输入JD → AI提问 → 生成简历；原「确认事实」步骤已删，事实默认全确认）
- `resume-editor/` — 完整简历模块（AI 工具已在此基础上修改）：
  - `chat.html` — AI 对话优化页（贴原简历 → AI 优化成 JSON → 存 localStorage → 跳 index.html）
  - `index.html` — 模板编辑器（表单 + 4 套模板切换 + A4 预览 + 导出 PDF）
  - `templates/` — 4 张预览图（01 简约风 / 02 应届生 / 08 外企英文 / 09 专业英文）
  - `vendor/html2pdf.bundle.min.js` — 本地 PDF 导出库（已本地化，不依赖外网）
- `backend/` — 后端（Node/TS）：
  - `src/routes/chat.ts` — AI 对话代理路由（chat.html 应接这里，不在前端存 Key）
  - `src/services/chat.ts`、`src/services/ai.ts` — AI 调用逻辑
  - `src/routes/resume.ts`、`src/routes/interview.ts`、`src/routes/job.ts` 等
- `frontend/` — React 前端：
  - `src/pages/ResumePage.tsx` — React 简历页（独立体系）
  - `src/components/resume/` — React 简历组件
- `keal-mui/`、`material-ui/` — UI 组件库
- `start-backend.sh`、`start-frontend.sh` — 启动脚本

## 合并方案（ChatGPT 提出，方向已确认）
1. 保留 `resume-editor/` 为官方简历模块
2. `student.html` 嵌入 `chat.html`（iframe 或 script 挂载），统一入口
3. `chat.html` 接 Keal 后端代理 `backend/src/routes/chat.ts`，前端不再存 API Key
4. 统一 UI 风格（`resume-editor` 当前浅色，Keal 主色待定）
5. `ResumePage.tsx` 按主站需要决定保留 / 替换

## 关键事实
- `resume-editor/chat.html` 已支持真实 DeepSeek API（OpenAI 兼容格式），默认 `apiUrl=https://api.deepseek.com/v1/chat/completions`、`model=deepseek-chat`
- 数据通过 localStorage 的 `resumeData`(JSON) 在 chat → index 之间传递
- 4 套模板数据字段：`name / title / phone / email / location / education[] / experience[] / skills / eval`

## 最新进展（2026-07-23）：DeepSeek 已接好
- **后端 Key 已配置**：`backend/.env` 已写入真实 DeepSeek Key（`AI_PROVIDER=deepseek`、`AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-chat`、`AI_API_KEY=sk-...`）。`.env` 已被 git 忽略且未跟踪，**切勿提交到 GitHub**。
- **student.html 的 AI 功能已全部从 mock 改为真实调用**（原先是 `setTimeout` 假数据）。当前真实 AI 调用点：
  1. `step1Submit` — ① AI 分析岗位（JSON） ② 基于岗位动态生成针对性提问（JSON）
  2. `step2Submit` — ① AI 从回答提炼事实（JSON 数组）② AI 生成结构化简历（JSON）③ AI 分析缺失信息+面试风险（JSON）
  3. `analyzeMatch` — AI 岗位匹配度评分（JSON）
  4. `submitInterviewAnswer` — **AI 面试官评分**（JSON：逻辑/表达/匹配 三维度 + feedback + 追问）
  - 统一通过 `callAI(message, systemPrompt, role)` → `fetch('/api/chat', …)` 调用后端。
  - `extractJSON()` 负责剥离 ``` 代码块标记并解析 AI 返回的 JSON（兼容对象/数组）。
- **后端已在 3001 运行且实测调通**（返回真实 DeepSeek 回复）。student.html 预览跑在 **5180**（`vite.student.config.ts`，`/api` 代理到 3001）；5173 被 keal-mui 占用，别动。

### ⚠️ 关键 gotcha（以后改 student.html 必看）
- 后端 `src/services/chat.ts` 的 `getSystemPrompt()` **只在 `role==='custom'` 时才使用 `customSystemPrompt`**，否则就用内置人设（自然语言，不输出 JSON）。
- 因此 `callAI` 里**必须传 `role:'custom'`** 才能让 AI 按我们的 JSON 格式指令输出。若改成 `career_advisor`/`interviewer` 等人设 role，`customSystemPrompt` 会被忽略，AI 返回散文，`extractJSON` 会报错。
- 如需换模型，改 `backend/.env` 的 `AI_MODEL`（如 `deepseek-reasoner`），或前端 `callAI` 里的 `model` 字段。

## 当前卡点（已基本解决）
1. ~~CC Switch 模型名 `deepseek-v4-pro` 报上下文超限~~ → 已绕过：student.html 直接走后端 `/api/chat`，由后端读 `backend/.env` 的 DeepSeek 配置，不再依赖 CC Switch 代理。**CC Switch 那套不用了。**
2. 在 AI 工具里粘贴截图 / 代码全文会爆上下文 → 让 AI 用 `read` 工具看文件

## 纪律（重要，避免再超限）
- 新任务：先 `read CONTEXT.md`，再 `read` 具体文件，**不要粘贴任何文件全文或截图**
- 长对话（>20 轮）新建任务，用一句话接力
- 改动 student.html 的 AI 调用时，**保持 `role:'custom'`**（见上方 gotcha）
- 图片相关需求，用文字描述或让 AI `read` 文件路径，别贴图
- 改了 `backend/.env` 后必须**重启后端**（端口 3001）才能生效
