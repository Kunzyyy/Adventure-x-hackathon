# handoff.md · Jin Ziyao 交接文件(前端冲刺后更新版)

> 更新日期:2026-07-24。
> 仓库:`C:\Users\Lenovo\Adventure-x-hackathon`,远程 `https://github.com/Kunzyyy/Adventure-x-hackathon.git`
> 唯一允许工作分支:`Jin-Ziyao`(main 现已交付干净版,但协作仍在各自分支进行)
> 本文件是给"下一个接手的 Claude 窗口"看的作战图。**用户是初学者,所有解释用大白话,不甩专业词,每完成一小步停下确认。**

---

## 0. 一句话现状

后端做完了(5 个契约接口 + 107 测试 + 反编造校验),前端从"一堆摇号机假页面"改成了"双端同引擎 + 可溯源"的三个新页面。main 已交付干净版(带一键部署按钮)。**当前任务是部署上线 + 给队友交接 + 准备路 A/B 收尾。**

---

## 1. 截至现在(2026-07-24)完成了什么

### 后端(全部完成,稳定)
- 5 个契约接口:`seeker/{analyze,facts,generate}` + `employer/{analyze,generate}`
- mock 模式无需 AI key,且 `mocks/seeker.ts` 已改成**会从 JD 文本派生岗位画像**(贴新媒体 JD 不再返回 SQL/Excel)
- 反编造:`sourceQuote` 逐字校验、`evidenceIds` 孤儿检查、歧视词黑名单、自动决策词黑名单
- 107 个测试,分布在 6 个文件
- LLM 开关板:mock/live/fallback 三态

### 前端(改造完成,核心交付)
三个新页面(都在根目录,后端同源服务):
- `student-resume.html`:路 A(诊断报告)+ 路 B(带模板从零),左右联动,**每句话可溯源**
- `student-match.html`:岗位对齐图(红黄绿证据状态,替代摇号机打分)
- `student-interview.html`:面试体检(基于 interviewRisks 静态展示,不背题库)
- `index.html`:双端同引擎飞轮首页(删了 3D/粒子/假统计数)
- `css/style.css`:全站浅色克制基线(静蓝单色)

### 部署 & 协作
- `render.yaml`:Render 一键部署配置(免费版,mock,autoDeploy)
- `README.md`:Deploy to Render 按钮 + 项目说明
- `DEPLOY.md`:给队友的部署 + 本地跑 + 协作规矩

### 已推到 GitHub 的分支
- `main`:干净交付版(commit `af8735d`),孤儿提交,只含 55 个交付文件,无实验残渣
- `Jin-Ziyao`:完整工作历史,含所有交接文档(SPRINT-HANDOFF / PROJECT-HANDOFF / handoff.md 等)

---

## 2. 当前未做完 / 待办(按优先级)

