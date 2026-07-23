// contracts/schemas.ts
// Single source of truth for all MVP data shapes.
// Types in ./types.ts are derived from these schemas via z.infer, so the
// TypeScript types and the runtime validators can never drift apart.
//
// Field names, layers and required-ness follow team-contract/API-CONTRACT.md.
// Do not rename or relayer anything here without updating the contract first.

import { z } from "zod";

// ───────────────────────── primitives ─────────────────────────

/** Trimmed, non-empty string. The contract trims all strings and rejects empty. */
export const NonEmptyString = z.string().trim().min(1, "不能为空");

/** An array of trimmed, non-empty strings. Required (must be present); [] is valid, null is not. */
export const StringArray = z.array(NonEmptyString);

/** Positive integer (>= 1). Used for screening weights. */
export const PositiveInt = z.number().int().positive();

// ───────────────────────── shared entities ─────────────────────────

export const APIModeSchema = z.enum(["live", "mock", "fallback"]);

export const JobProfileSchema = z.object({
  jobTitle: NonEmptyString,
  employmentType: z.string().trim().optional(),
  seniority: z.string().trim().optional(),
  responsibilities: StringArray,
  coreCompetencies: StringArray,
  mustHaves: StringArray,
  niceToHaves: StringArray,
  expectedOutcomes: StringArray,
  constraints: StringArray,
  keywords: StringArray,
  uncertainties: StringArray,
});

/**
 * AIQuestion. Enforces the cross-field rule: a `choice` question must carry
 * >= 2 unique options; any other answerType must NOT carry options.
 */
export const AIQuestionSchema = z
  .object({
    id: NonEmptyString,
    text: NonEmptyString,
    reason: NonEmptyString,
    answerType: z.enum(["text", "number", "choice"]),
    required: z.boolean(),
    options: z.array(NonEmptyString).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.answerType === "choice") {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "choice 题型必须提供至少两个选项",
          path: ["options"],
        });
      } else if (new Set(q.options).size !== q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "choice 选项不能重复",
          path: ["options"],
        });
      }
    } else if (q.options !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "非 choice 题型不得携带 options",
        path: ["options"],
      });
    }
  });

export const QuestionAnswerSchema = z.object({
  questionId: NonEmptyString,
  answer: NonEmptyString,
});

export const CandidateFactSchema = z.object({
  id: NonEmptyString,
  category: z.enum([
    "education",
    "project",
    "internship",
    "skill",
    "activity",
    "other",
  ]),
  statement: NonEmptyString,
  sourceQuestionId: NonEmptyString.optional(),
  sourceQuote: NonEmptyString,
  confirmed: z.boolean(),
});

/** A resume bullet must cite at least one evidence id; ids within one bullet must be unique. */
export const ResumeBulletSchema = z
  .object({
    text: NonEmptyString,
    evidenceIds: z.array(NonEmptyString).min(1, "至少引用一个事实 ID"),
  })
  .superRefine((b, ctx) => {
    if (new Set(b.evidenceIds).size !== b.evidenceIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "同一简历要点内 evidenceIds 不能重复",
        path: ["evidenceIds"],
      });
    }
  });

export const ExperienceSchema = z.object({
  name: NonEmptyString,
  bullets: z.array(ResumeBulletSchema),
});

export const GeneratedResumeSchema = z.object({
  title: NonEmptyString,
  summary: z.array(ResumeBulletSchema),
  education: z.array(ResumeBulletSchema),
  experiences: z.array(ExperienceSchema),
  skills: z.array(ResumeBulletSchema),
});

// ───────────────────────── shared question-list helpers ─────────────────────────

/**
 * Refine a list of questions: enforce a count range, unique ids, and that the
 * list itself is structurally valid (AIQuestionSchema already covers options).
 * Returns the issues via ctx; call inside a superRefine.
 */
function refineQuestionList(
  questions: z.infer<typeof AIQuestionSchema>[],
  ctx: z.RefinementCtx,
  path: string,
  min: number,
  max: number,
): void {
  if (questions.length < min || questions.length > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `问题数量必须为 ${min}—${max} 道，当前 ${questions.length} 道`,
      path: [path],
    });
    return;
  }
  const ids = questions.map((q) => q.id);
  const dup = firstDuplicate(ids);
  if (dup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `问题 ID 不能重复：${dup}`,
      path: [path],
    });
  }
}

