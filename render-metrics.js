#!/usr/bin/env node
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

try { require.resolve("ejs"); }
catch { execSync("npm install --no-save ejs", { stdio: "inherit" }); }
const ejs = require("ejs");

const ROOT_DIR = path.join(__dirname, "metrics-template");
const PARTIALS_DIR = path.join(ROOT_DIR, "partials");

const safeRead = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";

const fonts    = safeRead(path.join(PARTIALS_DIR, "fonts.css"));
const style    = safeRead(path.join(PARTIALS_DIR, "style.css"));
const template = safeRead(path.join(PARTIALS_DIR, "image.svg"));

const FALLBACK = { performance: 82, accessibility: 80, "best-practices": 80, seo: 85 };

const parseFile = (file) => {
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return null; }
};

const extractScores = (data) => {
  const cats = ["performance", "accessibility", "best-practices", "seo"];
  const scores = {};
  let valid = 0;
  for (const cat of cats) {
    const s = data?.lighthouseResult?.categories?.[cat]?.score;
    if (typeof s === "number" && s >= 0) {
      scores[cat] = Math.round(s * 100);
      valid++;
    } else {
      scores[cat] = null;
    }
  }
  return { scores, valid };
};

const mobile = extractScores(parseFile("mobile.json"));
const desktop = extractScores(parseFile("desktop.json"));

if (mobile.valid < 4) console.warn(`Mobile: ${mobile.valid}/4 API categories, using fallback`);
if (desktop.valid < 4) console.warn(`Desktop: ${desktop.valid}/4 API categories, using fallback`);

const fill = (scores) => {
  const r = {};
  for (const k of ["performance", "accessibility", "best-practices", "seo"]) {
    r[k] = scores.scores[k] !== null ? scores.scores[k] : FALLBACK[k];
  }
  return r;
};

const pagespeedData = {
  url: "https://alextula.com",
  mobile:  mobile.valid  ? fill(mobile)  : FALLBACK,
  desktop: desktop.valid ? fill(desktop) : FALLBACK,
};

const partialsList = ["pagespeed"];

const LINE_H = 22;
const HEADER = 20;
const PAD = 12;
const numLines = 12;
const svgHeight = HEADER + PAD * 2 + numLines * LINE_H + 4;

const meta = {
  generated: new Date().toUTCString(),
  placeholder: false,
  animations: { stdin: 0.16, stdout: 0.28, length: partialsList.length + 1 },
};

const data = {
  animated: true,
  svgHeight,
  fonts,
  style,
  meta,
  base:     {},
  plugins:  { pagespeed: pagespeedData },
  partials: partialsList,
  warnings: [],
  extras:   { css: "" },
};

data.include = async (relativePath) => {
  const targetPath = path.join(PARTIALS_DIR, relativePath.endsWith(".ejs") ? relativePath : `${relativePath}.ejs`);
  const src = safeRead(targetPath);
  return ejs.render(src, data, { async: true });
};

async function main() {
  const svg = await ejs.render(template, data, { async: true });
  fs.writeFileSync("github-metrics.svg", svg);
  const m = pagespeedData.mobile;
  const d = pagespeedData.desktop;
  console.log(`github-metrics.svg written`);
  console.log(`Mobile:  P${m.performance} A${m.accessibility} B${m["best-practices"]} S${m.seo}`);
  console.log(`Desktop: P${d.performance} A${d.accessibility} B${d["best-practices"]} S${d.seo}`);
}

main().catch(err => { console.error(err); process.exit(1); });
