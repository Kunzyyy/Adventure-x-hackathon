# AI 求职助手：三天最小 MVP 工作流

## 1. 一句话定义

我们只做一个网站、两个入口、一个共享核心：

> 让企业先说清楚“岗位需要什么”，再帮助求职者用真实事实证明“自己为什么适合”。

两个入口不是两个完整产品：

- 求职者端是主产品，完成从目标 JD 到真实、可投递简历的完整闭环。
- 企业端是演示型功能，只把模糊招聘需求变成标准 JD、筛选维度和面试问题。
- 两端共用同一个“岗位理解引擎”，第一版不做候选人上传、排名、录用和招聘管理。

## 2. MVP 的完整业务流程

```text
首页
├── 我是求职者
│   ├── 1. 输入目标 JD 和可选旧简历
│   ├── 2. AI 解析岗位并提出 5—8 个问题
│   ├── 3. 用户回答，AI 整理成事实卡片
│   ├── 4. 用户确认、修改或删除事实
│   ├── 5. AI 仅使用已确认事实生成一页简历
│   └── 6. 用户查看事实来源、缺失信息和面试风险，编辑并复制
│
└── 我是招聘方
    ├── 1. 输入岗位名称和模糊招聘需求
    ├── 2. AI 解析需求并提出 3—5 个问题
    ├── 3. 企业回答补充问题
    ├── 4. AI 生成标准 JD、必须条件和加分条件
    └── 5. AI 生成筛选维度和 5 道面试题，企业编辑并复制
```

## 3. 先冻结共享数据结构

前后端并行开发的前提不是 Prompt，而是接口结构不再随意变化。

### 3.1 岗位结构 `JobProfile`

两个端必须共用同一种岗位结构。

```ts
export interface JobProfile {
  jobTitle: string;
  employmentType?: string;
  seniority?: string;
  responsibilities: string[];
  coreCompetencies: string[];
  mustHaves: string[];
  niceToHaves: string[];
  expectedOutcomes: string[];
  constraints: string[];
  keywords: string[];
  uncertainties: string[];
}
```

### 3.2 动态问题 `AIQuestion`

```ts
export interface AIQuestion {
  id: string;
  text: string;
  reason: string;
  answerType: 'text' | 'number' | 'choice';
  required: boolean;
}
```

### 3.3 求职者事实 `CandidateFact`

```ts
export interface CandidateFact {
  id: string;
  category:
    | 'education'
    | 'project'
    | 'internship'
    | 'skill'
    | 'activity'
    | 'other';
  statement: string;
  sourceQuestionId?: string;
  sourceQuote: string;
  confirmed: boolean;
}
```

### 3.4 简历内容必须绑定事实

```ts
export interface ResumeBullet {
  text: string;
  evidenceIds: string[];
}

export interface GeneratedResume {
  title: string;
  summary: ResumeBullet[];
  education: ResumeBullet[];
  experiences: Array<{
    name: string;
    bullets: ResumeBullet[];
  }>;
  skills: ResumeBullet[];
  missingInformation: string[];
  interviewRisks: string[];
}
```

### 3.5 企业招聘材料 `RecruitmentKit`

```ts
export interface RecruitmentKit {
  jobProfile: JobProfile;
  standardizedJD: {
    title: string;
    summary: string;
    responsibilities: string[];
    requirements: string[];
    niceToHaves: string[];
    workingConditions: string[];
  };
  screeningDimensions: Array<{
    name: string;
    weight: number;
    description: string;
    evidenceToLookFor: string[];
  }>;
  interviewQuestions: Array<{
    question: string;
    competency: string;
    purpose: string;
    strongAnswerSignals: string[];
    followUpQuestion?: string;
  }>;
}
```

筛选维度权重总和必须为 100。所有标准必须与岗位工作相关，禁止生成性别、年龄、婚育、籍贯、外貌等歧视性条件。

## 4. 五个后端流程：每一步做什么、交付什么、同步什么

所有接口统一返回：

```ts
export interface APIResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  mode: 'live' | 'mock' | 'fallback';
}
```

### 流程 A：求职者岗位解析与动态提问

接口：`POST /api/seeker/analyze`

输入：

```json
{
  "jdText": "完整目标岗位JD",
  "oldResume": "可选的旧简历"
}
```

输出：

- `jobProfile`：解析后的岗位结构。
- `questions`：5—8 个动态问题。

AI逻辑：

1. 从 JD 提取职责、能力、必须条件、加分条件和工作结果。
2. 对照旧简历判断缺少哪些关键证据。
3. 优先询问与岗位最相关、最可能找到真实证据的问题。
4. 不诱导用户编造数字、奖项、经历和技能。

