const body = document.body;
const endpoints = {
  analyze: body.dataset.employerAnalyze,
  generate: body.dataset.employerGenerate,
};

const state = {
  activeStep: "analyze",
  jobTitle: "",
  roughRequirement: "",
  jobProfile: null,
  questions: [],
  recruitmentKit: null,
};

const notice = document.querySelector('[data-role="notice"]');

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(values, empty = "暂无") {
  if (!Array.isArray(values) || values.length === 0) return `<p>${escapeHtml(empty)}</p>`;
  return `<ul class="compact-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function tags(values, empty = "暂无") {
  if (!Array.isArray(values) || values.length === 0) return `<p>${escapeHtml(empty)}</p>`;
  return `<ul class="tag-list">${values.map((value) => `<li class="tag">${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function setNotice(message, tone = "error") {
  notice.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = false;
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearNotice() {
  notice.hidden = true;
  notice.textContent = "";
  delete notice.dataset.tone;
}

function setButtonLoading(button, loading, loadingText) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="loading-line">${escapeHtml(loadingText)}</span>`;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || "继续";
  }
}

async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    const fieldErrors = json?.error?.fieldErrors
      ? Object.values(json.error.fieldErrors).flat().join("；")
      : "";
    throw new Error(fieldErrors || json?.error?.message || `请求失败（HTTP ${response.status}）`);
  }
  const mode = document.querySelector('[data-role="mode"]');
  if (mode && json.mode) mode.textContent = `${json.mode.toUpperCase()} · 企业确认优先`;
  return json.data;
}

