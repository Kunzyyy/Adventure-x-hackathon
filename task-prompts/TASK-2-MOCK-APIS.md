# Task 2：五个稳定 MOCK 接口

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请开始执行 handoff.md 中的 Task 2：在现有Express后端中实现五个稳定MOCK接口，让两个前端不等待真实AI也能开发和联调。

一、开始前必须完整阅读
- AGENTS.md
- handoff.md
- team-contract/README.md
- team-contract/API-CONTRACT.md
- team-contract/TEAM-RULES.md
- docs/MVP-WORKFLOW.md
- task-prompts/README.md

API字段以team-contract/API-CONTRACT.md为唯一来源。

二、分支安全
运行git branch --show-current，必须为Jin-Ziyao；运行git status --short --branch保护已有改动。只允许修改Jin-Ziyao。不得检出、合并或修改其他成员分支，不创建Next.js。未经当前窗口明确授权，不提交或推送。

三、前置门槛
必须确认：
1. Task 0完成，公共Express backend已经存在于Jin-Ziyao。
2. Task 1完整完成，共享TypeScript类型和Zod Schema可以编译并通过测试。

任一条件不满足就停止，报告缺少哪个前置Task。不能复制队友分支，也不能临时写一套没有Schema的接口冒充完成。

四、先向用户解释
用通俗中文说明：MOCK接口是格式与未来真AI完全一致的固定假答案，目的是让前端先把页面按钮、加载、错误和数据显示接通。本Task不调用真实AI。

五、必须实现的路由
- POST /api/seeker/analyze
- POST /api/seeker/facts
- POST /api/seeker/generate
- POST /api/employer/analyze
- POST /api/employer/generate

在现有Express目录结构中创建seeker和employer路由及稳定MOCK数据，并在现有server.ts中注册。不要删除或重写队友已有的/api/resume、/api/job、/api/chat等旧路由。

六、统一处理规则
1. 所有请求先通过Task 1的请求Schema。
2. 所有MOCK数据再通过Task 1的响应Schema，不能手写后直接返回。
3. 成功响应固定为{ok:true,data,mode:'mock'}。
4. 请求非法时返回{ok:false,error:{code:'INVALID_INPUT',message,fieldErrors?},mode:'mock'}。
5. 缺字段或类型错误使用HTTP 400；格式正确但违反业务约束使用HTTP 422。
6. 不返回null数组，不返回契约外字段，不改变字段层级。
7. 不在日志打印完整旧简历、回答或个人敏感信息。

七、MOCK真实性要求
1. facts中的事实必须能逐字追溯到sourceQuote，初始全部confirmed:false。
2. “改短了一点”不能改成“90秒缩短到45秒”；“几次活动”不能改成“3场”。
3. 用户没有提供教育经历时，MOCK简历不能凭空生成学校。
4. 每条简历内容必须有有效evidenceIds；没有来源就不输出该内容。
5. interviewRisks严格按照契约返回string[]，不要照抄旧student.html中的对象数组。
6. 企业筛选权重合计100，面试题正好5道，不包含歧视性条件。

八、前端兼容边界
当前队友分支可能同时存在根目录student.html/enterprise.html和frontend/ React。Task 2只提供后端接口，不修改前端视觉，也不擅自决定最终前端。若发现旧页面与契约不一致，把差异列入汇报交给对应队友修改，不能为了迁就旧MOCK而破坏契约。

九、测试
1. 启动现有Express服务。
2. 对五个接口逐个发送合法请求，检查HTTP状态、ok、data和mode。
3. 用响应Schema再次验证每个响应。
4. 测试空body、缺必填字段、错误问题数量、无确认事实、错误权重等非法请求。
5. 确认旧/api/health和已有路由没有被破坏。
6. 运行TypeScript编译和项目测试。

十、完成标准
- 五个接口都能通过真实HTTP请求返回稳定MOCK。
- 请求和响应全部经过Zod。
- 五个错误响应格式一致。
- 不调用任何真实模型。
- 不修改API契约和前端页面。

十一、最终汇报
用大白话说明前端现在能做什么；列出路由和改动文件；列出五个请求测试结果、编译测试结果和旧接口回归结果；列出需要前端调整的契约差异；报告git status。不要提交或推送，除非用户明确要求。
```