Jin Ziyao 可以独立完成：

- Prompt、模型调用、结构校验、接口、MOCK和后端测试。

必须告诉求职者端队友：

- 接口地址、输入字段、问题结构、问题数量。
- `oldResume` 是可选字段。
- 加载、失败和 `mode` 的展示方式。
- 任何字段改名必须先更新本文件再通知队友。

完成标准：

- 输入三种不同岗位时，问题能随 JD 改变。
- 问题数量为 5—8。
- 只问岗位相关信息，不要求用户虚构经历。

### 流程 B：回答整理为真实事实

接口：`POST /api/seeker/facts`

输入：

- `jobProfile`
- 问题和用户回答
- 可选旧简历

输出：

- `facts`：待用户确认的事实卡片。
- `missingInformation`：仍缺少的重要信息。
- 每条事实都包含 `sourceQuote`。

AI逻辑：

1. 只整理用户明确提供的信息。
2. “参与”不能升级成“负责”，“了解”不能升级成“精通”。
3. 用户没说过的数字、奖项、公司、工具和结果不能出现。
4. 所有事实初始为 `confirmed: false`。

Jin Ziyao 可以独立完成：

- 事实提取Prompt、接口、来源检查、结构校验和测试。

必须告诉求职者端队友：

- 前端必须提供确认、编辑和删除事实的交互。
- 用户编辑后的事实才可以把 `confirmed` 改为 `true`。
- 生成简历时只能发送已确认事实。
- `sourceQuote` 需要在事实卡片中向用户展示。

完成标准：

- 每条事实有唯一ID和原始来源。
- AI没有把模糊表达夸大成确定能力。
- 删除或未确认的事实不会进入下一步。

### 流程 C：生成一页岗位定制简历

接口：`POST /api/seeker/generate`

输入：

- `jobProfile`
- `confirmedFacts`

输出：

- `resume`：结构化的一页简历。
- `missingInformation`：与岗位相比仍缺少的证据。
- `interviewRisks`：简历投递后可能被追问的地方。

AI逻辑：

1. 只允许使用 `confirmed: true` 的事实。
2. 每条简历内容必须携带一个或多个 `evidenceIds`。
3. 可以优化顺序和表达，但不能增加事实。
4. 缺少的能力放进 `missingInformation`，不能偷偷写入简历。
5. 对证据较弱或表述容易被追问的内容生成面试风险提示。

Jin Ziyao 可以独立完成：

- 简历生成Prompt、证据ID校验、接口、错误处理和AI测试。

必须告诉求职者端队友：

- 返回的是结构化内容，不是不可编辑的整段文本。
- 页面要能查看来源、编辑结果、复制内容。
- PDF导出和页面排版由前端完成，后端不生成PDF。
- 如果某条内容证据不足，页面要显示风险而不是隐藏。

完成标准：

- 所有核心内容都有有效 `evidenceIds`。
- 不存在引用已删除事实的简历内容。
- 用户可以从简历内容找到对应事实来源。

### 流程 D：企业招聘需求解析与补充提问

接口：`POST /api/employer/analyze`

输入：

```json
{
  "jobTitle": "新媒体运营实习生",
  "roughRequirement": "会剪视频，平时发发小红书，最好长期实习"
}
```

输出：

- 初步 `jobProfile`
- 3—5 个补充问题

AI逻辑：

1. 识别已明确的信息和仍然模糊的条件。
2. 优先询问岗位性质、到岗天数、必须能力、工作结果和经验要求。
3. 不补写企业没有确认的薪资、福利、地点和硬性条件。

Jin Ziyao 可以独立完成：

- 共用岗位解析引擎、企业端Prompt、接口、MOCK和测试。

必须告诉企业端队友：

- 接口地址、输入字段、问题结构和问题数量。
- 页面需要岗位名称、招聘需求和补充回答三个状态。
- 未确认内容会进入 `uncertainties`，不能当成正式条件展示。

完成标准：

- 输入很短的招聘需求也能提出 3—5 个有效问题。
- 不凭空补全企业信息。

### 流程 E：生成企业招聘材料

接口：`POST /api/employer/generate`

输入：

- 原始招聘需求
- 初步 `jobProfile`
- 企业补充回答

输出：完整 `RecruitmentKit`

AI逻辑：

1. 合并原始需求和补充回答，生成最终岗位结构。
2. 生成可编辑的标准化 JD。
3. 区分必须条件和加分条件。
4. 生成岗位相关的筛选维度，权重总和为 100。
5. 固定生成 5 道面试题，并说明考察能力和优质回答信号。
6. 拒绝生成与工作无关的歧视性筛选标准。

