// Simple, hand-run eval harness.
//
// It sends each sample "applicant" in evals/cases/ through the LIVE roadmap API
// and prints the generated roadmap so you can eyeball quality before shipping a
// change (a new prompt, a new model, new documents).
//
// Usage:
//   1) Have the app running (locally `npm run dev`, or point at your live site).
//   2) EVAL_BASE_URL=https://start.yourdomain.com npm run eval
//      (defaults to http://localhost:3000)
//
// Note: each run creates real rows in the database (intake + roadmap + steps),
// since it exercises the real pipeline end to end.

import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.EVAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const dir = path.join(process.cwd(), "evals", "cases");

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("No case files found in evals/cases/");
  process.exit(1);
}

console.log(`Running ${files.length} eval case(s) against ${BASE}\n`);

for (const file of files) {
  const testCase = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
  console.log("=".repeat(72));
  console.log(`CASE: ${testCase.name}  (${file})`);
  console.log("=".repeat(72));

  try {
    const genRes = await fetch(`${BASE}/api/roadmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: testCase.answers }),
    });
    const gen = await genRes.json();
    if (!genRes.ok) {
      console.error(`  ERROR ${genRes.status}: ${gen.error}\n`);
      continue;
    }

    const viewRes = await fetch(`${BASE}/api/roadmap/${gen.shareToken}`);
    const view = await viewRes.json();

    console.log(`  TITLE:    ${view.roadmap.title}`);
    console.log(`  OVERVIEW: ${view.roadmap.content}`);
    console.log(`  LINK:     ${BASE}/r/${gen.shareToken}`);
    console.log(`  STEPS (${view.steps.length}):`);
    for (const s of view.steps) {
      console.log(`    • ${s.title}`);
      if (s.description) console.log(`        ${s.description}`);
    }
    console.log("");
  } catch (err) {
    console.error(`  FAILED: ${err.message}\n`);
  }
}

console.log("Done. Review the roadmaps above against the checklist in evals/README.md.");
