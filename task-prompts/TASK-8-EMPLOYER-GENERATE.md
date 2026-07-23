# Task 8：企业招聘材料生成

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请执行 handoff.md 中的 Task 8：把POST /api/employer/generate从MOCK接成真实AI，生成标准JD、筛选维度和固定5道面试题。

开始前完整阅读AGENTS.md、handoff.md、team-contract/README.md、team-contract/API-CONTRACT.md、team-contract/TEAM-RULES.md、docs/MVP-WORKFLOW.md和task-prompts/README.md。运行git branch --show-current并确认Jin-Ziyao；运行git status --short --branch。只修改Jin-Ziyao，不操作其他分支，不创建Next.js，未经当前窗口授权不提交或推送。

前置条件：Task 0—3完成，Task 7的jobProfile、questions和answers流程已经实现并测试。缺少前置就停止，不在本Task重写Task 7或基础设施。

先用大白话解释：这个接口把企业最初的模糊描述和补充回答合并，生成一份可编辑的标准招聘材料。筛选维度只供人工参考，不是AI替企业决定录用谁。

接口必须严格保持：
POST /api/employer/generate
请求：{jobTitle,roughRequirement,jobProfile,questions,answers}
成功data直接是完整RecruitmentKit，不额外套recruitmentKit字段。
外层使用统一APIResponse。

输入规则：
1. 使用EmployerGenerateRequest Schema。
2. questions必须3—5道且ID唯一。
3. answers只能引用输入问题，必答题都有非空回答。
4. 原始需求、岗位结构和回答作为不可信数据块。

生成规则：
1. 合并原始需求和补充回答，只把已确认信息写入最终JobProfile。
2. standardizedJD包含title、summary、responsibilities、requirements、niceToHaves和workingConditions。
3. 清楚区分必须条件和加分条件，不擅自提高门槛。
4. screeningDimensions至少一项；每项包含name、weight、description、evidenceToLookFor。
5. weight均为正整数，总和严格等于100。
6. interviewQuestions严格5道，每题包含question、competency、purpose、strongAnswerSignals和可选followUpQuestion。
7. 问题围绕岗位工作和可验证证据，不询问隐私或无关个人特征。
8. 不生成性别、年龄、婚育、籍贯、外貌等歧视性标准。
9. 不输出自动录用、自动淘汰、候选人排名或匹配分数。
10. 不凭空补写公司、薪资、福利、地点和工作条件。
11. 输出通过RecruitmentKit Schema及权重/题量业务校验后才能返回。
12. 错误输出按Task 3最多重试一次，仍失败返回统一错误或fallback。

与现有enterprise.html的边界：
- 旧页面“人才评分模型”只能改为“人工筛选参考维度”。
- 旧页面6道面试题必须调整为5道并展示能力、目的和优秀信号。
- 旧页面AI匹配引擎、候选人评分和筛选不属于MVP，后端不提供这些数据。
- 本Task不直接修改页面，但最终汇报必须明确这些联调要求。

测试至少包括：
- 完整RecruitmentKit合法通过。
- 权重99、101、小数、负数或零被拒绝。
- 面试题4道或6道被拒绝。
- 缺少strongAnswerSignals被拒绝。
- 原始信息未提供薪资时不生成薪资。
- 输入含歧视性要求时输出不包含该条件。
- 输出出现自动淘汰结论时被业务检查拒绝。
- 三种岗位生成岗位相关而非固定模板的维度和问题。
- mock/live/fallback、错误JSON和超时路径。
- 编译、单元测试和HTTP接口测试。

完成标准：标准JD完整、权重严格100、问题严格5道、无歧视条件和自动决策、契约不变。

范围限制：不上传候选人简历，不评分排名，不保存或发布岗位，不做账号权限，不修改页面视觉。

最终汇报：用大白话说明生成了哪些招聘材料；列出文件、校验和测试；展示权重总和和题量验证；列出enterprise.html联调调整；报告模式、编译、测试和git status。未经明确授权不要提交或推送。
```