function firstDuplicate<T>(arr: T[]): T | null {
  const seen = new Set<T>();
  for (const x of arr) {
    if (seen.has(x)) return x;
    seen.add(x);
  }
  return null;
}

/**
 * Refine answers against their questions: every answer must reference an
 * existing question, no question may be answered twice, and every required
 * question must have a non-empty answer.
 */
function refineAnswers(
  questions: z.infer<typeof AIQuestionSchema>[],
  answers: z.infer<typeof QuestionAnswerSchema>[],
  ctx: z.RefinementCtx,
  answersPath: string,
): void {
  const qById = new Map(questions.map((q) => [q.id, q]));
  const answered = new Set<string>();

  for (const a of answers) {
    if (!qById.has(a.questionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `回答引用了不存在的问题：${a.questionId}`,
        path: [answersPath],
      });
      continue;
    }
    if (answered.has(a.questionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `同一问题被重复回答：${a.questionId}`,
        path: [answersPath],
      });
      continue;
    }
    answered.add(a.questionId);
  }

  // Required questions must be answered.
  for (const q of questions) {
    if (q.required && !answered.has(q.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `必答问题未作答：${q.id}`,
        path: [answersPath],
      });
    }
  }
}

// ───────────────────────── request schemas ─────────────────────────

export const SeekerAnalyzeRequestSchema = z.object({
  jdText: NonEmptyString,
  oldResume: NonEmptyString.optional(),
});

export const SeekerFactsRequestSchema = z
  .object({
    jobProfile: JobProfileSchema,
    questions: z.array(AIQuestionSchema),
    answers: z.array(QuestionAnswerSchema),
    oldResume: NonEmptyString.optional(),
  })
  .superRefine((val, ctx) => {
    refineQuestionList(val.questions, ctx, "questions", 5, 8);
    refineAnswers(val.questions, val.answers, ctx, "answers");
  })
  .superRefine((val, ctx) => {
    // Defensive: if the *request itself* somehow reaches an illegal state even
    // after request validation, surface INVALID_INPUT for empty answers.
    if (val.answers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "answers 不能为空",
        path: ["answers"],
      });
    }
  });

export const SeekerGenerateRequestSchema = z
  .object({
    jobProfile: JobProfileSchema,
    confirmedFacts: z.array(CandidateFactSchema).min(1, "至少需要一条已确认事实"),
  })
  .superRefine((val, ctx) => {
    // Every fact must be confirmed true, and ids must be unique.
    const ids = val.confirmedFacts.map((f) => f.id);
    const dup = firstDuplicate(ids);
    if (dup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `事实 ID 不能重复：${dup}`,
        path: ["confirmedFacts"],
      });
    }
    val.confirmedFacts.forEach((f, i) => {
      if (!f.confirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "简历生成只接受 confirmed:true 的事实",
          path: ["confirmedFacts", i, "confirmed"],
        });
      }
    });
  });

export const EmployerAnalyzeRequestSchema = z.object({
  jobTitle: NonEmptyString,
  roughRequirement: NonEmptyString,
});

export const EmployerGenerateRequestSchema = z
  .object({
    jobTitle: NonEmptyString,
    roughRequirement: NonEmptyString,
    jobProfile: JobProfileSchema,
    questions: z.array(AIQuestionSchema),
    answers: z.array(QuestionAnswerSchema),
  })
  .superRefine((val, ctx) => {
    refineQuestionList(val.questions, ctx, "questions", 3, 5);
    refineAnswers(val.questions, val.answers, ctx, "answers");
  });

// ───────────────────────── response data schemas ─────────────────────────

export const SeekerAnalyzeDataSchema = z
  .object({
    jobProfile: JobProfileSchema,
    questions: z.array(AIQuestionSchema),
  })
  .superRefine((val, ctx) => {
    refineQuestionList(val.questions, ctx, "questions", 5, 8);
  });

export const SeekerFactsDataSchema = z
  .object({
    facts: z.array(CandidateFactSchema),
    missingInformation: StringArray,
  })
  .superRefine((val, ctx) => {
    const ids = val.facts.map((f) => f.id);
    const dup = firstDuplicate(ids);
    if (dup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `事实 ID 不能重复：${dup}`,
        path: ["facts"],
      });
    }
    val.facts.forEach((f, i) => {
      if (f.confirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "facts 输出的每条事实初始必须为 confirmed:false",
          path: ["facts", i, "confirmed"],
        });
      }
    });
  });

