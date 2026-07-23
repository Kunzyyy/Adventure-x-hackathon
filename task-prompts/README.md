# Task 1—9 新窗口提示词

> 本文件夹保存 Jin Ziyao 后续 AI 与后端任务的完整提示词。每个 `TASK-N.md` 都可以单独交给一个新的 Codex 窗口，不需要再手动补充公共要求。

## 当前状态

- Task 0 尚未完成。
- 已找到 `Zheng-Xinyao` 分支中的公共候选骨架：Vite + React + Express + TypeScript。
- 队友还没有明确回答：最终使用根目录静态页面还是 `frontend/` React 页面，以及公共骨架怎样同步给 Jin Ziyao。
- 在公共 `backend/` 真正进入 `Jin-Ziyao` 前，不得执行 Task 1—9 的写操作。

## 正确顺序

```text
Task 0 等待队友答复并完成公共骨架同步
    ↓
Task 1 共享类型和Zod
    ↓
Task 2 五个稳定MOCK接口
    ↓
Task 3 LLM统一基础设施
    ↓
Task 4 → Task 5 → Task 6 求职者主闭环
    ↓
Task 7 → Task 8 企业端
    ↓
Task 9 稳定性和端到端测试
```

## 使用方法

完成前置 Task 后，打开一个新窗口，把对应文件中的代码块完整复制给 Codex。例如执行 Task 4 时复制 `TASK-4-SEEKER-ANALYZE.md` 中的全部提示词。

不要让多个窗口同时修改同一个本地仓库。当前规则只允许在 `Jin-Ziyao` 工作，也没有授权创建临时开发分支，所以最安全的方式是一个窗口完成、检查并提交一个 Task，再启动下一个。

## 文件列表

- [Task 1：共享类型和 Zod](./TASK-1-CONTRACTS.md)
- [Task 2：五个稳定 MOCK 接口](./TASK-2-MOCK-APIS.md)
- [Task 3：LLM 统一基础设施](./TASK-3-LLM-INFRA.md)
- [Task 4：求职者 JD 解析与动态提问](./TASK-4-SEEKER-ANALYZE.md)
- [Task 5：求职者回答转事实卡片](./TASK-5-SEEKER-FACTS.md)
- [Task 6：已确认事实生成简历](./TASK-6-SEEKER-GENERATE.md)
- [Task 7：企业招聘需求解析](./TASK-7-EMPLOYER-ANALYZE.md)
- [Task 8：企业招聘材料生成](./TASK-8-EMPLOYER-GENERATE.md)
- [Task 9：稳定性和端到端测试](./TASK-9-TESTING.md)
