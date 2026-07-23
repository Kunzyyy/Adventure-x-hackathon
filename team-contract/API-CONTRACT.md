# MVP API 契约 v1（详细字段版）

> 状态：后端候选字段与响应结构已冻结，等待求职者端和企业端成员确认后共同使用。
>
> 当前仓库尚无公共 Next.js/TypeScript 骨架，因此本文先作为唯一契约来源。公共骨架确定后，必须按本文原样建立 TypeScript 类型和 Zod Schema，不能在落地时静默改字段。

## 1. 这份文档解决什么问题

三个成员可以暂时分别开发页面和后端，但必须对以下内容使用完全相同的约定：

- 五个 API 的地址。
- 请求需要发送哪些字段。
- 响应返回哪些字段。
- 哪些字段必填。
- 成功、失败以及 MOCK 降级如何表示。
- AI 输出需要通过哪些格式和业务检查。

如需改变 API 路径、字段名、字段层级、必填规则、问题数量、事实确认方式、`evidenceIds` 或 `mode`，必须先更新本文并通知对应前端成员。

## 2. 通用约定

- 所有接口都使用 `POST` 和 JSON。
- 请求头使用 `Content-Type: application/json`。
- 所有字符串在校验前去除首尾空格。
- 必填字符串去除首尾空格后不能为空。
- 所有 ID 都是不透明的非空字符串；前端不能根据 ID 猜测业务含义。
- 所有数组都必须存在。没有内容时返回空数组，不能返回 `null`。
- 可选字段可以省略，但不能用 `null` 代替。
- 当前接口无登录状态、数据库和服务端会话，因此后一步必须把所需的上一步数据重新传回后端。
- 成功和失败都必须返回 `mode`，页面据此区分真 AI、MOCK 和降级结果。

## 3. 共享 TypeScript 类型

```ts
export type APIMode = 'live' | 'mock' | 'fallback';

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

export interface AIQuestion {
  id: string;
  text: string;
  reason: string;
  answerType: 'text' | 'number' | 'choice';
  required: boolean;
  options?: string[];
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
}

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
}

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

### 3.1 已冻结的细节

- `AIQuestion.options` 只在 `answerType: 'choice'` 时必填，且至少包含两个不同选项；其他题型不得返回 `options`。
- `QuestionAnswer.answer` 统一使用字符串。数字题也由前端发送字符串，后端按题型校验，避免表单状态出现两种数据类型。
- `/api/seeker/facts` 生成的事实初始必须是 `confirmed: false`。
- 用户在页面确认或编辑事实后，才能把它改为 `confirmed: true` 并发送给简历生成接口。
- `GeneratedResume` 只表示简历正文。`missingInformation` 和 `interviewRisks` 位于生成接口的同级响应中，避免在 `resume` 内外重复。
- `sourceQuestionId` 对回答中提取的事实必填；从可选旧简历提取的事实可以省略，但仍必须提供原文 `sourceQuote`。
- 每个 `ResumeBullet.evidenceIds` 至少有一个事实 ID，且不能重复。

## 4. 统一响应格式

```ts
export type APIErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_AI_OUTPUT'
  | 'LLM_TIMEOUT'
  | 'LLM_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface APIError {
  code: APIErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type APIResponse<T> =
  | {
      ok: true;
      data: T;
      mode: APIMode;
    }
  | {
      ok: false;
      error: APIError;
      mode: APIMode;
    };
```

固定规则：

- 成功响应必须有 `data`，不能有 `error`。
- 失败响应必须有 `error`，不能有 `data`。
- `mode: 'mock'`：没有调用真实模型，返回固定演示数据。
- `mode: 'live'`：结果或错误来自真实模型调用流程。
- `mode: 'fallback'`：真实模型失败后返回了可演示的降级数据；此时仍为 `ok: true`。
- fallback 数据必须在页面明确标识为降级结果，不能伪装成真实模型结果。

建议 HTTP 状态码：

| 状态码 | 使用场景 |
| --- | --- |
| `200` | live、mock 或 fallback 成功 |
| `400` | 请求缺字段、字段类型错误或空输入 |
| `422` | 请求格式正确，但不满足业务约束，例如没有已确认事实 |
| `502` | 模型不可用或返回无法修复的错误结构 |
| `504` | 模型调用超时 |
| `500` | 未预期的服务器内部错误 |

失败示例：

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "请求内容不完整",
    "fieldErrors": {
      "jdText": ["请输入目标岗位JD"]
    }
  },
  "mode": "mock"
}
```

