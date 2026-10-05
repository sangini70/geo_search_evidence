import assert from "node:assert/strict";
import { buildInterpretedSearchDemandCompression, interpretRelationshipCandidate } from "../src/research/search-demand-interpretation.mjs";

const integration = {
  research_session_id: "session-interpretation-test",
  session_keywords: [
    { normalized_keyword: "원달러 환율", keyword_ids: ["kw-1"], research_target_ids: ["target-1"], collection_ids: ["col-1"], source_evidence_ids: ["ev-1"], source_metric_ids: ["metric-1"] },
    { normalized_keyword: "원달러환율", keyword_ids: ["kw-2"], research_target_ids: ["target-1"], collection_ids: ["col-1"], source_evidence_ids: ["ev-2"], source_metric_ids: ["metric-2"] },
    { normalized_keyword: "환율 상승 이유", keyword_ids: ["kw-3"], research_target_ids: ["target-1"], collection_ids: ["col-1"], source_evidence_ids: ["ev-3"], source_metric_ids: [] },
    { normalized_keyword: "환율 오르는 이유", keyword_ids: ["kw-4"], research_target_ids: ["target-1"], collection_ids: ["col-1"], source_evidence_ids: ["ev-4"], source_metric_ids: [] },
  ],
};

const compression = {
  compression_id: "compression-v1-test",
  compression_version: 1,
  research_session_id: integration.research_session_id,
  source_integration: { integration_version: 1, target_count: 1, collection_count: 1, unique_keyword_count: 4, evidence_count: 4, metric_count: 2 },
  relationship_candidates: [
    { relation_id: "relation_1_2", relation: "FORMAT_VARIANT_CANDIDATE", left_keyword: "원달러 환율", right_keyword: "원달러환율", status: "NOT_CONFIRMED" },
    { relation_id: "relation_3_4", relation: "RELATED_CANDIDATE", left_keyword: "환율 상승 이유", right_keyword: "환율 오르는 이유", status: "NOT_CONFIRMED" },
  ],
  coverage_summary: { search_volume: "AVAILABLE", web: "AVAILABLE", trend: "NOT_COLLECTED", provenance: "COMPLETE", overall: "PARTIAL" },
  lineage: { source_keyword_ids: ["kw-1", "kw-2", "kw-3", "kw-4"], source_evidence_ids: ["ev-1", "ev-2", "ev-3", "ev-4"], source_metric_ids: ["metric-1", "metric-2"], raw_references: ["raw-1"] },
};

assert.equal(interpretRelationshipCandidate({ relation: "RELATED_CANDIDATE", relation_id: "r" }).relation_type, "RELATED_DEMAND");
assert.equal(interpretRelationshipCandidate({ relation: "REVIEW_REQUIRED", relation_id: "r" }).status, "REVIEW_REQUIRED");
const result = buildInterpretedSearchDemandCompression({ compression, integration });
assert.equal(result.interpreted_relationships.length, 2);
assert.equal(result.relationship_summary.format_variant, 1);
assert.equal(result.relationship_summary.related_demand, 1);
assert.equal(result.relationship_summary.same_demand_candidate, 0);
assert.equal(result.relationship_summary.review_required, 2);
assert.equal(result.demand_clusters.length, 1);
assert.deepEqual(result.demand_clusters[0].member_keyword_ids, ["kw-1", "kw-2"]);
assert.deepEqual(result.demand_clusters[0].source_evidence_ids, ["ev-1", "ev-2"]);
assert.deepEqual(result.demand_clusters[0].source_metric_ids, ["metric-1", "metric-2"]);
assert.equal(result.representative_entrance_candidates.length, 2);
assert.deepEqual(result.grounded_question_links, []);
assert.equal(result.clustered_keyword_ids.length + result.unclustered_keyword_ids.length, 4);
assert.deepEqual(result.lineage.source_keyword_ids, compression.lineage.source_keyword_ids);

const contextResult = buildInterpretedSearchDemandCompression({
  compression,
  integration,
  researchContext: {
    hub_context: { hub_story: "환율 구조", story_direction: "환율 수요", confirmed: true },
    planner_hypothesis: { raw_text: "MAIN KEYWORD\n- 환율 상승 이유", confirmed: true },
    reviewer_research_direction: { raw_text: "Search Entrance:\n- 환율 상승 이유\n- 환율 오르는 이유", confirmed: true },
  },
});
const contextRelation = contextResult.interpreted_relationships.find((item) => item.relation_id === "relation_3_4");
assert.equal(contextRelation.relation_type, "SAME_DEMAND_CANDIDATE");
assert.equal(contextRelation.status, "SUPPORTED");
assert.equal(contextResult.demand_clusters.some((cluster) => cluster.status === "SUPPORTED"), true);
assert.equal(contextResult.grounded_question_links.length, 0);
assert.equal(contextResult.clustered_keyword_ids.length + contextResult.unclustered_keyword_ids.length, 4);
console.log("Search Demand Interpretation tests passed");
