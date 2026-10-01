import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { calculateTotalSearchVolume, totalSearchVolumeContract } from "../src/metrics/total-search-volume-calculator.mjs";
import { createCollectionIdGenerator } from "../src/core/id-generator.mjs";
import { runTotalSearchVolumeForRawSnapshot } from "../src/app/total-search-volume-application.mjs";
import { COMPETITION_RATIO } from "../src/core/constants.mjs";

function evidencePair(pc, mobile) {
  return {
    collection_id: "col_test",
    keyword_id: "kw_test",
    evidence: [
      { evidence_id: "ev_col_test_001", evidence_type: "MONTHLY_SEARCH_VOLUME_PC", status: "SUCCESS", value: typeof pc === "number" ? pc : null, raw_value: pc },
      { evidence_id: "ev_col_test_002", evidence_type: "MONTHLY_SEARCH_VOLUME_MOBILE", status: "SUCCESS", value: typeof mobile === "number" ? mobile : null, raw_value: mobile },
    ],
  };
}

function calculate(pc, mobile) {
  return calculateTotalSearchVolume(evidencePair(pc, mobile), createCollectionIdGenerator("col_test"), "2026-09-29T00:00:00.000Z");
}

assert.equal(calculate(100, 200).value, 300);
assert.equal(calculate(100, 200).status, "EXACT");
for (const [pc, mobile] of [["<10", 100], [100, "< 10"], ["<10", "< 10"]]) {
  const metric = calculate(pc, mobile);
  assert.equal(metric.value, null);
  assert.equal(metric.status, "NOT_CALCULABLE");
  assert.equal(metric.input_evidence_ids.length, 2);
}
assert.equal(totalSearchVolumeContract.formula_version, "total_search_volume_v1");
assert.equal(COMPETITION_RATIO.formula, "NOT_CONFIGURED");
assert.equal(COMPETITION_RATIO.formulaVersion, "NOT_CONFIGURED");

const rawPath = "data/raw/col_1790640999226.json";
const before = createHash("sha256").update(await readFile(rawPath)).digest("hex");
const result = await runTotalSearchVolumeForRawSnapshot(rawPath, { persist: false });
const after = createHash("sha256").update(await readFile(rawPath)).digest("hex");
const metrics = result.snapshot.derived_metrics;
const evidenceById = new Map(result.snapshot.evidence.map((item) => [item.evidence_id, item]));
const exact = metrics.filter((metric) => metric.status === "EXACT");
const notCalculable = metrics.filter((metric) => metric.status === "NOT_CALCULABLE");
assert.equal(metrics.length, 509);
assert.equal(exact.length, 347);
assert.equal(notCalculable.length, 162);
assert.equal(result.snapshot.errors.length, 0);
assert.equal(new Set(result.snapshot.evidence.map((item) => item.evidence_id)).size, result.snapshot.evidence.length);
assert.equal(new Set(metrics.map((item) => item.metric_id)).size, metrics.length);
for (const metric of metrics) {
  assert.equal(metric.input_evidence_ids.length, 2);
  assert.ok(metric.input_evidence_ids.every((id) => evidenceById.has(id)));
  assert.ok(metric.input_evidence_ids.every((id) => evidenceById.get(id).collection_id === metric.collection_id));
}
for (const metric of exact) {
  const [pc, mobile] = metric.input_evidence_ids.map((id) => evidenceById.get(id).value);
  assert.equal(metric.value, pc + mobile);
}
assert.ok(notCalculable.every((metric) => metric.value === null));
assert.ok(notCalculable.some((metric) => metric.input_evidence_ids.some((id) => /^<\s*10$/.test(String(evidenceById.get(id).raw_value).trim()))));
assert.equal(before, after);
console.log(JSON.stringify({ total: metrics.length, exact: exact.length, notCalculable: notCalculable.length, failures: result.snapshot.errors.length, rawUnchanged: before === after }));
