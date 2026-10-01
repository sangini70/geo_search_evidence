import assert from "node:assert/strict";
import { getNaverWebPreflight } from "../src/config/index.mjs";
import { normalizeNaverWebSearchResult } from "../src/normalizers/naver-web-search-result-normalizer.mjs";
import { validateNaverWebSearchEvidence } from "../src/validators/naver-web-search-result-validator.mjs";
import { COMPETITION_RATIO } from "../src/core/constants.mjs";

const evidence = normalizeNaverWebSearchResult({ collectionId: "col_test", keywordId: "kw_test", query: "달러", rawReference: "data/raw/col_test.json", responseStatus: 200, payload: { lastBuildDate: "now", total: 123, start: 1, display: 10, items: [] }, collectedAt: "2026-09-29T00:00:00.000Z", collectorVersion: "0.1.0" });
evidence.evidence_id = "ev_col_test_001";
const validation = validateNaverWebSearchEvidence(evidence);
assert.equal(validation.valid, true);
assert.equal(evidence.evidence_type, "SEARCH_RESULT_TOTAL");
assert.equal(evidence.search_vertical, "WEB");
assert.equal(evidence.value, 123);
assert.equal(evidence.metadata.raw_reference, "data/raw/col_test.json");
assert.equal(getNaverWebPreflight(" ").status, "BLOCKED");
assert.equal(COMPETITION_RATIO.formula, "NOT_CONFIGURED");
assert.equal(COMPETITION_RATIO.formulaVersion, "NOT_CONFIGURED");
console.log("WEB Search Result Total contract tests passed.");
