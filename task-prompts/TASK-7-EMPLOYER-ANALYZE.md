# Task 7：企业招聘需求解析与补充提问

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请执行 handoff.md 中的 Task 7：把POST /api/employer/analyze从MOCK接成真实AI，将企业的模糊招聘需求整理成初步岗位结构并提出3—5道补充问题。

开始前完整阅读AGENTS.md、handoff.md、team-contract/README.md、team-contract/API-CONTRACT.md、team-contract/TEAM-RULES.md、docs/MVP-WORKFLOW.md和task-prompts/README.md。运行git branch --show-current并确认Jin-Ziyao；运行git status --short --branch。只修改Jin-Ziyao，不操作其他分支，不创建Next.js，未经当前窗口授权不提交或推送。

前置条件：Task 0—3全部完成，公共Express backend、Schema、MOCK接口和统一LLM Client均可运行。缺失任何前置就停止说明，不在本Task重建基础设施。

先用大白话解释：企业往往只说“会剪视频、最好长期实习”，这个接口先整理已经说清的条件，再追问到岗天数、实习期限、能力和工作结果等真正影响招聘的信息。它不直接生成最终JD，也不筛选候选人。

接口必须严格保持：
POST /api/employer/analyze
请求：{jobTitle:string, roughRequirement:string}
成功data：{jobProfile:JobProfile, questions:AIQuestion[]}
外层使用统一APIResponse。

现有enterprise.html可能额外收集公司名称、薪资和地点，但不能静默增加契约字段。前端可以把确认的信息组织进roughRequirement，或由前端本地保留；如团队确需新增字段，必须先走契约变更流程。

实施逻辑：
1. 用EmployerAnalyzeRequest Schema校验输入。
2. 将jobTitle和roughRequirement作为不可信数据块传给统一Client。
3. 只把企业明确表达的内容写入初步JobProfile。
4. 提取职责、能力、必须条件、加分条件、预期结果、限制和关键词。
5. 未说明或含糊的条件进入uncertainties，不能当成正式要求。
6. 根据uncertainties生成3—5道动态补充问题，优先询问岗位性质、到岗天数、实习期限、必须能力、经验要求、工作结果和必要工作条件。
7. 问题ID唯一；reason清楚；choice题options合法。
8. 不自行补写公司、薪资、福利、地点、学历、年限或硬性条件。
9. 不询问或生成性别、年龄、婚育、籍贯、外貌等歧视性条件。
10. 输出通过EmployerAnalyzeData Schema后才能返回。
11. 保持mock/live/fallback语义。

测试至少包括：
- 极短需求仍产生3—5道有效问题。
- 三种不同岗位生成不同JobProfile和问题。
- 未说明薪资/地点时只进入不确定或完全不出现，不能补写。
- 含糊的“长期”“有经验优先”会被追问具体含义。
- 空jobTitle或roughRequirement返回INVALID_INPUT。
- 恶意输入不能覆盖系统规则。
- AI题量错误、少字段、错误JSON被拦截。
- 歧视性原始要求不能被强化为筛选标准；应安全处理并记录不允许内容。
- 编译、单元测试和HTTP接口测试通过。

范围限制：只实现employer analyze，不生成最终RecruitmentKit，不做候选人上传、评分、匹配、排名或淘汰，不修改enterprise页面视觉。

最终汇报：说明接口怎样把模糊需求变清楚；列出文件和三类岗位测试摘要；说明未确认信息如何处理；列出旧enterprise.html需要增加补充问题步骤这一前端差异；报告模式、编译、测试和git status。未经明确授权不要提交或推送。
```