Jin Ziyao 可以独立完成：

- 生成Prompt、权重校验、反歧视规则、接口、MOCK和测试。

必须告诉企业端队友：

- `standardizedJD`、`screeningDimensions`、`interviewQuestions` 的展示结构。
- 筛选维度是面试参考标准，不是AI录用决定。
- 页面要支持编辑和复制；MVP不保存岗位、不发布岗位。

完成标准：

- 输出包含完整标准JD。
- 筛选权重总和为 100。
- 面试题数量严格等于 5。
- 没有歧视性条件和AI自动录用结论。

## 5. Jin Ziyao 可以直接开发和提交的内容

以下内容只属于 AI 与后端，可直接在 `Jin-Ziyao` 开发、测试和提交：

- `lib/types.ts` 或独立的共享类型目录
- Zod Schema 和响应校验
- 五个 API Route
- LLM Client
- 五套Prompt
- MOCK数据
- 超时、重试、失败降级
- 输入校验和错误码
- AI不乱编测试
- API文档和示例请求

这些实现只要不改变已约定的接口，就不需要等待前端队友批准。

## 6. 必须同步队友后才能改变的内容

以下内容一旦改变，会直接让前端联调失败，不能静默修改：

- API路径
- 请求字段名和必填规则
- 响应字段名和层级
- 问题数量和页面步骤
- 事实确认机制
- `evidenceIds` 和来源展示逻辑
- 错误响应格式
- MOCK/live/fallback状态字段
- 环境变量名称
- 原接口被删除或替换

同步方式：先更新本文件和接口示例，再把变更摘要发给对应队友。队友确认后再按新契约联调。

## 7. LLM基础设施必须一次做好

LLM调用层至少需要：

- 显式 `LLM_MODE=mock` 或 `LLM_MODE=live`
- `temperature: 0`
- 每个接口合理的最大输出长度
- 15—30秒超时
- JSON解析和Zod校验
- 结构失败后重试一次
- 演示时可降级为MOCK，并返回 `mode: fallback`
- 不在日志中输出完整简历、回答和个人敏感信息
- 把JD、简历和回答作为数据包裹，避免其中的指令覆盖系统Prompt

## 8. 三天执行顺序

### Day 1：先让三个人能并行

1. 冻结本文件中的类型和五个接口。
2. 五个接口先返回稳定MOCK。
3. 把接口示例交给两名前端队友。
4. 完成LLM Client。
5. 完成 `/api/seeker/analyze`。

当天验收：前端可以完全依靠MOCK开发；真实模型可以从JD生成5—8个有效问题。

### Day 2：完成求职者主闭环

1. 完成 `/api/seeker/facts`。
2. 完成事实来源和确认机制联调。
3. 完成 `/api/seeker/generate`。
4. 校验每条简历内容的事实ID。
5. 生成缺失信息和面试风险。

当天验收：求职者可以完整走完“JD → 问题 → 事实确认 → 一页简历”。

### Day 3：企业端和演示稳定性

1. 完成企业端两个接口。
2. 与企业端页面联调。
3. 测试AI编造、空输入、超时和无效JSON。
4. 准备一套求职者示例和一套企业示例。
5. 验证MOCK/live切换并录制备用演示。

当天验收：两个入口都能走通，但求职者端明显比企业端更完整。

## 9. MVP停止线

满足以下条件后停止添加功能：

- 求职者端完成JD、动态问题、事实确认和简历生成。
- 简历核心内容可以追溯到用户确认事实。
- 页面能展示缺失信息和面试风险。
- 企业端能把模糊需求变成标准JD、筛选维度和5道面试题。
- 五个接口都有稳定MOCK。
- 真模型至少完成三次端到端测试。
- 模型错误不会让页面崩溃。

第一版明确不做：

- 登录和企业账号
- 数据库和云端简历存储
- 多文件上传和简历解析
- 候选人评分、排名或淘汰
- 求职者投递和企业收件箱
- 双方聊天、面试安排和招聘状态
- 岗位发布平台

## 10. 分支工作流

Jin Ziyao 的所有工作只在 `Jin-Ziyao`：

```powershell
git branch --show-current
# 必须输出 Jin-Ziyao

git pull --ff-only origin Jin-Ziyao
# 修改、测试

git status --short --branch
git add <本次修改的明确文件>
git commit -m "docs: define MVP workflow and AI backend contract"
git push origin HEAD:Jin-Ziyao
```

没有明确授权时，不检出、不修改、不合并、不推送 `main` 或其他人的分支。
