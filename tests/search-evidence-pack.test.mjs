import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildSearchEvidencePackFromFiles, validateSearchEvidencePack } from "../src/pack/search-evidence-pack-builder.mjs";
import { COMPETITION_RATIO } from "../src/core/constants.mjs";

const collectionId = "col_1790686493058";
const pack = await buildSearchEvidencePackFromFiles(
  `data/snapshots/${collectionId}/v1.json`,
  `data/raw/${collectionId}/sr_${collectionId}_001.json`,
  { generatedAt: "2026-09-29T00:00:00.000Z" },
);
const validation = validateSearchEvidencePack(pack);

assert.equal(validation.valid, true, validation.errors.join(", "));
assert.equal(pack.keywords.length, 509);
assert.equal(pack.keywords.filter((keyword) => keyword.keyword_role === "HUB_SEED").length, 1);
assert.equal(pack.keywords.filter((keyword) => keyword.keyword_role === "RELATED_KEYWORD").length, 508);
assert.equal(new Set(pack.keywords.map((keyword) => keyword.keyword_id)).size, 509);
assert.equal(pack.evidence.length, 1528);
assert.equal(pack.derived_metrics.length, 509);
assert.equal(pack.metadata.keyword_count, 509);
assert.equal(pack.metadata.evidence_count, 1528);
assert.equal(pack.metadata.derived_metric_count, 509);
assert.equal(pack.source_summary.NAVER_SEARCH_ADS.status, "SUCCESS");
assert.equal(pack.source_summary.NAVER_API_HUB_WEBKR.status, "SUCCESS");
assert.equal(pack.source_summary.NAVER_API_HUB_SEARCH_TREND.status, "NOT_COLLECTED");
assert.equal(pack.coverage[pack.hub_seed.keyword_id].web_search_result_total, "AVAILABLE");
assert.equal(pack.coverage[pack.hub_seed.keyword_id].trend, "NOT_COLLECTED");
assert.ok(pack.keywords.filter((keyword) => keyword.keyword_role === "RELATED_KEYWORD").every((keyword) => pack.coverage[keyword.keyword_id].web_search_result_total === "NOT_COLLECTED"));
assert.ok(pack.keywords.every((keyword) => keyword.evidence_ids.length >= 3 && keyword.metric_ids.length === 1 && keyword.raw_references.length >= 1));
assert.ok(pack.derived_metrics.some((metric) => metric.status === "NOT_CALCULABLE" && metric.value === null));
assert.equal(pack.competition_ratio.formula, "NOT_CONFIGURED");
assert.equal(pack.competition_ratio.formula_version, "NOT_CONFIGURED");
assert.equal(pack.competition_ratio.status, "NOT_CONFIGURED");
assert.equal(pack.hub_seed.web_search_result_total.source_keyword_id, `${"kw_"}${collectionId}_510`);
assert.ok(Object.keys(pack.keyword_id_aliases).length > 0);

const serialized = JSON.stringify(pack);
for (const key of ["NAVER_ADS_CUSTOMER_ID", "NAVER_ADS_ACCESS_LICENSE", "NAVER_ADS_SECRET_KEY", "NAVER_API_HUB_CLIENT_ID", "NAVER_API_HUB_CLIENT_SECRET", "Authorization", "Signature"]) {
  assert.equal(serialized.includes(key), false, `secret field leaked: ${key}`);
}
const snapshot = JSON.parse(await readFile(`data/snapshots/${collectionId}/v1.json`, "utf8"));
assert.equal(snapshot.evidence.length, 1528);
assert.equal(snapshot.derived_metrics.length, 509);
assert.equal(COMPETITION_RATIO.formula, "NOT_CONFIGURED");

const canonicalCollectionId = "col_1790688323936";
const canonicalPack = await buildSearchEvidencePackFromFiles(
  `data/snapshots/${canonicalCollectionId}/v1.json`,
  `data/raw/${canonicalCollectionId}/sr_${canonicalCollectionId}_001.json`,
  { generatedAt: "2026-09-29T00:00:00.000Z" },
);
assert.equal(validateSearchEvidencePack(canonicalPack).valid, true);
assert.equal(Object.hasOwn(canonicalPack, "keyword_id_aliases"), false);
const canonicalSeed = canonicalPack.keywords.find((keyword) => keyword.keyword_role === "HUB_SEED");
const canonicalWeb = canonicalPack.evidence.find((evidence) => evidence.evidence_type === "SEARCH_RESULT_TOTAL");
assert.equal(canonicalSeed.keyword_id, canonicalWeb.keyword_id);
assert.equal(canonicalPack.keywords.find((keyword) => keyword.keyword_id === canonicalSeed.keyword_id).evidence_ids.includes(canonicalWeb.evidence_id), true);

const latestCollectionId = "col_1790695616409";
const latestPack = await buildSearchEvidencePackFromFiles(
  `data/snapshots/${latestCollectionId}/v1.json`,
  `data/raw/${latestCollectionId}/sr_${latestCollectionId}_001.json`,
  { generatedAt: "2026-09-29T00:00:00.000Z" },
);
const latestValidation = validateSearchEvidencePack(latestPack);
assert.equal(latestValidation.valid, true, latestValidation.errors.join(", "));
assert.equal(latestValidation.counts.keywords, 509);
assert.equal(latestPack.keywords.find((keyword) => keyword.keyword_role === "HUB_SEED").raw_keyword, "달러");
assert.equal(latestPack.keywords.find((keyword) => keyword.keyword_role === "HUB_SEED").coverage.web_search_result_total, "AVAILABLE");
assert.equal(latestPack.keywords.filter((keyword) => keyword.keyword_role === "RELATED_KEYWORD").every((keyword) => keyword.coverage.web_search_result_total === "NOT_COLLECTED"), true);
assert.equal(Object.hasOwn(latestPack, "keyword_id_aliases"), false);
assert.equal(JSON.stringify(latestPack).includes("raw_payload"), false);
console.log("Search Evidence Pack tests passed.");