## 5. 五个接口契约

### 5.1 求职者：解析 JD 并提问

```text
POST /api/seeker/analyze
```

```ts
export interface SeekerAnalyzeRequest {
  jdText: string;
  oldResume?: string;
}

export interface SeekerAnalyzeData {
  jobProfile: JobProfile;
  questions: AIQuestion[];
}

export type SeekerAnalyzeResponse = APIResponse<SeekerAnalyzeData>;
```

校验规则：

- `jdText` 必填，不能为空。
- `oldResume` 可选；传入时不能为空字符串。
- `questions` 必须为 5—8 道，ID 不能重复。
- 问题必须与目标岗位相关，不能诱导用户编造经历或数字。

请求示例：

```json
{
  "jdText": "招聘数据分析实习生，负责业务数据整理、指标分析和可视化，要求熟悉SQL和Excel。",
  "oldResume": "参与校园便利店销售数据分析，使用Excel完成数据清洗和图表展示。"
}
```

成功响应示例：

```json
{
  "ok": true,
  "data": {
    "jobProfile": {
      "jobTitle": "数据分析实习生",
      "employmentType": "实习",
      "seniority": "在校生",
      "responsibilities": ["整理业务数据", "分析业务指标", "制作数据可视化"],
      "coreCompetencies": ["数据清洗", "指标分析", "结果表达"],
      "mustHaves": ["SQL", "Excel"],
      "niceToHaves": [],
      "expectedOutcomes": ["形成可理解的业务分析结果"],
      "constraints": [],
      "keywords": ["SQL", "Excel", "数据分析", "可视化"],
      "uncertainties": ["每周到岗天数未说明"]
    },
    "questions": [
      {
        "id": "sq_1",
        "text": "你使用Excel清洗过哪些类型的数据？",
        "reason": "确认数据清洗经验",
        "answerType": "text",
        "required": true
      },
      {
        "id": "sq_2",
        "text": "你是否在真实项目中使用过SQL？请如实说明。",
        "reason": "核实岗位必须技能",
        "answerType": "text",
        "required": true
      },
      {
        "id": "sq_3",
        "text": "你分析过哪些业务指标？",
        "reason": "寻找指标分析证据",
        "answerType": "text",
        "required": true
      },
      {
        "id": "sq_4",
        "text": "你用什么方式展示过分析结果？",
        "reason": "确认可视化与表达经验",
        "answerType": "text",
        "required": true
      },
      {
        "id": "sq_5",
        "text": "你每周可以到岗几天？",
        "reason": "补充实习可用时间",
        "answerType": "number",
        "required": true
      }
    ]
  },
  "mode": "mock"
}
```

### 5.2 求职者：回答整理为事实

```text
POST /api/seeker/facts
```

```ts
export interface SeekerFactsRequest {
  jobProfile: JobProfile;
  questions: AIQuestion[];
  answers: QuestionAnswer[];
  oldResume?: string;
}

export interface SeekerFactsData {
  facts: CandidateFact[];
  missingInformation: string[];
}

export type SeekerFactsResponse = APIResponse<SeekerFactsData>;
```

校验规则：

- `jobProfile`、`questions` 和 `answers` 必填。
- `questions` 必须为 5—8 道，ID 不能重复。
- 每个 `answers[].questionId` 必须对应一条输入问题，不能重复回答同一问题。
- 必答问题必须存在非空回答；选答问题可以没有对应答案。
- 每条输出事实必须有唯一 ID、非空 `statement` 和逐字来源 `sourceQuote`。
- 回答来源的事实必须有有效 `sourceQuestionId`。
- 所有输出事实初始必须为 `confirmed: false`。

