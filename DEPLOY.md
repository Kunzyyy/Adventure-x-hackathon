# 部署 & 协作说明(给队友看)

> 本文件讲两件事:**①怎么把网站部署上线** ②**怎么协作改代码不互相打架**。
> 不会技术也能看懂,按步骤来。

---

## 一、一键部署到 Render(推荐,5 分钟)

网站是"前端页面 + 后端服务"一起跑的。我们用 [Render](https://render.com) 免费版部署,**一个服务同时跑前后端**,部署完就有一个网址(如 `https://ai-career-copilot.onrender.com`),点开就能用。

### 步骤

1. 点仓库 README 里的 **"Deploy to Render"** 按钮(或直接访问:
   `https://render.com/deploy?repo=https://github.com/Kunzyyy/Adventure-x-hackathon`)
2. 用 GitHub 账号登录 Render(免费)
3. 点 **Apply** 或 **Create**,Render 会自动:
   - 拉取 main 分支代码
   - 装依赖 + 编译后端
   - 启动服务
4. 等 2-5 分钟,部署完成后 Render 会给你一个网址
5. 点开网址,完整网站可用(点 AI 功能也通,因为后端在云端跑着 mock)

### 配置说明(已在 `render.yaml` 里,一般不用改)

- 运行模式:`LLM_MODE=mock`(用演示数据,不需要 AI key)
- 自动重新部署:`autoDeploy: true`(以后 push 到 main,Render 自动重新部署,网址内容更新)
- 健康检查:`/api/health`

### 想接真 AI(可选,以后再说)

在 Render 控制台的 "Environment" 里加一个环境变量:
- `AI_API_KEY` = 你的真实 API key
- 把 `LLM_MODE` 改成 `live`

不接也完全能演示,mock 模式够用,而且诚实标着 🔸mock。

---

## 二、本地怎么跑起来(改代码前先会跑)

### 前置:装 pnpm

```bash
npm install -g pnpm
```

### 跑起来

```bash
git clone https://github.com/Kunzyyy/Adventure-x-hackathon.git
cd Adventure-x-hackathon
git checkout main              # 在 main 基础上拉一份

# 启动后端(含前端页面)
cd backend
pnpm install                   # 装依赖(第一次才需要)
pnpm build                     # 编译
LLM_MODE=mock PORT=3001 node dist/server.js   # 启动
```

看到 `🚀 AI Career Copilot API running on http://localhost:3001` 就成功了。

浏览器打开:
- 首页:`http://localhost:3001/`
- 简历页:`http://localhost:3001/student-resume.html`
- 对齐图:`http://localhost:3001/student-match.html`
- 面试体检:`http://localhost:3001/student-interview.html`
- 企业端:`http://localhost:3001/enterprise.html`

### Windows 用户注意

- 用 Git Bash 或 WSL 跑命令,别用 cmd
- 命令前加 `MSYS_NO_PATHCONV=1`(路径转换坑)
- 本机有代理(127.0.0.1:1080),浏览器**务必用 `localhost`,不要用 `127.0.0.1`**,否则被代理截胡

---

## 三、怎么改代码(协作铁律)

### 规矩:本地改好看了,再推 GitHub

GitHub 上的 main 是**对外已确认的成果**。本地是草稿台。

1. **在自己分支改**,不要直接动 main
   - Jin → `Jin-Ziyao`
   - 郑鑫尧 → `Zheng-Xinyao`
   - 陈鹏宇 → `Chen-Pengyu`
2. 本地改完,在 `localhost:3001` 看效果,确认没问题
3. `git add <你改的文件>`(不要 `git add .`,会抢别人的)、`git commit`
4. `git push origin <你的分支>`
5. **要合进 main 时,群里说一声,三个人一起决定**,别自己合

### 怎么让云端的网址更新

main 上的代码更新了,Render 自动重新部署。所以:

```
你的分支改好 → push 到自己分支 → 三人确认后合进 main → Render 自动更新网址
```

---

## 四、重要约束(不能碰的红线)

来自 `team-contract/TEAM-RULES.md`,改代码前必读:

- 不能改 5 个 API 的路径和字段名
- 不能跳过"求职者确认事实"这一步
- 不能丢弃 `sourceQuote`、`evidenceIds`、`missingInformation`、`interviewRisks`
- **不能编造**:不能把"参与"改"负责"、"了解"改"精通",不能编数字/公司/奖项
- **不能歧视**:企业端不能生成性别/年龄/婚育/籍贯/外貌条件
- 不做候选人评分排名、不做登录、不做数据库、不做投递收件箱

---

## 五、现在网站能做什么(卖点)

- **双端同引擎**:求职者端和企业端用同一个"岗位理解引擎",首页画了飞轮
- **可溯源**:简历每句话点开能看"你当时说的原话"(sourceQuote),反 AI 编造
- **诚实对齐**:岗位匹配用红黄绿证据状态,不编造匹配分数
- **面试体检**:基于简历风险追问,不背通用题库
- **mode 标识**:所有 AI 结果标 🟢live / 🔸mock / ⚠️fallback,不装真 AI

---

## 六、卡住了怎么办

- 页面打不开 → 后端没启动,看终端有没有 `🚀 AI Career Copilot API running`
- 点 AI 报"连不上后端" → 浏览器用 `localhost` 别用 `127.0.0.1`
- `pnpm` 找不到 → `npm install -g pnpm`
- 端口 3001 被占 → 杀进程:`powershell -c "Get-NetTCPConnection -LocalPort 3001 | %{Stop-Process -Id $_.OwningProcess -Force}"`
- 改了代码没生效 → 后端要重新 `pnpm build` 再启动;前端页面浏览器 `Ctrl+F5` 强刷
