const body = document.body;
const apiOrigin = body.dataset.apiOrigin || window.location.origin;
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
  const response = await fetch(new URL(url, apiOrigin), {
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
  updateModePill(json.mode);
  return json.data;
}

function updateModePill(mode) {
  const pill = document.querySelector('[data-role="mode"]');
  if (!pill || !mode) return;
  const suffix = "企业确认优先";
  const label = mode === "mock" ? "MOCK" : mode.toUpperCase();
  pill.textContent = `${label} · ${suffix}`;
}

async function syncModeFromHealth() {
  try {
    const response = await fetch(new URL("/api/health", apiOrigin));
    const json = await response.json().catch(() => null);
    updateModePill(json?.mode);
  } catch {
    // leave pill untouched on network error
  }
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
  // 返回 Step 1 时，如果已有确认后的招聘包，用更新过的岗位画像覆盖原画像
  if (step === "analyze" && state.recruitmentKit?.jobProfile) {
    renderProfile(state.recruitmentKit.jobProfile);
  }
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
                  <div class="dimension-weight-bar" aria-hidden="true"><span style="width: ${dimension.weight}%"></span></div>
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

function getPrintableKitHtml(container) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>岗位说明</title>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff; font-family: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", ui-sans-serif, sans-serif; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { padding: 0; }
        h1 { font-size: 22px; margin: 0 0 16px; }
        h2 { font-size: 16px; margin: 18px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
        h3 { font-size: 14px; margin: 12px 0 6px; }
        p, li { font-size: 13px; line-height: 1.6; margin: 4px 0; }
        ul { margin: 6px 0; padding-left: 20px; }
        .kit-paper { width: 210mm; min-height: 277mm; margin: 0 auto; padding: 0; background: #fff; }
        .dimension-print { margin-bottom: 12px; page-break-inside: avoid; }
        .dimension-print strong { display: block; font-size: 14px; margin-bottom: 4px; }
        .dimension-print .weight { color: #666; font-size: 12px; margin-bottom: 4px; }
        .interview-print { margin-bottom: 12px; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <article class="kit-paper">
        ${container.innerHTML}
      </article>
    </body>
    </html>
  `;
}

function createPrintIframe(container) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return null;
  }

  doc.open();
  doc.write(getPrintableKitHtml(container));
  doc.close();
  return iframe;
}

function printKitFallback(container) {
  const iframe = createPrintIframe(container);
  if (!iframe) {
    window.print();
    return;
  }

  const printWindow = iframe.contentWindow;
  setNotice("正在打开打印预览… 请在打印设置里取消“页眉和页脚”，再保存为 PDF。", "info");

  function doPrint() {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      window.print();
    } finally {
      setTimeout(() => iframe.remove(), 2000);
    }
  }

  Promise.all([
    new Promise((resolve) => {
      if (printWindow.document.readyState === "complete") {
        resolve();
      } else {
        printWindow.addEventListener("load", resolve, { once: true });
      }
    }),
    printWindow.document.fonts && typeof printWindow.document.fonts.ready === "object"
      ? printWindow.document.fonts.ready.then(() => {})
      : Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 350)),
  ])
    .then(doPrint)
    .catch(() => {
      iframe.remove();
      window.print();
    });
}

function exportKit() {
  if (!state.recruitmentKit) {
    setNotice("当前还没有可以导出的招聘包。");
    return;
  }
  const container = document.querySelector('[data-role="recruitment-kit"]');
  if (!container) return;

  if (typeof html2pdf !== "function") {
    printKitFallback(container);
    return;
  }

  setNotice("正在生成 PDF…", "info");

  const iframe = createPrintIframe(container);
  if (!iframe) {
    printKitFallback(container);
    return;
  }

  const element = iframe.contentDocument.querySelector(".kit-paper");
  const title = document.getElementById("employer-title")?.value?.trim() || "岗位说明";

  const opt = {
    margin: 0,
    filename: `${title}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff", logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      setNotice("PDF 已下载", "success");
      iframe.remove();
    })
    .catch((err) => {
      console.error("html2pdf failed:", err);
      iframe.remove();
      setNotice("PDF 生成失败，改用系统打印…", "info");
      printKitFallback(container);
    });
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

syncModeFromHealth();