export const SeekerGenerateDataSchema = z.object({
  resume: GeneratedResumeSchema,
  missingInformation: StringArray,
  interviewRisks: StringArray,
});

export const EmployerAnalyzeDataSchema = z
  .object({
    jobProfile: JobProfileSchema,
    questions: z.array(AIQuestionSchema),
  })
  .superRefine((val, ctx) => {
    refineQuestionList(val.questions, ctx, "questions", 3, 5);
  });

export const InterviewQuestionSchema = z.object({
  question: NonEmptyString,
  competency: NonEmptyString,
  purpose: NonEmptyString,
  strongAnswerSignals: z.array(NonEmptyString).min(1, "至少一个优秀回答信号"),
  followUpQuestion: NonEmptyString.optional(),
});

export const ScreeningDimensionSchema = z.object({
  name: NonEmptyString,
  weight: PositiveInt,
  description: NonEmptyString,
  evidenceToLookFor: z.array(NonEmptyString).min(1, "至少一个证据线索"),
});

export const StandardizedJDSchema = z.object({
  title: NonEmptyString,
  summary: NonEmptyString,
  responsibilities: StringArray,
  requirements: StringArray,
  niceToHaves: StringArray,
  workingConditions: StringArray,
});

export const RecruitmentKitSchema = z
  .object({
    jobProfile: JobProfileSchema,
    standardizedJD: StandardizedJDSchema,
    screeningDimensions: z.array(ScreeningDimensionSchema).min(1, "至少一个筛选维度"),
    interviewQuestions: z.array(InterviewQuestionSchema),
  })
  .superRefine((val, ctx) => {
    if (val.interviewQuestions.length !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `面试题必须正好 5 道，当前 ${val.interviewQuestions.length} 道`,
        path: ["interviewQuestions"],
      });
    }
    const sum = val.screeningDimensions.reduce((acc, d) => acc + d.weight, 0);
    if (sum !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `筛选维度权重总和必须为 100，当前 ${sum}`,
        path: ["screeningDimensions"],
      });
    }
  });

// ───────────────────────── unified response envelope ─────────────────────────

export const APIErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "INVALID_AI_OUTPUT",
  "LLM_TIMEOUT",
  "LLM_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

export const APIErrorSchema = z.object({
  code: APIErrorCodeSchema,
  message: NonEmptyString,
  fieldErrors: z.record(z.array(NonEmptyString)).optional(),
});

/** A success response: ok=true, data, mode. Carries no `error`. */
export function SuccessResponseSchema<T extends z.ZodTypeAny>(data: T) {
  // strict: a payload carrying both `data` and `error` is rejected, so success
  // and failure stay mutually exclusive at the schema level.
  return z.strictObject({
    ok: z.literal(true),
    data,
    mode: APIModeSchema,
  });
}

/** A failure response: ok=false, error, mode. Carries no `data`. */
export const ErrorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: APIErrorSchema,
  mode: APIModeSchema,
});

/**
 * The discriminated union on `ok` makes success and failure mutually exclusive:
 * a payload cannot carry both `data` and `error`.
 */
export function APIResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.discriminatedUnion("ok", [SuccessResponseSchema(data), ErrorResponseSchema]);
}

// ───────────────────────── business validators (semantic, not structural) ─────────────────────────
// These cannot be expressed by Zod alone because they need cross-payload context
// (e.g. evidenceIds must reference THIS request's confirmedFacts). Services call them
// after a structural parse succeeds.

/** Returns the set of evidenceIds referenced by a resume that do NOT exist in factIds. */
export function findOrphanEvidenceIds(
  resume: z.infer<typeof GeneratedResumeSchema>,
  factIds: Set<string>,
): string[] {
  const orphans: string[] = [];
  const push = (ids: string[]) => {
    for (const id of ids) if (!factIds.has(id)) orphans.push(id);
  };
  resume.summary.forEach((b) => push(b.evidenceIds));
  resume.education.forEach((b) => push(b.evidenceIds));
  resume.experiences.forEach((e) => e.bullets.forEach((b) => push(b.evidenceIds)));
  resume.skills.forEach((b) => push(b.evidenceIds));
  return orphans;
}

/** Sum of screening dimension weights. */
export function sumWeights(
  dims: z.infer<typeof ScreeningDimensionSchema>[],
): number {
  return dims.reduce((acc, d) => acc + d.weight, 0);
}
