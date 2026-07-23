# Task 6：已确认事实生成岗位定制简历

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请执行 handoff.md 中的 Task 6：把POST /api/seeker/generate从MOCK接成真实AI，只使用用户确认的事实生成可追溯的一页岗位定制简历。

开始前完整阅读AGENTS.md、handoff.md、team-contract/README.md、team-contract/API-CONTRACT.md、team-contract/TEAM-RULES.md、docs/MVP-WORKFLOW.md和task-prompts/README.md。运行git branch --show-current并确认严格为Jin-Ziyao；运行git status --short --branch。只修改Jin-Ziyao，不操作其他分支，不创建Next.js，未经当前窗口授权不提交或推送。

前置条件：Task 0—5全部完成；Task 5输出事实已经可以在页面确认、编辑、删除，或至少对应接口和Schema已经测试通过。缺少Task 1 Schema、Task 3 Client或Task 5事实来源逻辑时立即停止，不在本Task补写另一套实现。

先用大白话解释：这个接口只能拿用户亲自确认过的事实重新排序和润色，不能给用户“补经历”。每条简历内容都要带事实ID，像引用证据一样能回到用户原话。

接口必须严格保持：
POST /api/seeker/generate
请求：{jobProfile:JobProfile, confirmedFacts:CandidateFact[]}
成功data：{resume:GeneratedResume, missingInformation:string[], interviewRisks:string[]}
外层使用统一APIResponse。

注意：当前契约规定interviewRisks是string[]。旧student.html的MOCK可能使用{risk,relatedFactId}[]，不能为了迁就旧页面修改后端契约；应在汇报中明确列为前端待调整项。

输入规则：
1. 使用SeekerGenerateRequest Schema。
2. confirmedFacts至少一条。
3. 每条事实必须confirmed:true。
4. 事实ID唯一，statement和sourceQuote非空。
5. 不接受未确认、已删除或重复事实。

生成硬规则：
1. 只能使用本次confirmedFacts中的信息。
2. 可以调整顺序、压缩和改善表达，但不能增加事实、数字、技能、学校、公司、奖项和结果。
3. “参与”仍不能写成“负责/主导”，“了解”不能写成熟练。
4. GeneratedResume只包含title、summary、education、experiences和skills；missingInformation与interviewRisks在resume外层同级返回。
5. 每个ResumeBullet的evidenceIds至少一个、不能重复，并且全部引用本次confirmedFacts。
6. 没有教育事实时education返回[]，不能生成示例学校；没有某类事实时对应数组为空。
7. 缺少的岗位能力进入missingInformation，不能偷偷写进简历。
8. 容易被追问、证据较弱或熟练度有限的内容进入interviewRisks，但风险描述也不能增加新事实。
9. 返回结构化内容，不返回整段Markdown，不负责PDF、模板或页面排版。

校验和安全：
- 输出先通过SeekerGenerateData Schema。
- 再交叉验证所有evidenceIds。
- 检查输出文本是否出现输入事实完全没有的明显专有名词和数字；可实现确定性的证据检查，但不要声称能用简单规则完全解决语义编造。
- 失败按Task 3重试一次，仍失败返回统一错误或fallback。
- 输入作为不可信数据块，不能覆盖系统规则。

测试至少包括：
1. 正常确认事实生成结构化简历。
2. confirmed:false输入被拒绝。
3. 空confirmedFacts被拒绝。
4. AI返回空evidenceIds被拦截。
5. 引用不存在、重复或已删除事实被拦截。
6. 没有教育事实时不生成学校。
7. 缺少SQL等岗位能力时只进入missingInformation。
8. “基础PR”不写成熟练PR。
9. 三个不同事实组合只生成各自支持的内容。
10. mock/live/fallback、错误JSON、结构错误路径。
11. 编译、单元测试和HTTP接口测试。

完成标准：所有核心简历内容可追溯；没有无证据内容；未确认事实不会进入；缺失信息和风险正确分离；契约不变；前端可编辑结构化结果。

范围限制：不修改PDF和模板，不实现候选人评分，不修改页面视觉，不改Task 4/5接口，不删除旧接口。

最终汇报：说明“只用确认事实”的保护如何实现；列出文件、交叉校验和测试；举一个evidenceIds追溯示例；列出前端interviewRisks格式待调整问题；报告编译、HTTP测试、git status。未经明确授权不要提交或推送。
```
