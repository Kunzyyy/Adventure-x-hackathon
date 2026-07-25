# 产品架构文档 · AI 求职助手（投个明白 / 招个明白）

> 版本：`Jin-Ziyao`  
> 更新日期：2026-07-25  
> 适用范围：黑客松 MVP 及后续迭代

---

## 1. 产品定位

一个**双端同引擎**的 AI 求职辅助工具：

- **投个明白（求职者端）**：粘贴 JD → 回答 AI 追问 → 确认事实 → 选择模板 → 生成可溯源简历。
- **招个明白（企业端）**：输入模糊招聘需求 → 回答澄清问题 → 生成标准 JD + 筛选维度 + 面试题。

核心差异点：不是“AI 润色简历”，而是**把真实经历翻译成岗位匹配证据**，并且每句话都能追溯到用户原话，反 AI 编造。

---

## 2. 系统架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户访问层                               │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │  aiforce.cloud  │      │  Render 服务    │                   │
│  │  (静态前端镜像)  │◄────►│  (Node + 前端)  │                   │
│  └────────┬────────┘      └────────┬────────┘                   │
│           │                        │                            │
│           └────────┬───────────────┘                            │
│                    │                                             │
│           都指向同一后端 API                                      │
│                    ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Render 后端：ai-career-copilot               │  │
│  │  Express + TypeScript + Zod + OpenAI 兼容 LLM 客户端      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 当前线上部署

| 组件 | 地址 | 说明 |
|---|---|---|
| 静态前端（aiforce.cloud） | `https://ucn968075fdn.aiforce.cloud/app/app_17asc20u1gy/` | 用户主要访问入口，需手动上传更新 |
| Render 后端 | `https://ai-career-copilot-438i.onrender.com` | API + 同源页面，GitHub 推送后手动部署 |
| GitHub 代码 | `Kunzyyy/Adventure-x-hackathon` | 验收分支 `Jin-Ziyao` |

---

## 3. 前端架构

### 3.1 技术栈

- **纯原生 HTML + CSS + JS**，无框架，便于黑客松快速迭代和单文件部署。
- **CSS**：`css/approved-ui.css` 提供统一的设计系统（暖纸陶土风格、响应式、打印样式）。
- **JS**：按页面拆分为 `js/approved-student.js` 和 `js/approved-employer.js`。
- **PDF 导出**：`html2pdf.js`（基于 `html2canvas` + `jsPDF`），实现一键下载 PDF；失败时回退到浏览器打印对话框。

### 3.2 页面矩阵

| 页面 | 文件 | 功能 |
|---|---|---|
| 首页 | `index.html` | 双端飞轮介绍、两个入口 |
| 求职者端 | `student.html` | 5 步流程：岗位 → 追问 → 事实 → 模板 → 简历 |
| 企业端 | `enterprise.html` | 2 步流程：需求澄清 → 招聘包 |
| 简历编辑器 | `student-resume.html` | 已有简历修改、左右联动 |
| 匹配图 | `student-match.html` | 岗位要求 vs 个人情况，红黄绿证据状态 |
| 面试体检 | `student-interview.html` | 基于简历风险生成追问 |
| 模板编辑器 | `resume-editor/index.html` | 内部模板调试工具 |

### 3.3 前端状态管理

每个页面使用一个顶层 `state` 对象保存当前会话数据：

**求职者端（`approved-student.js`）**

```js
const state = {
  activeStep: "job",
  jobProfile: null,      // /api/seeker/analyze 返回的岗位画像
  questions: [],         // AI 追问列表
  answers: [],           // 用户回答
  facts: [],             // 待确认事实
  oldResume: "",         // 旧简历/经历
  selectedTemplate: "classic", // 简历模板
  resumeData: null,      // /api/seeker/generate 返回的简历数据
};
```

**企业端（`approved-employer.js`）**

```js
const state = {
  activeStep: "analyze",
  jobTitle: "",
  roughRequirement: "",
  jobProfile: null,      // /api/employer/analyze 返回的岗位画像
  questions: [],         // 澄清问题
  recruitmentKit: null,  // /api/employer/generate 返回的招聘包
};
```

### 3.4 前后端通信

页面通过 `data-*` 属性配置 API 基址和路径：

```html
<body
  data-api-origin="https://ai-career-copilot-438i.onrender.com"
  data-seeker-analyze="/api/seeker/analyze"
  data-seeker-facts="/api/seeker/facts"
  data-seeker-generate="/api/seeker/generate"
>
```

通用 `apiPost` 封装：