### 🔴 待办 1:实际部署 Render 拿到线上网址
- 配置和按钮都备好了,**但还没人真正点过 Deploy**
- 需要有人用 GitHub 账号登录 [render.com](https://render.com),点 README 的 Deploy 按钮
- 部署后拿到网址(如 `https://ai-career-copilot.onrender.com`),才能让队友/评委不装东西就看
- **冷启动注意**:Render 免费版 15 分钟无访问会休眠,演示前先点一下预热

### 🟡 待办 2:路 A / 路 B 收尾验证
用户开两个并行窗口改了 mock + 路A联动 + 路B模板,改动已 commit(`7a7bec3`)。但**用户还没逐个验证通不通**。接手后建议:
- 本地 `cd backend && pnpm build && LLM_MODE=mock PORT=3001 node dist/server.js`
- 浏览器 `http://localhost:3001/student-resume.html`
- 试路 A(有简历改):贴 JD+旧简历 → 诊断报告 → 左边改字右边变
- 试路 B(从零):贴 JD → 答题 → 事实卡片 → 选模板 → 出简历 → AI 助手侧栏
- 哪个不通就修哪个

### 🟢 待办 3:接真 AI(可选)
- 现在是 mock 模式,演示够用且诚实标 🔸mock
- 要真 AI:在 Render 控制台或本地 .env 加 `AI_API_KEY`,把 `LLM_MODE` 改 `live`
- 注意:live 模式可能不稳,建议保留 fallback 兜底

### ⚪ 待办 4:给队友写说明文档(用户之前提到"说明文档后面记得写")
- 各文件夹的 README 还没写(backend/frontend/css/js/docs 都没有)
- 用户授权后可写,讲清楚每个文件夹干啥的

---

## 3. 关键技术约束(改代码前必读)

### 分支安全(最高优先级)
- 唯一工作分支:`Jin-Ziyao`。开工前 `git branch --show-current` 必须输出它
- 绝不碰 `main`、`Zheng-Xinyao`、`Chen-Pengyu`
- 不用 `git reset --hard`、`git checkout --`、`git clean`
- commit 只 `git add <你改的文件>`,**绝不 `git add .`**(并行会抢别人改动)
- 未经用户明确授权,不 push、不建 PR、不部署

### 协作铁律(写进 AGENTS.md)
**本地改好看了,再推 GitHub。** main 是对外成果,本地是草稿台。用户没点头,Claude 不得 push。

### 契约红线(team-contract/TEAM-RULES.md)
- 不改 5 个 API 路径/字段名/层级
- 不跳过求职者事实确认步骤
- 不丢 `sourceQuote`/`evidenceIds`/`missingInformation`/`interviewRisks`
- 不编造(参与≠负责,了解≠精通,不编数字/公司/奖项)
- 不歧视(企业端不生成性别/年龄/婚育/籍贯/外貌条件)
- 不做候选人评分排名/登录/数据库/投递收件箱

---

## 4. 环境 & 启动命令

### 启动后端(本地)
```bash
cd /c/Users/Lenovo/Adventure-x-hackathon/backend
MSYS_NO_PATHCONV=1 pnpm build
MSYS_NO_PATHCONV=1 LLM_MODE=mock PORT=3001 node dist/server.js
```
看到 `🚀 AI Career Copilot API running on http://localhost:3001` 就起来了。

### 测试接口(避开代理坑)
本机有代理 `HTTP_PROXY=127.0.0.1:1080`(Privoxy),**会截胡 `127.0.0.1` 的请求**。
- 测接口用 `node fetch` 直连,或 `curl --noproxy localhost`
- 浏览器**务必用 `localhost`,不要用 `127.0.0.1`**

### 端口被占
```bash
powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id \$_ -Force -ErrorAction SilentlyContinue }"
```

### 测试 & 构建
```bash
cd backend
MSYS_NO_PATHCONV=1 pnpm test       # 107 个测试
MSYS_NO_PATHCONV=1 pnpm typecheck  # 类型检查
MSYS_NO_PATHCONV=1 pnpm build      # 编译到 dist/
```

---

## 5. 后端接口速查(前端调用用这个)

所有接口 `POST` + `JSON`,返回 `{ok, data, mode}` 或 `{ok:false, error, mode}`。
`mode` ∈ `mock`/`live`/`fallback`,**前端必须看 mode 并老实标出来**(诚信卖点)。

```
POST /api/seeker/analyze   入 {jdText, oldResume?}    出 {jobProfile, questions[5~8]}
POST /api/seeker/facts     入 {jobProfile, questions, answers, oldResume?}  出 {facts[{sourceQuote}], missingInformation[]}
POST /api/seeker/generate   入 {jobProfile, confirmedFacts[confirmed:true]}  出 {resume{bullets带evidenceIds}, missingInformation[], interviewRisks[]}
POST /api/employer/analyze  入 {jobTitle, roughRequirement}  出 {jobProfile, questions[3~5]}
POST /api/employer/generate 入 {jobTitle, roughRequirement, jobProfile, questions, answers}  出 {standardizedJD, screeningDimensions[权重和=100], interviewQuestions[正好5道]}
```

**核心卖点数据**:求职者端的 `interviewRisks` 和企业端的面试题,背后是同一个引擎——演示时点出"双端同引擎"。

---

## 6. 文件地图(改代码用)

```
backend/
  src/contracts/  schemas.ts(契约单一来源) types.ts http.ts
  src/llm/        index.ts(三态开关板) log.ts(脱敏)
  src/mocks/      seeker.ts(从JD派生) employer.ts
  src/routes/     seeker.ts employer.ts(★新接口) + resume/job/interview/chat/config/auth(旧,保留)
  src/services/   seeker.ts(反编造校验) employer.ts(反歧视) errors.ts
  src/server.ts   Express入口,静态页面白名单
  test/           6个文件107测试
student-resume.html   路A/B简历流程(★核心)
student-match.html    岗位对齐图
student-interview.html 面试体检
index.html            飞轮首页
css/style.css         全站浅色样式
team-contract/        API-CONTRACT.md TEAM-RULES.md(红线)
DEPLOY.md             部署+协作说明
render.yaml           一键部署配置
README.md             项目入口+Deploy按钮
```

实验残渣(不在 main,只在 Jin-Ziyao):`SPRINT-HANDOFF.md`、`PROJECT-HANDOFF.md`、`HANDOFF-NEW-SESSION.md`、`task-prompts/`、`interview.html`/`chat.html`/`resume.html`/`lab.html`/`resume-builder.html`/`resume-editor/`/`frontend/`/`start-*.sh`。

---

## 7. 接手后第一件事该做什么

1. `git branch --show-current` 确认在 `Jin-Ziyao`
2. 读 `AGENTS.md`、`team-contract/TEAM-RULES.md`、`DEPLOY.md`、本文件
3. **不要急着改代码**。先问用户当前最急的是哪个:部署 / 路A路B验证 / 接真AI / 写文件夹说明
4. 等用户指示再动

---

## 8. 已知坑位(省得踩)

1. **本机代理截胡 127.0.0.1**:浏览器和 fetch 都用 `localhost`,别用 `127.0.0.1`
2. **改了后端要重新 build**:改 `backend/src/*.ts` 后必须 `pnpm build` 再启动,否则跑的是旧 dist
3. **mock 会从 JD 派生**:贴不同 JD 返回不同岗位画像(不是写死 SQL/Excel 了),但仍是规则派生不是真 AI
4. **Render 免费版冷启动**:15 分钟休眠,演示前预热
5. **main 是孤儿提交**:队友本地若有旧 main,pull 会报 non-fast-forward,让他们 `git fetch && git checkout main && git reset --hard origin/main`
6. **并行改同一文件会撞**:多窗口改 `student-resume.html` 时,严格只改自己的区段,只 add 自己的文件

---

## 9. 给用户的交接话术(参考)

> 我把后端做完了,前端也改成了能体现"双端同引擎 + 可溯源"的样子。main 上是干净交付版,带一键部署按钮。现在三件事等你定:① 要不要现在部署 Render 拿线上网址 ② 路A/路B 你本地验证一下通不通 ③ 要不要接真 AI。你说哪个,我就帮你弄哪个。
