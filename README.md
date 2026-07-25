# Adventure-x-hackathon · 双端 AI 求职助手

> 黑客松项目 · 三人协作。核心论点:**「你会写,它会筛」** —— 求职者和企业复用同一个岗位理解引擎。

[![Deploy to Render](https://render.com/images/deploy-to-render-dot.svg)](https://render.com/deploy?repo=https://github.com/Kunzyyy/Adventure-x-hackathon)

**当前验收版本：`Jin-Ziyao`**

- 在线网站：https://ucn968075fdn.aiforce.cloud/app/app_17asc20u1gy/
- 后端服务：https://ai-career-copilot-438i.onrender.com
- AI 状态：DeepSeek `live`
- 最近验收：2026-07-24，5 个核心接口全部返回 `mode: "live"`
- 自动化检查：122 项测试通过，TypeScript 类型检查通过

---

## 这是什么

一个能**证明自己不编造**的 AI 简历工具:

- **双端同引擎**:求职者端(贴 JD 生成简历)和企业端(生成 JD + 筛选维度 + 面试题)用同一个岗位理解引擎,首页画了飞轮可视化。
- **每句话可溯源**:简历每条内容点开能看到"你当时说的原话"(sourceQuote),反 AI 编造。
- **诚实对齐**:岗位匹配用红黄绿证据状态(证据弱/缺失/OK),不编造匹配分数。
- **面试体检**:基于简历风险生成追问,不背通用题库。
- **mode 标识**:所有 AI 结果标 🟢live / 🔸mock / ⚠️fallback,不装真 AI。

---

## 30 秒跑起来（本地 Mock）

```bash
git clone https://github.com/Kunzyyy/Adventure-x-hackathon.git
cd Adventure-x-hackathon
git checkout Jin-Ziyao
corepack enable
pnpm install --frozen-lockfile
pnpm --filter backend build
cd backend
LLM_MODE=mock PORT=3001 pnpm start
```

浏览器打开 **http://localhost:3001/**(注意用 `localhost`,别用 `127.0.0.1`)。

---

## 接入真实 AI

复制 `backend/.env.example` 为 `backend/.env`，填写自己的 AI Key，并把
`LLM_MODE` 改为 `live`。真实密钥只能放在本地 `.env` 或部署平台的
Environment Variables，**禁止提交到 GitHub**。

DeepSeek 使用 OpenAI 兼容接口；后端会对 5 类 AI 输出执行 JSON 契约校验、
失败重试、证据来源检查和安全检查。配置及部署步骤见 [DEPLOY.md](./DEPLOY.md)。

---

## 5 个核心接口

| 端 | 接口 | 作用 | 线上验收 |
|---|---|---|---|
| 学生端 | `POST /api/seeker/analyze` | 解析 JD，生成岗位画像和动态问题 | LIVE |
| 学生端 | `POST /api/seeker/facts` | 从回答中提取可确认、可溯源的事实 | LIVE |
| 学生端 | `POST /api/seeker/generate` | 用已确认事实生成简历和面试风险 | LIVE |
| 企业端 | `POST /api/employer/analyze` | 将模糊需求拆成岗位画像和澄清问题 | LIVE |
| 企业端 | `POST /api/employer/generate` | 生成标准 JD、筛选维度和 5 道面试题 | LIVE |

---

## 页面一览

| 页面 | 地址 | 干什么 |
|---|---|---|
| 首页 | `/` | 双端同引擎飞轮,两个入口 |
| 简历 | `/student-resume.html` | 路 A(有简历想改)/ 路 B(从零带模板),左右联动,可溯源 |
| 对齐图 | `/student-match.html` | 岗位要求 vs 你的情况,红黄绿证据状态 |
| 面试体检 | `/student-interview.html` | 基于简历风险的追问清单 |
| 企业端 | `/enterprise.html` | 输入模糊需求,生成 JD + 筛选维度 + 5 道面试题 |

---

## 目录结构

```
backend/      Express + TypeScript 后端,5 个契约接口(seeker/employer),含反编造校验
  src/contracts/  接口契约(Zod schema + TS 类型,单一事实来源)
  src/llm/        LLM 开关板,mock/live/fallback 三态
  src/mocks/      演示数据(从 JD 派生,不编造)
  src/routes/     API 路由
  src/services/   业务逻辑(含 sourceQuote 逐字校验、歧视词黑名单)
  test/           122 个测试
css/style.css  全站浅色克制样式
js/app.js      旧页面逻辑(部分保留)
*.html         演示页面
team-contract/ 接口契约 + 团队红线(改代码前必读)
DEPLOY.md      部署说明
CONTRIBUTING.md 外部协作者提交优化的流程
```

---

## 协作规矩(必读)

1. 从当前验收分支 `Jin-Ziyao` 创建自己的功能分支
2. 本地完成修改并运行测试，不直接覆盖验收分支或 `main`
3. 推送自己的分支，在 GitHub 创建 Pull Request
4. 由项目成员验收后再合并
5. 仅发送仓库链接不会授予上传权限；团队成员需邀请为 Collaborator，外部人员可 Fork 后提交 Pull Request
6. 详细步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md)
7. 红线见 [team-contract/TEAM-RULES.md](./team-contract/TEAM-RULES.md)：不编造、不歧视、不改接口字段

---

## 技术栈

- 后端:Express + TypeScript + Zod
- 前端:原生 HTML + 内联样式(浅色克制)
- LLM：OpenAI 兼容接口，支持 mock / live / fallback
- 测试：Vitest，122 项