1. 用 `new URL(url, apiOrigin)` 构造完整地址。
2. `fetch` POST JSON。
3. 解析响应，失败时抛出后端错误信息。
4. 成功时更新顶部 `mode` 药丸（mock / live / fallback）。

---

## 4. 后端架构

### 4.1 技术栈

- **运行时**：Node.js + Express
- **语言**：TypeScript，编译输出到 `backend/dist/`
- **校验**：Zod（运行时）+ Zod 推断的 TypeScript 类型（编译时）
- **LLM 客户端**：OpenAI SDK，兼容 OpenAI / DeepSeek 等 OpenAI-compatible 服务
- **测试**：Vitest，123 项测试

### 4.2 目录结构

```
backend/
├── src/
│   ├── server.ts           # Express 入口：路由挂载 + 静态文件 + 错误处理
│   ├── contracts/          # 契约层：Zod Schema + TS 类型 + HTTP 工具
│   │   ├── schemas.ts
│   │   ├── types.ts
│   │   ├── http.ts
│   │   └── index.ts
│   ├── llm/                # LLM 开关板
│   │   ├── index.ts        # callStructured / mock-live-fallback 三态
│   │   └── log.ts          # 安全日志（脱敏）
│   ├── mocks/              # Mock 数据生成器
│   │   ├── seeker.ts
│   │   └── employer.ts
│   ├── routes/             # Express 路由
│   │   ├── seeker.ts       # /api/seeker/*
│   │   ├── employer.ts     # /api/employer/*
│   │   ├── resume.ts
│   │   ├── job.ts
│   │   ├── interview.ts
│   │   ├── chat.ts
│   │   ├── auth.ts
│   │   └── config.ts
│   ├── services/           # 业务逻辑
│   │   ├── seeker.ts       # 求职者三阶段核心逻辑 + Prompt
│   │   ├── employer.ts     # 企业端两阶段核心逻辑 + Prompt
│   │   ├── ai.ts
│   │   ├── chat.ts
│   │   └── errors.ts       # ServiceError 类型
│   └── test-fixtures.ts
└── test/                   # 测试文件
```

### 4.3 路由与接口

| 方法 | 路径 | 对应服务 | 说明 |
|---|---|---|---|
| POST | `/api/seeker/analyze` | `seekerAnalyze` | 解析 JD，生成岗位画像和追问 |
| POST | `/api/seeker/facts` | `seekerFacts` | 从回答中提取待确认事实 |
| POST | `/api/seeker/generate` | `seekerGenerate` | 用确认事实生成简历和风险 |
| POST | `/api/employer/analyze` | `employerAnalyze` | 解析模糊需求，生成澄清问题 |
| POST | `/api/employer/generate` | `employerGenerate` | 生成标准 JD + 筛选维度 + 面试题 |
| GET | `/api/health` | - | 返回当前 LLM mode |

旧接口（保留但非当前 MVP 主线）：

- `/api/resume`、`/api/job`、`/api/interview`、`/api/chat`、`/api/auth`、`/api/config`

### 4.4 请求-响应契约

所有 API 返回统一 envelope：

```ts
type APIResponse<T> =
  | { ok: true; data: T; mode: APIMode }
  | { ok: false; error: APIError; mode: APIMode };

type APIMode = "live" | "mock" | "fallback";
```

三层校验：

1. **入参校验**：`validate(schema, req.body)`，失败返回 `INVALID_INPUT` (400)。
2. **AI 输出校验**：`validateAi(schema, aiOutput)`，失败返回 `INVALID_AI_OUTPUT` (422)，可触发重试或 fallback。
3. **业务后校验**：服务层内部检查 sourceQuote、evidenceIds、歧视词等。

---

## 5. 核心数据流

### 5.1 求职者端：从 JD 到简历

```
用户填写 JD + 旧简历
        │
        ▼
POST /api/seeker/analyze
        │
        ▼
┌─────────────────┐
│  jobProfile     │  岗位画像（职责、核心能力、mustHave、不确定项）
│  questions[]    │  5-8 道 AI 追问
└─────────────────┘
        │
        ▼
用户回答追问
        │
        ▼
POST /api/seeker/facts
        │
        ▼
┌─────────────────┐
│  facts[]        │  待确认事实（每条含 sourceQuote）
│  missingInfo[]  │  仍缺失的信息
└─────────────────┘
        │
        ▼
用户确认/修改/删除事实
        │
        ▼
POST /api/seeker/generate
        │
        ▼
┌─────────────────┐
│  resume         │  结构化简历（含 evidenceIds）
│  missingInfo[]  │  简历中仍缺失的信息
│  interviewRisks │  面试追问风险
└─────────────────┘
        │
        ▼
选择模板 → 导出 PDF
```