请求示例：

```json
{
  "jobProfile": {
    "jobTitle": "数据分析实习生",
    "responsibilities": ["整理业务数据", "分析业务指标"],
    "coreCompetencies": ["数据清洗", "指标分析"],
    "mustHaves": ["SQL", "Excel"],
    "niceToHaves": [],
    "expectedOutcomes": ["形成可理解的业务分析结果"],
    "constraints": [],
    "keywords": ["SQL", "Excel"],
    "uncertainties": []
  },
  "questions": [
    {
      "id": "sq_1",
      "text": "你使用Excel清洗过哪些类型的数据？",
      "reason": "确认数据清洗经验",
      "answerType": "text",
      "required": true
    },
    {
      "id": "sq_2",
      "text": "你是否在真实项目中使用过SQL？请如实说明。",
      "reason": "核实岗位必须技能",
      "answerType": "text",
      "required": true
    },
    {
      "id": "sq_3",
      "text": "你分析过哪些业务指标？",
      "reason": "寻找指标分析证据",
      "answerType": "text",
      "required": true
    },
    {
      "id": "sq_4",
      "text": "你用什么方式展示过分析结果？",
      "reason": "确认可视化经验",
      "answerType": "text",
      "required": true
    },
    {
      "id": "sq_5",
      "text": "你每周可以到岗几天？",
      "reason": "补充实习时间",
      "answerType": "number",
      "required": true
    }
  ],
  "answers": [
    { "questionId": "sq_1", "answer": "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。" },
    { "questionId": "sq_2", "answer": "只在课程作业里写过基础查询，没有实际项目经验。" },
    { "questionId": "sq_3", "answer": "比较过每周销售额和不同品类销量。" },
    { "questionId": "sq_4", "answer": "用Excel柱状图向小组展示。" },
    { "questionId": "sq_5", "answer": "4" }
  ]
}
```

成功响应示例：

```json
{
  "ok": true,
  "data": {
    "facts": [
      {
        "id": "fact_1",
        "category": "project",
        "statement": "使用Excel对便利店一个学期的销售明细进行去重和日期格式统一。",
        "sourceQuestionId": "sq_1",
        "sourceQuote": "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。",
        "confirmed": false
      },
      {
        "id": "fact_2",
        "category": "skill",
        "statement": "在课程作业中使用过SQL基础查询，暂无实际项目经验。",
        "sourceQuestionId": "sq_2",
        "sourceQuote": "只在课程作业里写过基础查询，没有实际项目经验。",
        "confirmed": false
      }
    ],
    "missingInformation": ["尚无真实项目中的SQL使用证据"]
  },
  "mode": "mock"
}
```

### 5.3 求职者：生成岗位定制简历

```text
POST /api/seeker/generate
```

```ts
export interface SeekerGenerateRequest {
  jobProfile: JobProfile;
  confirmedFacts: CandidateFact[];
}

export interface SeekerGenerateData {
  resume: GeneratedResume;
  missingInformation: string[];
  interviewRisks: string[];
}

export type SeekerGenerateResponse = APIResponse<SeekerGenerateData>;
```

校验规则：

- `confirmedFacts` 至少包含一条事实。
- 每条输入事实都必须是 `confirmed: true`。
- 事实 ID 不能重复。
- 每个简历要点至少包含一个 `evidenceId`。
- 所有 `evidenceIds` 必须存在于本次请求的 `confirmedFacts` 中。
- 同一个简历要点内的 `evidenceIds` 不能重复。
- 缺失能力只能进入 `missingInformation`，不能被补写到简历正文。

请求示例：

