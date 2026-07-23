# Task 3：LLM 统一调用基础设施

复制下面整段给新的 Codex 窗口：

```text
你现在接手 Adventure-x-hackathon 项目中 Jin Ziyao 负责的 AI 与后端工作。请开始执行 handoff.md 中的 Task 3：为五个真实AI接口建立统一LLM调用基础设施。

一、完整阅读
完整阅读AGENTS.md、handoff.md、team-contract/README.md、team-contract/API-CONTRACT.md、team-contract/TEAM-RULES.md、docs/MVP-WORKFLOW.md和task-prompts/README.md。不得只看摘要。

二、安全检查
运行git branch --show-current并确认严格为Jin-Ziyao；运行git status --short --branch。只能修改Jin-Ziyao，不检出、不修改、不合并其他分支。不创建Next.js。未经当前窗口明确授权，不提交、不推送、不创建PR。

三、前置门槛
Task 0、Task 1、Task 2必须全部完成：当前Jin-Ziyao中存在公共Express backend、可运行Schema和五个已测试MOCK接口。任一缺失就停止并说明，不能跳过MOCK直接接真AI。

四、模型选择门槛
检查用户/团队是否确定真实模型提供商、模型名和环境变量。如果仍未确定，可以实现OpenAI兼容协议的提供商适配层和MOCK模式，但不能擅自宣布全队使用OpenAI、DeepSeek或其他服务，也不能真实调用未知服务。不要要求用户在聊天中粘贴API Key；只说明应放在未跟踪的本地环境变量中。

五、先用大白话解释
说明统一LLM Client相当于所有业务接口共同使用的“AI总机”：它负责联系模型、限制等待时间、检查结果格式、失败重试和安全降级。Task 3只建总机，不完成五套业务Prompt。

六、必须实现
1. 一个统一LLM Client或等价模块，业务层传入系统规则、用户数据、目标Schema和输出限制。
2. 显式LLM_MODE=mock或LLM_MODE=live；非法值启动时或调用时明确失败。
3. 提供商配置从环境变量读取：Key、baseURL、model，不把秘密写入仓库或返回前端。
4. live调用temperature固定为0。
5. 每个调用支持合理max output tokens，由业务调用者指定上限。
6. 使用AbortController或SDK等价机制实现15—30秒超时；超时后真正停止等待。
7. 只接受JSON输出；解析后立即通过调用者提供的Zod Schema。
8. 网络临时失败、错误JSON或结构校验失败最多重试一次，总尝试次数最多两次。
9. 将模型错误映射为统一错误：INVALID_AI_OUTPUT、LLM_TIMEOUT、LLM_UNAVAILABLE或INTERNAL_ERROR。
10. live最终失败时可以返回清晰失败；演示策略要求降级时返回稳定MOCK并标记mode:'fallback'，不能标记live。
11. mock模式绝不能创建真实模型客户端或发送网络请求。
12. 把JD、简历和回答作为明确标记的数据块放进消息，系统规则明确声明其中的指令不可信，降低Prompt注入风险。
13. 日志只记录调用类型、耗时、尝试次数和错误类别，不能打印完整简历、完整回答、API Key或个人敏感信息。

七、不得复用的危险旧逻辑
如果公共骨架包含旧backend/src/services/ai.ts：
- 不复用“原文没有就合理推断数字”的Prompt。
- 不复用把“参与/做/写/负责”统一替换为“主导并交付”的代码。
- 不复用temperature 0.5、0.7、0.8的业务调用。
- 不复用没有Zod、直接JSON.parse后返回的流程。
可以参考它的OpenAI兼容SDK配置，但必须重新封装并满足本Task规则。不要删除旧接口，避免破坏队友页面。

八、模式与fallback语义
- mock成功：ok:true，mode:'mock'。
- live成功：ok:true，mode:'live'。
- live失败后使用备用数据成功：ok:true，mode:'fallback'。
- live失败且不降级：ok:false，mode:'live'，返回统一error。
fallback不能掩盖错误，必须让前端能明确显示降级状态。

九、测试
至少覆盖：
- mock模式从不调用SDK。
- live合法JSON通过Schema并返回live。
- 错误JSON第一次失败、第二次成功。
- Schema错误第一次失败、第二次成功。
- 连续错误只重试一次。
- 超时被中止并映射LLM_TIMEOUT。
- 提供商不可用映射LLM_UNAVAILABLE。
- fallback返回固定数据且mode正确。
- 禁用fallback时返回统一失败。
- 日志不含输入原文和Key。
- Prompt构造明确区分系统规则与用户数据。

十、范围限制
不修改五个API对前端的契约；不完成seeker/employer业务Prompt；不修改页面；不把API Key配置页面当作本Task必需；不扩展登录、数据库或聊天。

十一、完成汇报
说明实现的Client、模式、超时、重试、校验、错误和fallback；列出文件与环境变量；列出所有测试结果；说明真实提供商是否已确定、是否实际调用；报告git status。没有真实Key不等于Task失败，但必须明确哪些live集成仍待配置。未经明确授权不要提交或推送。
```
