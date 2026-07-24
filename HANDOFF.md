# Keal 项目交接文档（HANDOFF）

> **给接手的 AI 看**：不要让我粘贴任何代码全文或截图。
> 请按本文「阅读顺序」用 read 工具读对应文件即可。全文约 70KB 不必全读。
> 项目根目录：`/Users/mac/Documents/keal`

## 1. 这是什么
**Keal** —— 面向大学生的 AI 求职助手。核心闭环：用户输入岗位 JD → AI 动态提问挖掘经历 → AI 生成结构化简历 → 复制到模板编辑器选模板 → 导出 PDF。另外含「岗位匹配度分析」和「AI 模拟面试」两个模块。纯前端为主，后端仅做 AI 代理（保管 API Key）。

## 2. 架构与端口
| 组件 | 端口 | 启动方式 | 作用 |
|------|------|----------|------|
| 后端 backend | **3001** | `cd backend && npx tsx src/server.ts`（或 `pnpm.sh exec tsx src/server.ts`） | AI 代理，读 `.env` 的 DeepSeek Key，暴露 `POST /api/chat` |
| 学生端预览 student | **5180** | `frontend/node_modules/.bin/vite --config vite.student.config.ts` | 托管根目录 `student.html`，并把 `/api` 代理到 3001 |
| keal-mui（React，无关） | 5173 | 占用中，**别动** | 另一个 UI 库项目，和求职助手无关 |

> ⚠️ 5173 已被 keal-mui 占用，所以 student.html 单独跑在 5180。访问地址：`http://localhost:5180/student.html` 和 `http://localhost:5180/`（首页落地页）。

