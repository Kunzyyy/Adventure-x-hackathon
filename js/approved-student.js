const body = document.body;
const apiOrigin = body.dataset.apiOrigin || window.location.origin;
const endpoints = {
  analyze: body.dataset.seekerAnalyze,
  facts: body.dataset.seekerFacts,
  generate: body.dataset.seekerGenerate,
};

const state = {
  activeStep: "job",
  jobProfile: null,
  questions: [],
  answers: [],
  facts: [],
  oldResume: "",
  selectedTemplate: "classic",
  resumeData: null,
};

const resumeTemplates = [
  {
    id: "classic",
    name: "经典单栏",
    description: "居中标题和标准分区，最稳妥，适合大多数岗位投递。",
  },
  {
    id: "modern",
    name: "现代双栏",
    description: "左侧放摘要和技能，右侧放经历，适合产品、设计、运营。",
  },
  {
    id: "compact",
    name: "紧凑信息型",
    description: "标题更硬朗，信息密度更高，适合内容较多但需要压进一页。",
  },
  {
    id: "academic",
    name: "学术型",
    description: "衬线字体和安静分隔，适合科研、课程项目或偏学术经历。",
  },
];

const stepOrder = ["job", "questions", "facts", "template", "resume"];
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
  if (!Array.isArray(values) || values.length === 0) {
    return `<p>${escapeHtml(empty)}</p>`;
  }
  return `<ul class="compact-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
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
  const suffix = "真实信息优先";
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

function canOpenStep(step) {
  if (step === "job") return true;
  if (step === "questions") return Boolean(state.jobProfile);
  if (step === "facts") return state.facts.length > 0;
  if (step === "template") return state.facts.length > 0;
  if (step === "resume") {
    return document.querySelector('[data-role="resume-result"]')?.dataset.ready === "true";
  }
  return false;
}

function showStep(step, force = false) {
  if (!force && !canOpenStep(step)) {
    setNotice("请先完成前面的步骤，再查看这里。");
    return;
  }
  clearNotice();
  state.activeStep = step;
  document.querySelectorAll("[data-seeker-step]").forEach((section) => {
    section.hidden = section.dataset.seekerStep !== step;
  });
  document.querySelectorAll("[data-step-target]").forEach((control) => {
    const isActive = control.dataset.stepTarget === step;
    if (isActive) control.setAttribute("aria-current", "step");
    else control.removeAttribute("aria-current");

    const index = stepOrder.indexOf(control.dataset.stepTarget);
    const activeIndex = stepOrder.indexOf(step);
    control.classList.toggle("is-complete", index >= 0 && index < activeIndex);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderJobProfile(profile) {
  const container = document.querySelector('[data-role="job-profile"]');
  const groups = [
    ["核心职责", profile.responsibilities],
    ["核心能力", profile.coreCompetencies],
    ["硬性要求", profile.mustHaves],
    ["仍需确认", profile.uncertainties],
  ];
  container.innerHTML = `
    <h3>${escapeHtml(profile.jobTitle || "岗位理解")}</h3>
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
  `;
}

function renderQuestions(questions) {
  const container = document.querySelector('[data-role="questions-list"]');
  container.innerHTML = questions
    .map((question, index) => {
      const required = question.required ? "必答" : "选答";
      const options =
        question.answerType === "choice" && Array.isArray(question.options)
          ? `<select class="text-input" id="answer-${escapeHtml(question.id)}" aria-label="${escapeHtml(question.text)}">
              <option value="">请选择</option>
              ${question.options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
            </select>`
          : question.answerType === "number"
            ? `<input class="text-input" type="number" id="answer-${escapeHtml(question.id)}" aria-label="${escapeHtml(question.text)}" placeholder="不确定时可以写在下一步补充" />`
            : `<textarea class="text-area" id="answer-${escapeHtml(question.id)}" aria-label="${escapeHtml(question.text)}" placeholder="用自己的话描述真实经历……"></textarea>`;
      return `
        <article class="question-card">
          <div class="question-index"><span>问题 ${index + 1}</span><span>${required} · ${escapeHtml(question.answerType)}</span></div>
          <h3>${escapeHtml(question.text)}</h3>
          <p class="fact-source">${escapeHtml(question.reason)}</p>
          <div class="field">${options}</div>
        </article>
      `;
    })
    .join("");
  document.querySelector('[data-role="question-count"]').textContent = `${questions.length} 道针对性问题`;
}

function collectAnswers() {
  return state.questions
    .map((question) => {
      const input = document.getElementById(`answer-${question.id}`);
      return { questionId: question.id, answer: input?.value.trim() || "" };
    })
    .filter((answer) => answer.answer);
}

function renderFacts(facts, missingInformation) {
  const container = document.querySelector('[data-role="facts-list"]');
  container.innerHTML = facts
    .map(
      (fact, index) => `
        <article class="fact-card" data-fact-id="${escapeHtml(fact.id)}">
          <div class="fact-meta">
            <span>${escapeHtml(fact.category)} · 事实 ${index + 1}</span>
            <span>来源：${escapeHtml(fact.sourceQuestionId || "来自已有简历")}</span>
          </div>
          <div class="field">
            <label for="fact-${escapeHtml(fact.id)}">事实陈述</label>
            <textarea class="text-area" id="fact-${escapeHtml(fact.id)}">${escapeHtml(fact.statement)}</textarea>
          </div>
          <p class="fact-source">“${escapeHtml(fact.sourceQuote)}”</p>
          <label class="confirm-row">
            <input type="checkbox" data-confirm-fact="${escapeHtml(fact.id)}" />
            我确认这条事实准确，可以写入简历
          </label>
        </article>
      `,
    )
    .join("");

  document.querySelector('[data-role="fact-count"]').textContent = `${facts.length} 条待确认`;
  const missing = document.querySelector('[data-role="missing-information"]');
  missing.innerHTML = `<strong>建议补充的信息</strong>${list(missingInformation, "当前没有额外建议。")}`;

  container.querySelectorAll("[data-confirm-fact]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      checkbox.closest(".fact-card")?.classList.toggle("is-confirmed", checkbox.checked);
    });
  });
}

function collectConfirmedFacts() {
  return state.facts
    .map((fact) => {
      const confirmed = document.querySelector(`[data-confirm-fact="${CSS.escape(fact.id)}"]`)?.checked === true;
      const statement = document.getElementById(`fact-${fact.id}`)?.value.trim() || "";
      return { ...fact, statement, confirmed };
    })
    .filter((fact) => fact.confirmed && fact.statement);
}

function selectedTemplate() {
  return resumeTemplates.find((template) => template.id === state.selectedTemplate) || resumeTemplates[0];
}

function renderTemplatePreview(templateId) {
  if (templateId === "modern") {
    return `
      <span class="template-preview template-preview-sidebar" aria-hidden="true">
        <span class="preview-sidebar"></span>
        <span class="preview-main">
          <span class="preview-title"></span>
          <span class="preview-row preview-row-short"></span>
          <span class="preview-row"></span>
          <span class="preview-row"></span>
        </span>
      </span>
    `;
  }
  if (templateId === "compact") {
    return `
      <span class="template-preview template-preview-density" aria-hidden="true">
        <span class="preview-topbar"></span>
        <span class="preview-columns">
          <span></span><span></span><span></span>
        </span>
        <span class="preview-dense-list">
          <span></span><span></span><span></span><span></span><span></span>
        </span>
      </span>
    `;
  }
  if (templateId === "academic") {
    return `
      <span class="template-preview template-preview-citation" aria-hidden="true">
        <span class="preview-title"></span>
        <span class="preview-subtitle"></span>
        <span class="preview-rule"></span>
        <span class="preview-citation-row"><span></span><i>01</i></span>
        <span class="preview-citation-row"><span></span><i>02</i></span>
      </span>
    `;
  }
  return `
    <span class="template-preview template-preview-classic" aria-hidden="true">
      <span class="preview-title"></span>
      <span class="preview-subtitle"></span>
      <span class="preview-rule"></span>
      <span class="preview-row"></span>
      <span class="preview-row preview-row-short"></span>
      <span class="preview-row"></span>
    </span>
  `;
}

function renderTemplates() {
  const container = document.querySelector('[data-role="template-list"]');
  if (!container) return;

  // 如果已经渲染过，只更新选中状态，避免重新创建 DOM 导致 focus 丢失和连续点击失败
  const existing = container.querySelector('[data-action="select-template"]');
  if (existing) {
    container.querySelectorAll('[data-action="select-template"]').forEach((button) => {
      const selected = button.dataset.templateId === state.selectedTemplate;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  } else {
    container.innerHTML = resumeTemplates
      .map((template) => {
        const selected = template.id === state.selectedTemplate;
        return `
          <button
            class="template-card ${selected ? "is-selected" : ""}"
            type="button"
            data-action="select-template"
            data-template-id="${escapeHtml(template.id)}"
            aria-pressed="${selected ? "true" : "false"}"
          >
            ${renderTemplatePreview(template.id)}
            <span class="template-copy">
              <strong>${escapeHtml(template.name)}</strong>
              <span>${escapeHtml(template.description)}</span>
            </span>
          </button>
        `;
      })
      .join("");
  }

  const current = document.querySelector('[data-role="template-current"]');
  if (current) current.textContent = `已选：${selectedTemplate().name}`;
}

function setTemplate(templateId) {
  if (!resumeTemplates.some((template) => template.id === templateId)) return;
  state.selectedTemplate = templateId;
  renderTemplates();
  if (state.resumeData) renderResume(state.resumeData);
}

function evidenceDetail(ids) {
  const related = ids
    .map((id) => state.facts.find((fact) => fact.id === id))
    .filter(Boolean);
  if (!related.length) return "";
  return `<details class="evidence-detail"><summary>查看事实来源</summary>${related
    .map((fact) => `<p><strong>${escapeHtml(fact.statement)}</strong><br />“${escapeHtml(fact.sourceQuote)}”</p>`)
    .join("")}</details>`;
}

function bullets(items) {
  if (!Array.isArray(items) || items.length === 0) return "<p>暂无内容</p>";
  return items
    .map(
      (item) => `
        <div class="resume-bullet">
          • ${escapeHtml(item.text)}
          <span class="evidence-button">${item.evidenceIds?.length || 0} 条证据</span>
          ${evidenceDetail(item.evidenceIds || [])}
        </div>
      `,
    )
    .join("");
}

function sectionIfNotEmpty(title, items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return `<section class="resume-section"><h3>${escapeHtml(title)}</h3>${bullets(items)}</section>`;
}

function renderResume(data) {
  const resume = data.resume;
  const container = document.querySelector('[data-role="resume-result"]');
  const template = selectedTemplate();
  state.resumeData = data;
  container.dataset.ready = "true";
  container.dataset.template = template.id;
  container.className = `resume-paper resume-template-${template.id}`;
  container.innerHTML = `
    <h2>${escapeHtml(resume.title)}</h2>
    <p>基于你刚刚确认的事实生成 · ${escapeHtml(template.name)}</p>
    ${sectionIfNotEmpty("个人概述", resume.summary)}
    ${sectionIfNotEmpty("教育背景", resume.education)}
    ${(resume.experiences || [])
      .map(
        (experience) => `
          <section class="resume-section">
            <h3>${escapeHtml(experience.name)}</h3>
            ${bullets(experience.bullets)}
          </section>
        `,
      )
      .join("")}
    ${sectionIfNotEmpty("技能", resume.skills)}
  `;
  document.querySelector('[data-role="resume-missing"]').innerHTML = `
    <h3>缺失信息</h3>${list(data.missingInformation, "当前没有明确缺失项。")}
  `;
  document.querySelector('[data-role="interview-risks"]').innerHTML = `
    <h3>面试追问风险</h3>${list(data.interviewRisks, "当前没有明显风险。")}
  `;
  const label = document.querySelector('[data-role="resume-template-label"]');
  if (label) label.textContent = `${template.name} · 每条要点可追溯`;
}

function getPrintableResumeHtml(container, templateClass) {
  const resumeHtml = container.innerHTML;
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>简历打印</title>
      <style>
        :root {
          --ink: #151310;
          --muted: #6f6a62;
          --serif: Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", "SimSun", serif;
          --sans: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", ui-sans-serif, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff; color: var(--ink); }
        body { font-family: var(--sans); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { size: A4; margin: 12mm; }

        .resume-paper {
          width: 100%;
          max-width: 210mm;
          min-height: 277mm;
          margin: 0 auto;
          padding: 8mm;
          background: #fff;
          border: none;
          box-shadow: none;
          color: var(--ink);
        }

        .resume-paper > h2 {
          margin: 0 0 4px;
          font-family: var(--serif);
          font-size: 32px;
          font-style: italic;
          font-weight: 500;
        }

        .resume-paper > p {
          margin: 0 0 16px;
          color: var(--muted);
          font-size: 13px;
        }

        .resume-template-modern {
          display: grid;
          grid-template-columns: minmax(140px, 0.36fr) minmax(0, 0.64fr);
          gap: 20px;
        }

        .resume-template-modern > h2,
        .resume-template-modern > p { grid-column: 1 / -1; }

        .resume-template-modern .resume-section:nth-of-type(1),
        .resume-template-modern .resume-section:nth-of-type(2),
        .resume-template-modern .resume-section:last-child { grid-column: 1; }

        .resume-template-modern .resume-section { margin-top: 0; }

        .resume-template-compact { padding: 6mm; }

        .resume-template-compact > h2 {
          padding-bottom: 12px;
          font-family: var(--sans);
          font-size: 28px;
          font-style: normal;
          border-bottom: 4px solid var(--ink);
        }

        .resume-template-compact .resume-section { margin-top: 16px; padding-top: 10px; }

        .resume-template-academic {
          font-family: var(--serif);
          box-shadow: none;
        }

        .resume-template-academic > h2 {
          font-size: 34px;
          font-style: normal;
          text-align: center;
        }

        .resume-template-academic > p { text-align: center; }

        .resume-section {
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px solid var(--ink);
          page-break-inside: avoid;
        }

        .resume-section h3 {
          margin: 0 0 10px;
          font-size: 12px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .resume-bullet {
          margin: 8px 0;
          line-height: 1.6;
        }

        .evidence-button,
        .evidence-detail { display: none !important; }
      </style>
    </head>
    <body>
      <article class="resume-paper ${templateClass}">
        ${resumeHtml}
      </article>
    </body>
    </html>
  `;
}