```json
{
  "jobProfile": {
    "jobTitle": "数据分析实习生",
    "responsibilities": ["整理业务数据", "分析业务指标"],
    "coreCompetencies": ["数据清洗", "指标分析"],
    "mustHaves": ["SQL", "Excel"],
    "niceToHaves": [],
    "expectedOutcomes": ["形成可理解的业务分析结果"],
    "constraints": [],
    "keywords": ["SQL", "Excel"],
    "uncertainties": []
  },
  "confirmedFacts": [
    {
      "id": "fact_1",
      "category": "project",
      "statement": "使用Excel对便利店一个学期的销售明细进行去重和日期格式统一。",
      "sourceQuestionId": "sq_1",
      "sourceQuote": "我整理过便利店一个学期的销售明细，用Excel去重并统一日期格式。",
      "confirmed": true
    },
    {
      "id": "fact_2",
      "category": "skill",
      "statement": "在课程作业中使用过SQL基础查询，暂无实际项目经验。",
      "sourceQuestionId": "sq_2",
      "sourceQuote": "只在课程作业里写过基础查询，没有实际项目经验。",
      "confirmed": true
    }
  ]
}
```

成功响应示例：

```json
{
  "ok": true,
  "data": {
    "resume": {
      "title": "数据分析实习生方向简历",
      "summary": [
        {
          "text": "具备Excel数据清洗实践，并在课程中使用过SQL基础查询。",
          "evidenceIds": ["fact_1", "fact_2"]
        }
      ],
      "education": [],
      "experiences": [
        {
          "name": "校园便利店销售数据分析",
          "bullets": [
            {
              "text": "使用Excel对一个学期的销售明细进行去重和日期格式统一。",
              "evidenceIds": ["fact_1"]
            }
          ]
        }
      ],
      "skills": [
        {
          "text": "Excel数据清洗；SQL基础查询（课程作业）",
          "evidenceIds": ["fact_1", "fact_2"]
        }
      ]
    },
    "missingInformation": ["缺少真实项目中的SQL使用证据"],
    "interviewRisks": ["面试官可能追问SQL查询的具体课程任务"]
  },
  "mode": "mock"
}
```

### 5.4 企业：解析模糊招聘需求

```text
POST /api/employer/analyze
```

```ts
export interface EmployerAnalyzeRequest {
  jobTitle: string;
  roughRequirement: string;
}

export interface EmployerAnalyzeData {
  jobProfile: JobProfile;
  questions: AIQuestion[];
}

export type EmployerAnalyzeResponse = APIResponse<EmployerAnalyzeData>;
```

校验规则：

- `jobTitle` 和 `roughRequirement` 都必填且不能为空。
- `questions` 必须为 3—5 道，ID 不能重复。
- 未经企业确认的薪资、福利、地点和硬性条件只能进入 `uncertainties`，不能被当作正式条件。

请求示例：

```json
{
  "jobTitle": "新媒体运营实习生",
  "roughRequirement": "会剪视频，平时发发小红书，最好长期实习"
}
```

成功响应示例：

```json
{
  "ok": true,
  "data": {
    "jobProfile": {
      "jobTitle": "新媒体运营实习生",
      "employmentType": "实习",
      "responsibilities": ["制作短视频内容", "参与小红书内容发布"],
      "coreCompetencies": ["视频剪辑", "内容运营"],
      "mustHaves": ["具备基础视频剪辑能力"],
      "niceToHaves": ["有小红书内容经验", "可长期实习"],
      "expectedOutcomes": [],
      "constraints": [],
      "keywords": ["视频剪辑", "小红书", "内容运营"],
      "uncertainties": ["每周到岗天数未确认", "实习期限未确认", "内容产出目标未确认"]
    },
    "questions": [
      {
        "id": "eq_1",
        "text": "每周至少需要到岗几天？",
        "reason": "明确实习时间要求",
        "answerType": "number",
        "required": true
      },
      {
        "id": "eq_2",
        "text": "最低实习期限是多少？",
        "reason": "明确长期实习的具体含义",
        "answerType": "choice",
        "required": true,
        "options": ["3个月", "6个月", "其他"]
      },
      {
        "id": "eq_3",
        "text": "该岗位最重要的内容产出结果是什么？",
        "reason": "明确岗位预期成果",
        "answerType": "text",
        "required": true
      }
    ]
  },
  "mode": "mock"
}
```

