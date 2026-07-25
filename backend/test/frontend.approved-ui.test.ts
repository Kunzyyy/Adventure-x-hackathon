import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const repoRoot = path.resolve(process.cwd(), "..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("approved UI integration", () => {
  test("all public entry pages use the approved warm-paper design system", () => {
    for (const page of ["index.html", "student.html", "enterprise.html"]) {
      const html = readRepoFile(page);
      expect(html).toContain('data-design-system="warm-paper-clay"');
      expect(html).toContain('./css/approved-ui.css');
      expect(html).not.toMatch(/cdn\.tailwindcss|three\.js|gsap/i);
    }
  });

  test("homepage routes users into both functional product flows", () => {
    const html = readRepoFile("index.html");
    expect(html).toContain('href="./student.html"');
    expect(html).toContain('href="./enterprise.html"');
  });

  test("static publish build inlines styles and scripts for subpath hosts", () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "career-ui-static-"));

    try {
      execFileSync(process.execPath, [
        path.join(repoRoot, "scripts/build-static-site.mjs"),
        outputDir,
      ]);

      for (const page of ["index.html", "student.html", "enterprise.html"]) {
        const html = fs.readFileSync(path.join(outputDir, page), "utf8");
        expect(html).toContain("<style>");
        expect(html).not.toContain('href="./css/approved-ui.css"');
      }

      for (const page of ["student.html", "enterprise.html"]) {
        const html = fs.readFileSync(path.join(outputDir, page), "utf8");
        expect(html).toContain('<script type="module">');
        expect(html).not.toMatch(/src="\.\/js\/approved-(student|employer)\.js"/);
      }
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  test("student UI contains the approved five-step shell, resume templates, and all seeker endpoints", () => {
    const html = readRepoFile("student.html");
    expect(html).toContain('data-api-origin="https://ai-career-copilot-438i.onrender.com"');
    for (const step of ["job", "questions", "facts", "template", "resume"]) {
      expect(html).toContain(`data-seeker-step="${step}"`);
    }
    for (const endpoint of [
      "/api/seeker/analyze",
      "/api/seeker/facts",
      "/api/seeker/generate",
    ]) {
      expect(html).toContain(endpoint);
    }
    expect(html).toContain('data-role="job-profile"');
    expect(html).toContain('data-role="facts-list"');
    expect(html).toContain('data-role="template-list"');
    expect(html).toContain('data-role="resume-result"');

    const studentScript = readRepoFile("js/approved-student.js");
    for (const templateId of ["classic", "modern", "compact", "academic"]) {
      expect(studentScript).toContain(`id: "${templateId}"`);
    }
    expect(studentScript).toContain('data-action="select-template"');
    expect(studentScript).toContain('data-action="export-resume"');
    expect(studentScript).toContain('data-action="change-template"');
  });

  test("enterprise UI contains the approved two-step shell and employer endpoints", () => {
    const html = readRepoFile("enterprise.html");
    expect(html).toContain('data-api-origin="https://ai-career-copilot-438i.onrender.com"');
    expect(html).toContain('data-employer-step="analyze"');
    expect(html).toContain('data-employer-step="generate"');
    expect(html).toContain("/api/employer/analyze");
    expect(html).toContain("/api/employer/generate");
    expect(html).toContain('data-role="employer-profile"');
    expect(html).toContain('data-role="recruitment-kit"');
  });

  test("dynamic questions expose their question text as an accessible input label", () => {
    const studentScript = readRepoFile("js/approved-student.js");
    const employerScript = readRepoFile("js/approved-employer.js");
    expect(studentScript).toContain("new URL(url, apiOrigin)");
    expect(employerScript).toContain("new URL(url, apiOrigin)");
    expect(studentScript).toContain('aria-label="${escapeHtml(question.text)}"');
    expect(employerScript).toContain('aria-label="${escapeHtml(question.text)}"');
  });

  test("employer profile renders confirmed expected outcomes", () => {
    const employerScript = readRepoFile("js/approved-employer.js");
    expect(employerScript).toContain('["预期成果", profile.expectedOutcomes]');
  });
});