function exportResume() {
  const container = document.querySelector('[data-role="resume-result"]');
  if (!container?.dataset.ready) {
    setNotice("请先生成简历，再导出 PDF。");
    return;
  }

  const templateClass = Array.from(container.classList).find((c) => c.startsWith("resume-template-")) || "resume-template-classic";
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;inset:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;";

  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }

  iframe.onerror = cleanup;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      window.print();
      return;
    }

    doc.open();
    doc.write(getPrintableResumeHtml(container, templateClass));
    doc.close();

    const printWindow = iframe.contentWindow;
    const doPrint = () => {
      try {
        printWindow.focus();
        // 让提示先渲染，再唤起系统打印对话框
        requestAnimationFrame(() => {
          setTimeout(() => printWindow.print(), 50);
        });
      } catch (err) {
        window.print();
      } finally {
        setTimeout(cleanup, 1000);
      }
    };

    setNotice("正在准备打印… 请在打印设置里取消“页眉和页脚”，再保存为 PDF。", "info");

    if (printWindow?.document.readyState === "complete") {
      doPrint();
    } else {
      iframe.onload = doPrint;
      setTimeout(doPrint, 500);
    }
  } catch (err) {
    cleanup();
    window.print();
  }
}

document.querySelector('[data-action="fill-jd"]').addEventListener("click", () => {
  document.getElementById("jd-text").value =
    "负责移动端与 Web 产品体验设计，参与需求分析、用户流程、交互原型和视觉交付；能够与前后端协作推进功能上线；有真实项目案例和良好的沟通能力。";
  document.getElementById("old-resume").value =
    "课程项目：与两名同学完成 AI 求职助手，我负责需求拆解、核心流程和 UI 设计，并参与前后端接口验收。";
});