### 5.2 企业端：从模糊需求到招聘包

```
用户输入岗位名称 + 模糊需求
        │
        ▼
POST /api/employer/analyze
        │
        ▼
┌─────────────────┐
│  jobProfile     │  岗位画像
│  questions[]    │  3-5 道澄清问题
└─────────────────┘
        │
        ▼
用户回答澄清问题
        │
        ▼
POST /api/employer/generate
        │
        ▼
┌─────────────────┐
│  standardizedJD │  标准 JD
│  screeningDims  │  筛选维度（权重合计 100）
│  interviewQs    │  5 道面试题
└─────────────────┘
        │
        ▼
导出岗位说明 PDF
```

---

## 6. LLM 集成：三态开关板

### 6.1 模式

后端通过环境变量 `LLM_MODE` 控制：

| 模式 | 行为 | 适用场景 |
|---|---|---|
| `mock` | 不调用 AI，使用 `mocks/` 中的本地数据 | 本地开发、演示、无 API Key |
| `live` | 调用真实 LLM（OpenAI / DeepSeek 等） | 生产环境 |
| `fallback` | AI 调用失败后降级到 mock | 自动触发，不中断演示 |

### 6.2 配置

```env
LLM_MODE=live
AI_PROVIDER=deepseek
AI_API_KEY=sk-...
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
LLM_TIMEOUT_MS=30000
```

### 6.3 callStructured 流程

```
调用者提供：
  - system prompt（业务规则 + 安全约束）
  - outputShape（严格的 JSON 模板）
  - userBlocks（被 <user_data> 围栏包裹的用户数据）
  - Zod schema（输出结构校验）
  - mockFn（mock/fallback 数据生成器）
        │
        ▼
callStructured 决定 mode
        │
   ┌────┴────┐
   ▼         ▼
 mock      live
  │          │
  │    调用 OpenAI SDK
  │    temperature=0
  │    失败重试一次
  │          │
  │          ▼
  │    JSON 解析 + Zod 校验
  │          │
  │    失败 → fallback / error
  │          │
  └────┬─────┘
       ▼
  返回 { data, mode, attempts, retried }
```

### 6.4 安全设计

- **Prompt Injection 防御**：用户数据被 `<user_data>` 围栏包裹，系统提示明确说明其不可信。
- **输出契约硬化**：系统提示附加 JSON 模板和安全边界，禁止模型偏离结构。
- **反编造规则**：
  - 不能把 JD 要求当成求职者已具备能力。
  - "参与" 不能写成 "负责"；"了解" 不能写成 "精通"。
  - 不能生成虚假数字、公司、奖项、技能。
- **反歧视规则**：企业端禁止生成性别、年龄、婚育、籍贯、外貌等条件。
- **API Key 安全**：只从环境变量读取，不进入代码、日志或前端。

---

## 7. 契约驱动开发

`backend/src/contracts/` 是前后端的单一事实来源：

- `schemas.ts`：所有 Zod schema，包括请求、响应、共享实体。
- `types.ts`：由 schema 自动推断的 TypeScript 类型。
- `http.ts`：统一的响应 envelope、校验工具、错误映射。

变更流程：

1. 如需改字段/路径，先更新 `team-contract/API-CONTRACT.md`。
2. 同步修改 `schemas.ts`。
3. 前端和后端各自适配，不单独改字段名。
4. 运行测试确保契约一致。

---

## 8. 部署架构

### 8.1 Render 服务（`render.yaml`）

```yaml
services:
  - name: ai-career-copilot
    runtime: node
    branch: Jin-Ziyao
    buildCommand: pnpm install ... && pnpm --filter backend build
    startCommand: node backend/dist/server.js
    autoDeploy: false
    envVars:
      - LLM_MODE: mock
      - NODE_ENV: production

  - name: ai-career-copilot-ui
    runtime: static
    branch: Jin-Ziyao
    buildCommand: node scripts/build-static-site.mjs static-dist
    staticPublishPath: ./static-dist
    autoDeployTrigger: off
```

### 8.2 当前实际部署

由于 `autoDeploy: false`，当前流程是：

```
本地修改 → push 到 Jin-Ziyao → Render 后台 Manual Deploy → 等待构建完成
```

### 8.3 静态构建脚本

`scripts/build-static-site.mjs`：

