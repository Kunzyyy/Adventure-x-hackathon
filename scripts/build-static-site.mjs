import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const outputDir = path.resolve(process.argv[2] ?? path.join(repoRoot, "static-dist"));
const stylesheet = fs.readFileSync(path.join(repoRoot, "css/approved-ui.css"), "utf8");

const pages = [
  { name: "index.html" },
  { name: "student.html", script: "approved-student.js" },
  { name: "enterprise.html", script: "approved-employer.js" },
  { name: "slides.html" },
];

fs.mkdirSync(outputDir, { recursive: true });

for (const page of pages) {
  let html = fs.readFileSync(path.join(repoRoot, page.name), "utf8");
  html = html.replace(
    '<link rel="stylesheet" href="./css/approved-ui.css" />',
    `<style>\n${stylesheet}\n    </style>`,
  );

  if (page.script) {
    const script = fs
      .readFileSync(path.join(repoRoot, "js", page.script), "utf8")
      .replace(/<\/script/giu, "<\\/script");
    html = html.replace(
      `<script type="module" src="./js/${page.script}"></script>`,
      `<script type="module">\n${script}\n    </script>`,
    );
  }

  // Inline html2pdf library so the generated static pages are self-contained.
  html = html.replace(
    '<script src="./js/html2pdf.bundle.min.js"></script>',
    () => {
      const lib = fs.readFileSync(path.join(repoRoot, "js", "html2pdf.bundle.min.js"), "utf8");
      return `<script>\n${lib}\n    </script>`;
    },
  );

  fs.writeFileSync(path.join(outputDir, page.name), html);
}

// Copy static assets (e.g. slide screenshots) so relative paths keep working.
const assetsDir = path.join(repoRoot, "assets");
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, path.join(outputDir, "assets"), { recursive: true });
}