document.querySelector('[data-role="job-form"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();
  const jdText = document.getElementById("jd-text").value.trim();
  const oldResume = document.getElementById("old-resume").value.trim();
  if (!jdText) {
    setNotice("请先粘贴岗位描述 JD。");
    return;
  }
  const button = document.querySelector('[data-role="analyze-button"]');
  setButtonLoading(button, true, "正在理解岗位");
  try {
    const payload = { jdText };
    if (oldResume) payload.oldResume = oldResume;
    const data = await apiPost(endpoints.analyze, payload);
    state.jobProfile = data.jobProfile;
    state.questions = data.questions;
    state.oldResume = oldResume;
    renderJobProfile(data.jobProfile);
    renderQuestions(data.questions);
    showStep("questions", true);
  } catch (error) {
    setNotice(error.message);
  } finally {
    setButtonLoading(button, false);
  }
});

document.querySelector('[data-role="questions-form"]').addEventListener("submit", async (event) => {
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
  if (!answers.length) {
    setNotice("请至少回答一个问题。");
    return;
  }
  const button = document.querySelector('[data-role="facts-button"]');
  setButtonLoading(button, true, "正在提炼事实");
  try {
    const payload = {
      jobProfile: state.jobProfile,
      questions: state.questions,
      answers,
    };
    if (state.oldResume) payload.oldResume = state.oldResume;
    const data = await apiPost(endpoints.facts, payload);
    state.answers = answers;
    state.facts = data.facts;
    renderFacts(data.facts, data.missingInformation);
    showStep("facts", true);
  } catch (error) {
    setNotice(error.message);
  } finally {
    setButtonLoading(button, false);
  }
});