function showStep(step, force = false) {
  if (step === "generate" && !force && !state.recruitmentKit) {
    setNotice("请先完成需求分析和澄清回答。");
    return;
  }
  clearNotice();
  state.activeStep = step;
  document.querySelectorAll("[data-employer-step]").forEach((section) => {
    section.hidden = section.dataset.employerStep !== step;
  });
  document.querySelectorAll("[data-employer-target]").forEach((control) => {
    if (control.dataset.employerTarget === step) control.setAttribute("aria-current", "step");
    else control.removeAttribute("aria-current");
    control.classList.toggle("is-complete", step === "generate" && control.dataset.employerTarget === "analyze");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function profileHtml(profile) {
  const groups = [
    ["岗位职责", profile.responsibilities],
    ["核心能力", profile.coreCompetencies],
    ["硬性要求", profile.mustHaves],
    ["加分项", profile.niceToHaves],
    ["预期成果", profile.expectedOutcomes],
    ["工作约束", profile.constraints],
    ["仍未确认", profile.uncertainties],
  ];
  return `
    <h3>${escapeHtml(profile.jobTitle || "岗位画像")}</h3>
    ${profile.employmentType ? `<p class="result-meta">${escapeHtml(profile.employmentType)}${profile.seniority ? ` · ${escapeHtml(profile.seniority)}` : ""}</p>` : ""}
    <div class="profile-grid">
      ${groups
        .map(
          ([title, values]) => `
            <div class="profile-group">
              <h4>${escapeHtml(title)}</h4>
              ${list(values)}
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="profile-group" style="margin-top:14px">
      <h4>关键词</h4>
      ${tags(profile.keywords)}
    </div>
  `;
}

function renderProfile(profile) {
  document.querySelector('[data-role="employer-profile"]').innerHTML = profileHtml(profile);
}

function renderQuestions(questions) {
  const container = document.querySelector('[data-role="employer-questions"]');
  container.innerHTML = questions
    .map((question, index) => {
      const input =
        question.answerType === "choice" && Array.isArray(question.options)
          ? `<select class="text-input" id="employer-answer-${escapeHtml(question.id)}" aria-label="${escapeHtml(question.text)}">
              <option value="">请选择</option>
              ${question.options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
            </select>`
          : `<input class="text-input" id="employer-answer-${escapeHtml(question.id)}"
              aria-label="${escapeHtml(question.text)}"
              type="${question.answerType === "number" ? "number" : "text"}"
              placeholder="${question.required ? "必答" : "选答，可暂时留空"}" />`;
      return `
        <article class="question-card">
          <div class="question-index">
            <span>问题 ${index + 1}</span>
            <span>${question.required ? "必答" : "选答"} · ${escapeHtml(question.answerType)}</span>
          </div>
          <h3>${escapeHtml(question.text)}</h3>
          <p class="fact-source">${escapeHtml(question.reason)}</p>
          <div class="field">${input}</div>
        </article>
      `;
    })
    .join("");
  document.querySelector('[data-role="employer-question-count"]').textContent = `${questions.length} 个待确认问题`;
  document.querySelector('[data-role="clarification-panel"]').hidden = false;
}

function collectAnswers() {
  return state.questions
    .map((question) => ({
      questionId: question.id,
      answer: document.getElementById(`employer-answer-${question.id}`)?.value.trim() || "",
    }))
    .filter((answer) => answer.answer);
}

function renderRecruitmentKit(data) {
  const jd = data.standardizedJD;
  const dimensions = data.screeningDimensions || [];
  const questions = data.interviewQuestions || [];
  const weightTotal = dimensions.reduce((total, dimension) => total + dimension.weight, 0);
  const container = document.querySelector('[data-role="recruitment-kit"]');
  container.innerHTML = `
    <section class="panel">
      <div class="panel-header"><h2>确认后的岗位画像</h2><span>来自企业回答</span></div>
      <div class="panel-body">${profileHtml(data.jobProfile)}</div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>标准化岗位说明 JD</h2><span>可直接交给招聘团队</span></div>
      <div class="panel-body">
        <div class="result-card">
          <h3>${escapeHtml(jd.title)}</h3>
          <p>${escapeHtml(jd.summary)}</p>
        </div>
        <div class="result-grid" style="margin-top:14px">
          <div class="result-card"><h3>岗位职责</h3>${list(jd.responsibilities)}</div>
          <div class="result-card"><h3>任职要求</h3>${list(jd.requirements)}</div>
          <div class="result-card"><h3>加分项</h3>${list(jd.niceToHaves)}</div>
          <div class="result-card"><h3>工作条件</h3>${list(jd.workingConditions)}</div>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>筛选维度</h2><span>权重合计 ${weightTotal}</span></div>
      <div class="panel-body">
        ${dimensions
          .map(
            (dimension) => `
              <div class="dimension-row">
                <div>
                  <div class="dimension-weight">${dimension.weight}%</div>
                  <strong>${escapeHtml(dimension.name)}</strong>
                </div>
                <div>
                  <p>${escapeHtml(dimension.description)}</p>
                  <h4>需要寻找的证据</h4>
                  ${list(dimension.evidenceToLookFor)}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>结构化面试题</h2><span>严格 ${questions.length} 道</span></div>
      <div class="panel-body">
        ${questions
          .map(
            (question, index) => `
              <article class="interview-question">
                <div class="question-index"><span>问题 ${index + 1}</span><span>${escapeHtml(question.competency)}</span></div>
                <h4>${escapeHtml(question.question)}</h4>
                <p><strong>目的：</strong>${escapeHtml(question.purpose)}</p>
                <p><strong>优秀回答信号：</strong>${escapeHtml(question.strongAnswerSignals.join("、"))}</p>
                ${question.followUpQuestion ? `<p><strong>追问：</strong>${escapeHtml(question.followUpQuestion)}</p>` : ""}
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function exportKit() {
  if (!state.recruitmentKit) {
    setNotice("当前还没有可以导出的招聘包。");
    return;
  }
  const text = document.querySelector('[data-role="recruitment-kit"]').innerText.trim();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${state.jobTitle || "岗位"}_招聘包.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

document.querySelector('[data-action="fill-requirement"]').addEventListener("click", () => {
  document.getElementById("rough-requirement").value =
    "负责小红书和短视频内容，最好会剪辑，能跟踪内容数据；希望尽快到岗，每周至少三天，薪资 8k-12k，具体地点和福利还没定。";
});

document.querySelector('[data-role="employer-form"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();
  const jobTitle = document.getElementById("employer-title").value.trim();
  const roughRequirement = document.getElementById("rough-requirement").value.trim();
  if (!jobTitle || !roughRequirement) {
    setNotice("请填写岗位名称和现有招聘要求。");
    return;
  }
  const button = document.querySelector('[data-role="employer-analyze-button"]');
  setButtonLoading(button, true, "正在整理岗位需求");
  try {
    const data = await apiPost(endpoints.analyze, { jobTitle, roughRequirement });
    state.jobTitle = jobTitle;
    state.roughRequirement = roughRequirement;
    state.jobProfile = data.jobProfile;
    state.questions = data.questions;
    renderProfile(data.jobProfile);
    renderQuestions(data.questions);
    document.querySelector('[data-role="clarification-panel"]').scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    setNotice(error.message);
  } finally {
    setButtonLoading(button, false);
  }
});

document.querySelector('[data-role="clarification-form"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();
  const answers = collectAnswers();
  const missingRequired = state.questions.filter(
    (question) => question.required && !answers.some((answer) => answer.questionId === question.id),
  );
  if (missingRequired.length) {
    setNotice(`还有必答问题没有完成：${missingRequired.map((question) => question.text).join("；")}`);
    return;
  }
  const button = document.querySelector('[data-role="employer-generate-button"]');
  setButtonLoading(button, true, "正在生成招聘包");
  try {
    const data = await apiPost(endpoints.generate, {
      jobTitle: state.jobTitle,
      roughRequirement: state.roughRequirement,
      jobProfile: state.jobProfile,
      questions: state.questions,
      answers,
    });
    state.recruitmentKit = data;
    renderRecruitmentKit(data);
    showStep("generate", true);
  } catch (error) {
    setNotice(error.message);
  } finally {
    setButtonLoading(button, false);
  }
});

document.querySelectorAll("[data-employer-target]").forEach((control) => {
  control.addEventListener("click", () => showStep(control.dataset.employerTarget));
});

document.querySelector('[data-action="export-kit"]').addEventListener("click", exportKit);