### 5.5 企业：生成招聘材料

```text
POST /api/employer/generate
```

```ts
export interface EmployerGenerateRequest {
  jobTitle: string;
  roughRequirement: string;
  jobProfile: JobProfile;
  questions: AIQuestion[];
  answers: QuestionAnswer[];
}

export type EmployerGenerateResponse = APIResponse<RecruitmentKit>;
```

校验规则：

- 所有请求字段必填。
- `questions` 必须为 3—5 道，ID 不能重复。
- 每个 `answers[].questionId` 必须对应输入问题，必答问题必须有非空回答。
- `screeningDimensions` 至少一项，每项权重为大于 0 的整数，权重总和必须严格等于 100。
- `interviewQuestions` 必须严格等于 5 道。
- 不得生成性别、年龄、婚育、籍贯、外貌等与岗位无关的歧视性条件。
- 筛选维度只能作为人工筛选和面试参考，不能输出自动录用或淘汰结论。

请求示例：

```json
{
  "jobTitle": "新媒体运营实习生",
  "roughRequirement": "会剪视频，平时发发小红书，最好长期实习",
  "jobProfile": {
    "jobTitle": "新媒体运营实习生",
    "employmentType": "实习",
    "responsibilities": ["制作短视频内容", "参与小红书内容发布"],
    "coreCompetencies": ["视频剪辑", "内容运营"],
    "mustHaves": ["具备基础视频剪辑能力"],
    "niceToHaves": ["有小红书内容经验", "可长期实习"],
    "expectedOutcomes": [],
    "constraints": [],
    "keywords": ["视频剪辑", "小红书", "内容运营"],
    "uncertainties": ["每周到岗天数未确认", "实习期限未确认", "内容产出目标未确认"]
  },
  "questions": [
    {
      "id": "eq_1",
      "text": "每周至少需要到岗几天？",
      "reason": "明确实习时间要求",
      "answerType": "number",
      "required": true
    },
    {
      "id": "eq_2",
      "text": "最低实习期限是多少？",
      "reason": "明确长期实习的具体含义",
      "answerType": "choice",
      "required": true,
      "options": ["3个月", "6个月", "其他"]
    },
    {
      "id": "eq_3",
      "text": "该岗位最重要的内容产出结果是什么？",
      "reason": "明确岗位预期成果",
      "answerType": "text",
      "required": true
    }
  ],
  "answers": [
    { "questionId": "eq_1", "answer": "4" },
    { "questionId": "eq_2", "answer": "6个月" },
    { "questionId": "eq_3", "answer": "每周完成短视频和小红书图文内容，并根据数据复盘。" }
  ]
}
```

成功响应示例：

