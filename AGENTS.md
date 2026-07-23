# 仓库协作与分支安全规则

## Jin Ziyao 的工作边界

- 新会话开始时，先完整阅读根目录 `handoff.md` 和 `docs/MVP-WORKFLOW.md`，再决定下一步工作。
- 默认且唯一允许工作的分支是 `Jin-Ziyao`。
- 开始任何写操作前，必须运行 `git branch --show-current`，结果必须严格等于 `Jin-Ziyao`。
- 代码、文档、配置、提交和推送都只允许发生在 `Jin-Ziyao`。
- 推送时使用明确目标：`git push origin HEAD:Jin-Ziyao`。
- 不检出、不修改、不合并、不变基、不重置、不删除 `main`。
- 不检出、不修改、不合并、不变基、不重置、不删除其他成员的分支，包括但不限于 `Zheng-Xinyao`、`Chen-Pengyu`。
- 未经用户在当前对话中明确授权，不得创建 PR 合并到 `main`，也不得直接向 `main` 推送。
- 如果任务必须改动 `main` 或其他成员分支，立即停止并向用户说明原因，等待明确授权。
- 提交前检查 `git status --short --branch`；如果当前分支不是 `Jin-Ziyao`，不得继续。

## 个人负责范围

Jin Ziyao 主要负责 AI 与后端：

- 共享 TypeScript 类型和 API 契约
- JD 结构化解析
- 动态追问生成
- 求职者真实事实提取、确认和来源追踪
- 岗位定制简历生成
- 企业标准 JD、筛选维度和面试问题生成
- LLM 调用、结构校验、重试、超时、MOCK 和测试

默认不修改队友负责的页面视觉和交互；如接口调整会影响页面，先更新契约文档并通知相关队友。
