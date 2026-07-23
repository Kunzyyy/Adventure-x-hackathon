# Task 1：共享 TypeScript 类型和 Zod 校验

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请开始执行 handoff.md 中的 Task 1：把已经冻结的文档契约落成可运行的 TypeScript 类型和 Zod 校验。

一、开始前必须完整阅读
1. 根目录 AGENTS.md
2. 根目录 handoff.md
3. team-contract/README.md
4. team-contract/API-CONTRACT.md
5. team-contract/TEAM-RULES.md
6. docs/MVP-WORKFLOW.md
7. task-prompts/README.md

不得只读摘要。API路径、字段名、层级、必填规则和示例以 team-contract/API-CONTRACT.md 为唯一来源。

二、分支和现有改动安全
1. 运行 git branch --show-current，必须严格输出 Jin-Ziyao。
2. 运行 git status --short --branch，先保护用户和其他窗口已有改动。
3. 只能修改 Jin-Ziyao，不得检出、修改、合并、重置或推送 main、Zheng-Xinyao、Chen-Pengyu 等分支。
4. 不得创建 Next.js。公共候选技术栈是 Vite + React + Express + TypeScript。
5. 未经用户在当前窗口明确授权，不提交、不推送、不创建PR。

三、强制前置检查
Task 0 必须已经完成，而且 Jin-Ziyao 当前工作树中必须真实存在团队认可的公共 package.json 和 backend/ Express + TypeScript 骨架。

如果 backend/ 不存在，或最终公共骨架仍只存在于 origin/Zheng-Xinyao，立即停止写操作。向用户报告：“Task 1 被 Task 0 阻塞，不能在空分支重新创建另一套 backend，也不能复制或合并队友分支。”不要为了继续任务而自行搭建工程。

四、先向用户解释
用通俗中文说明：Task 1 相当于给前端和后端建立同一张数据表格，并让 Zod 在程序运行时检查数据有没有缺栏目、错类型或违反数量规则。说明本Task不连接真实AI、不做页面。

五、实施目标
在现有 backend 工程和目录规范内，建立共享类型与运行时Schema。优先使用 backend/src/contracts/ 或现有工程认可的等价目录，不新建平行工程。

必须实现以下类型及对应Zod Schema：
- APIMode
- JobProfile
- AIQuestion
- QuestionAnswer
- CandidateFact
- ResumeBullet
- GeneratedResume
- RecruitmentKit
- APIErrorCode
- APIError
- APIResponse<T>
- SeekerAnalyzeRequest / SeekerAnalyzeData
- SeekerFactsRequest / SeekerFactsData
- SeekerGenerateRequest / SeekerGenerateData
- EmployerAnalyzeRequest / EmployerAnalyzeData
- EmployerGenerateRequest

类型应尽可能从Zod Schema推导，或保证类型与Schema只有一个事实来源，避免两份定义逐渐不一致。

六、必须实现的校验
1. 必填字符串去除首尾空格后不能为空。
2. 必填数组必须存在，没有内容时使用空数组，不能使用null。
3. ID必须是非空字符串；同一数据包内要求唯一的ID必须检查重复。
4. 求职者问题严格为5—8道。
5. 企业问题严格为3—5道。
6. answerType为choice时，options至少两个、非空且不重复；其他题型不能携带options。
7. answers中的questionId必须引用本次请求的问题，不能重复回答同一问题。
8. 所有required问题必须有非空回答。
9. /api/seeker/facts输出的每条事实必须confirmed:false。
10. /api/seeker/generate输入事实至少一条并全部confirmed:true。
11. 每条ResumeBullet至少有一个evidenceId；同一条中不能重复；必须引用本次输入的confirmedFacts。
12. screeningDimensions至少一项，每项weight为正整数，总和严格等于100。
13. interviewQuestions严格等于5道。
14. API成功响应必须有data且不能有error；失败响应必须有error且不能有data。
15. mode只能是live、mock或fallback。

Zod不能完全判断AI是否编造或是否包含歧视性条件，这类规则要明确留给业务校验和Task 9测试，不能假装Schema已经解决。

七、依赖和文件范围
1. 检查backend/package.json后再添加zod，保留现有包管理器和项目风格。
2. 如果工程没有测试工具，选择最小且与现有TypeScript配置兼容的方案，并说明选择理由。
3. 不修改前端视觉、静态HTML、旧接口业务逻辑或PDF功能。
4. 不删除旧backend路由；本Task只建立契约层、依赖和测试。

八、测试要求
至少覆盖：
- team-contract中的合法示例可以通过。
- 缺少必填字段失败。
- 空字符串失败。
- 求职者问题少于5或多于8失败。
- 企业问题少于3或多于5失败。
- choice没有options或options重复失败。
- 回答引用不存在的问题失败。
- facts响应中confirmed:true失败。
- generate输入含confirmed:false失败。
- evidenceIds为空、重复或引用不存在事实失败。
- 权重总和不为100失败。
- 面试题不是5道失败。
- 同时带data和error的响应失败。

运行TypeScript编译、测试和项目已有的相关检查。不能只写文件不运行验证。

九、完成标准
- 类型和Schema可以编译。
- 合法示例全部通过。
-上述非法情况全部被拒绝。
- 没有改变API-CONTRACT字段。
- 没有创建Next.js或第二套backend。

十、最终汇报格式
1. 用大白话说明现在前后端统一了什么。
2. 列出新增和修改的文件。
3. 列出运行的命令及结果。
4. 说明Task 1是否完整完成。
5. 如果仍有阻塞，明确写出阻塞，不把“只写了类型”说成全部完成。
6. 报告git status和是否存在未提交改动。
```