```json
{
  "ok": true,
  "data": {
    "jobProfile": {
      "jobTitle": "新媒体运营实习生",
      "employmentType": "实习",
      "responsibilities": ["制作短视频和小红书图文内容", "跟踪内容数据并参与复盘"],
      "coreCompetencies": ["视频剪辑", "内容策划", "数据复盘"],
      "mustHaves": ["具备基础视频剪辑能力", "每周到岗4天", "可连续实习6个月"],
      "niceToHaves": ["有小红书内容经验"],
      "expectedOutcomes": ["按周完成内容产出并参与数据复盘"],
      "constraints": ["每周到岗4天", "连续实习6个月"],
      "keywords": ["视频剪辑", "小红书", "内容运营", "数据复盘"],
      "uncertainties": []
    },
    "standardizedJD": {
      "title": "新媒体运营实习生",
      "summary": "参与短视频和小红书内容制作，并结合内容数据进行复盘。",
      "responsibilities": ["制作短视频和小红书图文内容", "跟踪内容数据并参与复盘"],
      "requirements": ["具备基础视频剪辑能力", "每周到岗4天", "可连续实习6个月"],
      "niceToHaves": ["有小红书内容经验"],
      "workingConditions": ["实习期限6个月", "每周到岗4天"]
    },
    "screeningDimensions": [
      {
        "name": "视频剪辑基础",
        "weight": 40,
        "description": "能够完成岗位所需的基础视频制作。",
        "evidenceToLookFor": ["剪辑作品", "使用过的剪辑工具", "本人承担的制作环节"]
      },
      {
        "name": "内容策划与表达",
        "weight": 35,
        "description": "能够围绕目标用户组织图文或短视频内容。",
        "evidenceToLookFor": ["内容案例", "选题思路", "文案或脚本"]
      },
      {
        "name": "数据复盘意识",
        "weight": 25,
        "description": "能够根据内容数据总结问题并提出调整方向。",
        "evidenceToLookFor": ["关注的内容指标", "复盘案例", "根据数据做出的调整"]
      }
    ],
    "interviewQuestions": [
      {
        "question": "请介绍一个你参与制作的短视频。",
        "competency": "视频剪辑",
        "purpose": "确认候选人的真实制作经验和承担环节。",
        "strongAnswerSignals": ["说明具体职责", "展示作品或过程", "不夸大个人贡献"]
      },
      {
        "question": "你会怎样为一个新账号规划第一周的小红书内容？",
        "competency": "内容策划",
        "purpose": "观察选题和内容组织能力。",
        "strongAnswerSignals": ["明确目标用户", "给出选题依据", "考虑内容形式"]
      },
      {
        "question": "发布内容后你会重点关注哪些数据？",
        "competency": "数据复盘",
        "purpose": "确认是否具备基本的数据意识。",
        "strongAnswerSignals": ["指标与目标对应", "能够解释指标意义", "提出后续调整"]
      },
      {
        "question": "遇到素材不足但临近发布时间时，你会怎么处理？",
        "competency": "执行与协作",
        "purpose": "观察时间压力下的沟通和执行方式。",
        "strongAnswerSignals": ["及时沟通风险", "提出可执行替代方案", "不牺牲基本质量"]
      },
      {
        "question": "请说明你未来6个月的到岗安排。",
        "competency": "实习稳定性",
        "purpose": "核实已明确的到岗要求。",
        "strongAnswerSignals": ["时间安排具体", "能够满足每周4天", "如实说明可能冲突"]
      }
    ]
  },
  "mode": "mock"
}
```

## 6. Zod 落地清单

公共工程骨架确定后，应建立与第 3—5 节一一对应的 Zod Schema。Schema 除检查字段类型外，还必须包含：

- 字符串去除首尾空格并拒绝空值。
- ID 唯一性。
- 求职者问题数量 5—8。
- 企业问题数量 3—5。
- choice 问题的 `options` 至少两个且不重复；其他题型无 `options`。
- 回答只能引用本次请求中的问题 ID。
- 必答问题必须有答案。
- 事实提取响应中的 `confirmed` 必须为 `false`。
- 简历生成请求中的事实必须全部为 `true`。
- `evidenceIds` 非空、无重复并且引用有效事实。
- 筛选权重均为正整数且总和为 100。
- 面试题严格为 5 道。
- 成功与失败响应互斥，不能同时出现 `data` 和 `error`。

Zod 只能检查结构和部分交叉引用。以下语义规则还需要独立业务校验和测试：

- AI 是否虚构或夸大事实。
- 是否把缺失能力偷偷写入简历。
- 是否产生歧视性筛选条件。
- 是否把筛选维度描述成自动录用决定。
- fallback 是否在页面被清晰标识。

## 7. 当前完成状态

- [x] 冻结共享数据字段。
- [x] 冻结五个 API 地址、请求和响应层级。
- [x] 冻结成功、失败和三种运行模式。
- [x] 冻结问题数量和核心交叉校验规则。
- [x] 提供五个接口的请求和成功响应示例。
- [ ] 公共骨架确定后创建 TypeScript 类型文件。
- [ ] 安装 Zod 并创建可执行 Schema。
- [ ] 运行 TypeScript 编译和 Schema 测试。
- [ ] 两名前端成员确认契约并开始使用。
