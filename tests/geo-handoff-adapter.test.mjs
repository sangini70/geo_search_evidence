import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { adaptSearchEvidencePack, GeoHandoffContractError } from "../src/handoff/geo-handoff-adapter.mjs";

const collectionId = "col_1790688323936";
const pack = JSON.parse(await readFile(`data/snapshots/${collectionId}/pack-v1.json`, "utf8"));
const handoff = adaptSearchEvidencePack(pack);

assert.equal(handoff.handoff_version, "1.0");
assert.equal(handoff.schema_version, pack.metadata.schema_version);
assert.equal(handoff.pack_version, pack.metadata.pack_version);
assert.equal(handoff.collection_id, collectionId);
assert.equal(handoff.canonical_keywords.length, 509);
assert.equal(handoff.canonical_keywords.filter((keyword) => keyword.keyword_role === "HUB_SEED").length, 1);
assert.equal(handoff.canonical_keywords.filter((keyword) => keyword.keyword_role === "RELATED_KEYWORD").length, 508);
assert.equal(new Set(handoff.canonical_keywords.map((keyword) => keyword.keyword_id)).size, 509);
assert.equal(new Set(handoff.evidence.map((evidence) => evidence.evidence_id)).size, 1528);
assert.equal(new Set(handoff.derived_metrics.map((metric) => metric.metric_id)).size, 509);

const seed = handoff.keyword_deliveries.find((keyword) => keyword.keyword_role === "HUB_SEED");
const web = handoff.evidence.find((evidence) => evidence.evidence_type === "SEARCH_RESULT_TOTAL");
assert.equal(seed.keyword_id, "kw_col_1790688323936_001");
assert.ok(seed.web_search_result_total);
assert.equal(handoff.coverage[seed.keyword_id].web_search_result_total, "AVAILABLE");
assert.equal(web.keyword_id, "kw_col_1790688323936_001");
assert.ok(handoff.keyword_deliveries.every((keyword) => keyword.keyword_role === "HUB_SEED" || keyword.coverage.web_search_result_total === "NOT_COLLECTED"));
assert.equal(handoff.keyword_deliveries.filter((keyword) => keyword.total_search_volume_status === "NOT_CALCULABLE").length, 162);
assert.equal(handoff.keyword_deliveries.filter((keyword) => keyword.total_search_volume_status === "EXACT").length, 347);
assert.equal(handoff.competition_ratio.formula, "NOT_CONFIGURED");
assert.equal(handoff.competition_ratio.formula_version, "NOT_CONFIGURED");
assert.equal(handoff.competition_ratio.status, "NOT_CONFIGURED");
assert.ok(handoff.raw_references.every((reference) => typeof reference === "string"));

assert.throws(() => adaptSearchEvidencePack({}), (error) => error instanceof GeoHandoffContractError && error.violations.includes("REQUIRED_FIELD_MISSING:metadata"));
const invalid = structuredClone(pack);
invalid.keywords[0].keyword_id = "invalid_keyword_id";
assert.throws(() => adaptSearchEvidencePack(invalid), (error) => error instanceof GeoHandoffContractError && error.violations.some((item) => item.includes("ORPHAN")));

console.log("GEO Handoff Adapter tests passed.");