1. 读取 `css/approved-ui.css` 并内联到 HTML `<style>`。
2. 读取对应页面的 JS 并内联为 `<script type="module">`。
3. 如果页面引用了 `html2pdf.bundle.min.js`，也一并内联。
4. 输出到 `dist/` 或 `static-dist/`。

输出后的 HTML 是自包含单文件，适合上传到 aiforce.cloud 等静态托管。

### 8.4 两个部署入口的关系

| 入口 | 更新方式 | 当前状态 |
|---|---|---|
| Render Node 服务 | GitHub 推送 + 手动部署 | 后端 + 同源页面，自动随代码更新 |
| aiforce.cloud | 手动上传 `dist/*.html` | 独立静态副本，需要单独更新 |

---

## 9. 测试策略

| 测试类型 | 文件 | 覆盖内容 |
|---|---|---|
| 契约测试 | `test/contracts.test.ts` | Zod schema 校验、错误格式、类型一致性 |
| LLM 开关板测试 | `test/llm.test.ts` | mock/live/timeout/unavailable/retry |
| 服务层测试 | `test/services.seeker.test.ts` | seeker 三阶段业务逻辑 |
| 服务层测试 | `test/services.employer.test.ts` | employer 两阶段业务逻辑 |
| API 冒烟测试 | `test/api.smoke.test.ts` | Express 路由端到端 |
| 前端契约测试 | `test/frontend.approved-ui.test.ts` | HTML/JS 关键字符串、模板、按钮存在性 |
| 集成矩阵测试 | `test/task9.matrix.test.ts` | 多路径状态组合 |

运行方式：

```bash
./pnpm.sh --filter backend test
```

---

## 10. 安全与合规红线

来自 `team-contract/TEAM-RULES.md`：

1. **不能改 5 个核心 API 的路径和字段名**。
2. **不能跳过"求职者确认事实"步骤**。
3. **不能丢弃 `sourceQuote`、`evidenceIds`、`missingInformation`、`interviewRisks`**。
4. **不能编造**：不能把"参与"改成"负责"、"了解"改成"精通"，不能编数字/公司/奖项。
5. **不能歧视**：企业端不能生成性别/年龄/婚育/籍贯/外貌条件。
6. **不做**候选人评分排名、登录、数据库、投递收件箱。

---

## 11. 扩展点与未来可能

| 方向 | 当前状态 | 可能演进 |
|---|---|---|
| 数据库/会话 | 无 | 增加用户账号、历史记录、投递跟踪 |
| 文件上传 | 无 | 支持上传 Word/PDF 简历解析 |
| 多轮对话 | 基础 | 在追问步骤支持多轮澄清 |
| 真实投递 | 无 | 对接招聘平台或邮件发送 |
| 企业数据看板 | 无 | 招聘漏斗、Offer 统计 |
| 前端框架化 | 原生 HTML | 迁移到 React/Next.js，复用现有契约 |

---

## 12. 快速参考

### 本地启动

```bash
git checkout Jin-Ziyao
./pnpm.sh install --frozen-lockfile
./pnpm.sh --filter backend build
cd backend
LLM_MODE=mock PORT=3001 ./pnpm.sh start
```

### 部署

```bash
# 1. 改代码、测试、提交
git add <文件>
git commit -m "..."
git push origin Jin-Ziyao

# 2. Render 后台 Manual Deploy → Deploy latest commit

# 3. 如需更新 aiforce.cloud，重新上传 dist/*.html
node scripts/build-static-site.mjs dist
```

---

## 13. 关键文件索引

| 文件 | 作用 |
|---|---|
| `backend/src/server.ts` | Express 入口 |
| `backend/src/routes/seeker.ts` | 求职者 API 路由 |
| `backend/src/routes/employer.ts` | 企业端 API 路由 |
| `backend/src/services/seeker.ts` | 求职者业务逻辑 + Prompt |
| `backend/src/services/employer.ts` | 企业端业务逻辑 + Prompt |
| `backend/src/llm/index.ts` | LLM 开关板 |
| `backend/src/contracts/schemas.ts` | 数据契约 |
| `js/approved-student.js` | 求职者端页面逻辑 |
| `js/approved-employer.js` | 企业端页面逻辑 |
| `css/approved-ui.css` | 全局样式 + 打印样式 |
| `render.yaml` | Render 部署配置 |
| `scripts/build-static-site.mjs` | 静态构建脚本 |
| `team-contract/API-CONTRACT.md` | API 字段约定 |
| `team-contract/TEAM-RULES.md` | 团队红线 |