document.querySelector('[data-action="review-templates"]').addEventListener("click", () => {
  clearNotice();
  const confirmedFacts = collectConfirmedFacts();
  if (!confirmedFacts.length) {
    setNotice("请至少确认一条准确事实。");
    return;
  }
  state.facts = state.facts.map((fact) => {
    const updated = confirmedFacts.find((item) => item.id === fact.id);
    return updated || fact;
  });
  renderTemplates();
  showStep("template", true);
});

document.querySelector('[data-action="generate-resume"]').addEventListener("click", async () => {
  clearNotice();
  const confirmedFacts = collectConfirmedFacts();
  if (!confirmedFacts.length) {
    setNotice("请至少确认一条准确事实。");
    return;
  }
  const button = document.querySelector('[data-role="generate-button"]');
  setButtonLoading(button, true, "正在生成可信简历");
  try {
    state.facts = state.facts.map((fact) => {
      const updated = confirmedFacts.find((item) => item.id === fact.id);
      return updated || fact;
    });
    const data = await apiPost(endpoints.generate, {
      jobProfile: state.jobProfile,
      confirmedFacts,
    });
    renderResume(data);
    showStep("resume", true);
  } catch (error) {
    setNotice(error.message);
  } finally {
    setButtonLoading(button, false);
  }
});

document.querySelector('[data-role="template-list"]').addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="select-template"]');
  if (!button) return;
  setTemplate(button.dataset.templateId);
});

document.querySelector('[data-action="change-template"]').addEventListener("click", () => {
  renderTemplates();
  showStep("template", true);
});

document.querySelector('[data-action="export-resume"]').addEventListener("click", exportResume);

document.querySelectorAll("[data-step-target]").forEach((control) => {
  control.addEventListener("click", () => showStep(control.dataset.stepTarget));
});

document.querySelector('[data-action="restart"]').addEventListener("click", () => {
  window.location.reload();
});

syncModeFromHealth();
