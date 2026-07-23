# Adventure-x-hackathon · 双端 AI 求职助手

> 黑客松项目 · 三人协作。核心论点:**「你会写,它会筛」** —— 求职者和企业复用同一个岗位理解引擎。

[![Deploy to Render](https://render.com/images/deploy-to-render-dot.svg)](https://render.com/deploy?repo=https://github.com/Kunzyyy/Adventure-x-hackathon)

---

## 这是什么

一个能**证明自己不编造**的 AI 简历工具:

- **双端同引擎**:求职者端(贴 JD 生成简历)和企业端(生成 JD + 筛选维度 + 面试题)用同一个岗位理解引擎,首页画了飞轮可视化。
- **每句话可溯源**:简历每条内容点开能看到"你当时说的原话"(sourceQuote),反 AI 编造。
- **诚实对齐**:岗位匹配用红黄绿证据状态(证据弱/缺失/OK),不编造匹配分数。
- **面试体检**:基于简历风险生成追问,不背通用题库。
- **mode 标识**:所有 AI 结果标 🟢live / 🔸mock / ⚠️fallback,不装真 AI。

---

## 30 秒跑起来(本地)

```bash
npm install -g pnpm
git clone https://github.com/Kunzyyy/Adventure-x-hackathon.git
cd Adventure-x-hackathon/backend
pnpm install && pnpm build
LLM_MODE=mock PORT=3001 node dist/server.js
```

浏览器打开 **http://localhost:3001/**(注意用 `localhost`,别用 `127.0.0.1`)。

---

## 一键部署上线(无需本地)

点上面的 **Deploy to Render** 按钮,用 GitHub 登录,2-5 分钟拿到一个网址,点开就能用。详见 [DEPLOY.md](./DEPLOY.md)。

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
  test/           107 个测试
css/style.css  全站浅色克制样式
js/app.js      旧页面逻辑(部分保留)
*.html         演示页面
team-contract/ 接口契约 + 团队红线(改代码前必读)
DEPLOY.md      部署 & 协作说明(给队友看)
```

---

## 协作规矩(必读)

1. **只在自己分支改**:`Jin-Ziyao` / `Zheng-Xinyao` / `Chen-Pengyu`,别动 main
2. **本地改好看了再推 GitHub**:main 是对外成果,本地是草稿台
3. **合 main 前群里说**,别自己合
4. **红线见 [team-contract/TEAM-RULES.md](./team-contract/TEAM-RULES.md)**:不编造、不歧视、不改接口字段

---

## 技术栈

- 后端:Express + TypeScript + Zod
- 前端:原生 HTML + 内联样式(浅色克制)
- LLM:OpenAI 兼容,默认 mock,配 key 走 live
- 测试:Vitest,107 个
