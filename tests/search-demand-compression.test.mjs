import assert from "node:assert/strict";
import { buildSearchDemandCompression, classifyKeywordRelation } from "../src/research/search-demand-compression.mjs";

const same = { normalized_keyword: "환율", keyword_ids: ["kw-1"], collection_ids: ["col-a"] };
const sameDuplicate = { normalized_keyword: "환율", keyword_ids: ["kw-2"], collection_ids: ["col-b"] };
const spaced = { normalized_keyword: "달러 가치", keyword_ids: ["kw-3"], collection_ids: ["col-a"] };
const compact = { normalized_keyword: "달러가치", keyword_ids: ["kw-4"], collection_ids: ["col-b"] };
const related = { normalized_keyword: "환율 상승 이유", keyword_ids: ["kw-5"], collection_ids: ["col-a"] };
assert.equal(classifyKeywordRelation(same, sameDuplicate), "EXACT_SAME");
assert.equal(classifyKeywordRelation(spaced, compact), "FORMAT_VARIANT_CANDIDATE");
assert.equal(classifyKeywordRelation(same, related), "RELATED_CANDIDATE");
assert.equal(classifyKeywordRelation({ normalized_keyword: "달러" }, { normalized_keyword: "외환 수요" }), "REVIEW_REQUIRED");

const compression = await buildSearchDemandCompression({
  integration: {
    integration_version: 1,
    research_session_id: "research_session_compression_test",
    target_count: 2,
    collection_count: 2,
    unique_keyword_count: 2,
    evidence_count: 2,
    metric_count: 2,
    collection_results: [{ research_target_id: "target-a", collection_id: "col-a", collection_status: "SUCCESS" }, { research_target_id: "target-b", collection_id: "col-b", collection_status: "PARTIAL_SUCCESS" }],
    session_keywords: [same, spaced],
  },
  snapshotReader: async (collectionId) => ({
    raw_references: [`data/raw/${collectionId}/ads.json`, `data/raw/${collectionId}/web.json`],
    evidence: [{ evidence_id: `ev-${collectionId}`, evidence_type: "MONTHLY_SEARCH_VOLUME_PC" }, { evidence_id: `web-${collectionId}`, evidence_type: "SEARCH_RESULT_TOTAL" }],
    derived_metrics: [{ metric_id: `met-${collectionId}` }],
  }),
});
assert.equal(compression.demand_clusters.length, 0);
assert.equal(compression.representative_entrance_candidates.length, 0);
assert.deepEqual(compression.unclustered_keyword_ids, ["kw-1", "kw-3"]);
assert.equal(compression.coverage_summary.search_volume, "AVAILABLE");
assert.equal(compression.coverage_summary.web, "AVAILABLE");
assert.equal(compression.coverage_summary.trend, "NOT_COLLECTED");
assert.equal(compression.lineage.source_evidence_ids.length, 4);
assert.equal(compression.lineage.source_metric_ids.length, 2);
console.log("Search Demand Compression tests passed.");
