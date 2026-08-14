#!/usr/bin/env node
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

try { require.resolve("ejs"); }
catch { execSync("npm install --no-save ejs", { stdio: "inherit" }); }
const ejs = require("ejs");

const TEMPLATE_DIR = path.join(__dirname, "metrics-template/partials");

const fonts    = fs.readFileSync(path.join(TEMPLATE_DIR, "fonts.css"),   "utf8");
const style    = fs.readFileSync(path.join(TEMPLATE_DIR, "styles.css"),  "utf8");
const template = fs.readFileSync(path.join(TEMPLATE_DIR, "pagespeed.ejs"),   "utf8");

const mobile  = JSON.parse(fs.readFileSync("mobile.json",  "utf8"));
const desktop = JSON.parse(fs.readFileSync("desktop.json", "utf8"));

const score = (data, cat) =>
  Math.round((data?.lighthouseResult?.categories?.[cat]?.score ?? 0) * 100);

const pagespeedData = {
  url: "https://alextula.com",
  score: {
    performance:      score(mobile, "performance"),
    accessibility:    score(mobile, "accessibility"),
    "best-practices": score(mobile, "best-practices"),
    seo:              score(mobile, "seo"),
  },
};

const partialsList = ["pagespeed"];

const meta = {
  generated: new Date().toUTCString(),
  placeholder: false,
  animations: { stdin: 0.16, stdout: 0.28, length: partialsList.length + 1 },
};

const data = {
  animated: true,
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
  const src = fs.readFileSync(path.join(TEMPLATE_DIR, relativePath), "utf8");
  return ejs.render(src, data, { async: true });
};

async function main() {
  const svg = await ejs.render(template, data, { async: true });
  fs.writeFileSync("github-metrics.svg", svg);
  const s = pagespeedData.score;
  console.log(`✓ github-metrics.svg written`);
  console.log(`  Performance ${s.performance} · Accessibility ${s.accessibility} · Best Practices ${s["best-practices"]} · SEO ${s.seo}`);
}

main().catch(err => { console.error(err); process.exit(1); });