## 3. 文件地图（按阅读顺序）
1. `student.html`（71KB，主文件）— AI 求职助手全部逻辑都在内联 `<script>`（约 324–913 行）。
   - 关键函数：`callAI()`(统一 AI 通道) · `extractJSON()`(剥离 ``` 解析 JSON) · `step1Submit()`(分析JD+动态提问) · `step2Submit()`(提炼事实→生成简历→缺失/风险，连续 3 次 AI) · `renderResume()`(第③步展示) · `copyToEditor()`(数据塞 localStorage 并打开编辑器) · `analyzeMatch()` · `submitInterviewAnswer()`(AI面试官)
   - 顶部有 file:// 协议自检横幅（双击打开会提示用 localhost）
2. `vite.student.config.ts` — 5180 服务配置（root=`.`，`/api`→3001）
3. `resume-editor/index.html`（30KB）— 模板编辑器：表单 + 4 套模板切换 + A4 预览 + 导出 PDF。**会自动读取 `localStorage.resumeData`**（字段：`name/title/phone/email/location/education[]/experience[]/skills/eval`）
4. `resume-editor/chat.html` — 早期 AI 对话优化页（现 student.html 已内联同等能力，此文件可参考）
5. `backend/src/services/chat.ts` — AI 调用逻辑（`getSystemPrompt()` 见下方 gotcha）
6. `backend/.env` — **含真实 DeepSeek Key，禁止读取后外传/提交 git**

## 4. AI 接线方式（重要）
- 前端统一走 `callAI(message, systemPrompt, role)` → `fetch('/api/chat', {role:'custom', customSystemPrompt, provider:'deepseek', model:'deepseek-chat'})`
- 后端用 OpenAI SDK 兼容 DeepSeek：`AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-chat`、`AI_API_KEY=sk-...`
- **🔴 GOTCHA**：后端 `getSystemPrompt()` **只在 `role==='custom'` 时才使用 `customSystemPrompt`**；若传 `career_advisor`/`interviewer` 等人设 role，`customSystemPrompt` 被忽略，AI 返回散文，`extractJSON` 报错。改 AI 调用务必保持 `role:'custom'`。
- 换模型：改 `backend/.env` 的 `AI_MODEL`（需重启后端）或前端 `callAI` 的 `model` 字段。

## 5. 当前进度（已完成）
- ✅ DeepSeek 全链路接通，5+ 处 AI 功能均为真实调用（无 mock 数据覆盖）
- ✅ 「AI简历」流程精简为 **3 步**（已删除「确认事实」人工步骤，事实默认全部确认）
- ✅ 动态提问：根据 JD 实时生成针对性问题（不再是写死的短视频文案）
- ✅ 应届生扩充：无实习经历时 AI 主动把课程/社团/比赛包装成项目与经历，简历版块充实（实测 19 个条目）
- ✅ 「复制到编辑器」桥接：student.html → resume-editor 自动填数据；教育背景兼容 `·`/`|`/`•`/空格 四种格式拆分
- ✅ 全站 MOCK 徽章改为「✨ DeepSeek」真实标识

## 6. 已知问题 / 待办（接手后可继续）
- `student.html` 内仍留有孤立的 `MOCK_*` 常量定义（仅作兜底，主流程不用），可清理
- 「复制到编辑器」目前只在第③步出现，可考虑做全局浮动按钮
- 5173/5180 端口分裂：若要统一回 5173，需先停 keal-mui（用户未确认）
- 部署方式未定（GitHub Pages / 云托管），如需上线要补构建与静态化
- 简历字段若需更细（如单独的作品链接、GitHub），要扩展 JSON schema + resume-editor 表单

## 7. 安全纪律
- **`backend/.env` 含真实 DeepSeek Key，绝对不要粘贴到对话、不要提交 GitHub、不要写进任何文档或记忆**
- 改动 `.env` 后必须重启后端（3001）才生效
- 新任务：先 read 本文件 + 相关文件，不贴全文/截图，避免上下文超限

## 8. 一句话启动验证
```bash
# 终端1：后端
cd /Users/mac/Documents/keal/backend && npx tsx src/server.ts
# 终端2：前端预览（5180）
cd /Users/mac/Documents/keal && frontend/node_modules/.bin/vite --config vite.student.config.ts
# 浏览器打开
open http://localhost:5180/student.html

---

## 在其他环境运行（qoder / 云端 / 无代理静态服务）⚠️ 易踩坑

**症状**：页面能打开，但点「AI分析岗位」报错
`AI分析失败：Unexpected token '<', "<!DOCTYPE"... is not valid JSON`
**根因**：`student.html` 的 `callAI()` 默认先用同源相对路径 `/api/chat`。这个路径只有在**配了 /api 代理**的 dev server 下才有效（本机 5180 的 vite 已配）。若页面被 qoder / 任意未配代理的环境打开，`/api/chat` 会打到那个环境的服务器 → 返回 404 的 HTML 页 → `JSON.parse` 炸掉。

**已做兼容**：`callAI()` 现在会自动降级——先试同源 `/api/chat`，失败再直连本机后端 `http://localhost:3001/api/chat`（后端 `cors({origin:'*'})`，跨域已放开）。所以要让它真正联通，**后端必须在本机运行**：

```bash
# 启动后端（端口 3001，加载 backend/.env 里的 DeepSeek Key）
cd /Users/mac/Documents/keal/backend && npm run dev
# 验证
curl -s -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" \
  -d '{"message":"hi","role":"custom","customSystemPrompt":"say ok"}' | head -c 80
```

**两个前提**：
1. 后端进程要一直活着（这是后台进程，重启电脑/会话结束会断，断了就重跑上面命令）。
2. 若 qoder 预览是 **HTTPS** 页面，直连 `http://localhost:3001` 会被浏览器当作 mixed content 拦截。此时需二选一：
   - 让 qoder 配一条 `/api → http://localhost:3001` 的反向代理；或
   - 把 `student.html` 顶部 `AI_CONFIG.directUrl` 改成 HTTPS 可达的后端地址（需后端也开 HTTPS）。

**绝不外传**：`backend/.env` 含真实 DeepSeek Key，不要贴给任何 AI、不要 git 提交。
```
