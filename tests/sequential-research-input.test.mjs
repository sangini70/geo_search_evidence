import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../src/ui/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/ui/app.mjs", import.meta.url), "utf8");

for (const id of ["hub-seed", "hub-story", "story-direction", "planner-hypothesis", "reviewer-direction", "confirm-hub-context", "confirm-planner-hypothesis", "confirm-reviewer-direction", "research-ready", "confirm-all-research-seeds", "reset-all-research-seeds"]) {
  assert.match(html, new RegExp(`id=\\"${id}\\"`));
}
assert.match(app, /const researchInput =/);
assert.match(app, /hub_context:/);
assert.match(app, /planner_hypothesis:/);
assert.match(app, /reviewer_research_direction:/);
assert.match(app, /researchInput\.hub_context\.confirmed = true/);
assert.match(app, /researchInput\.planner_hypothesis\.confirmed = true/);
assert.match(app, /researchInput\.reviewer_research_direction\.confirmed = true/);
assert.match(app, /invalidateResearchFrom/);
assert.match(html, /Research Context 준비 완료/);
assert.match(html, /src="\/app\.mjs\?v=phase3-review"/);
assert.match(app, /confirmHubContextButton\.addEventListener/);
assert.match(app, /confirmAllResearchSeedsButton\.addEventListener/);
assert.match(app, /resetAllResearchSeedsButton\.addEventListener/);
assert.match(app, /researchSeedsHeader\?\.replaceChildren/);
assert.match(app, /\["Research Seed", "Source", "Reason", "Decision"\]/);
assert.doesNotMatch(app, /runtimeFixtureExportButton|researchSeedRuntimeDiagnostic|\[research-seed\]/);
assert.doesNotMatch(app, /fetch\("\/diagnostic\/runtime-fixture"/);
assert.equal((app.match(/fetch\("\/collect"/g) || []).length, 1);
console.log("Sequential Research Input tests passed.");
