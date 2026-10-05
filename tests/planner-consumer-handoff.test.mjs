import assert from "node:assert/strict";
import { buildPlannerConsumerHandoff } from "../src/handoff/planner-consumer-handoff.mjs";

const fullHandoff = {
  handoff_version: 6,
  research_session_id: "session-consumer-test",
  hub_context: { hub_seed: "yen", hub_story: "story", story_direction: "direction" },
  planner_hypothesis_summary: { raw_text: "- MAIN KEYWORD: 엔화 환율\n- USER QUESTION: 무엇인가?", confirmed: true, source: "PLANNER_HYPOTHESIS" },
  reviewer_research_direction_summary: { raw_text: "1차 핵심 조회\nDemand Anchor Discovery", confirmed: true, source: "REVIEWER_RESEARCH_DIRECTION" },
  research_summary: { collection_ids: ["col-1"], keyword_count: 3, evidence_count: 4, metric_count: 1, coverage: { overall: "PARTIAL" }, source_research_session_id: null },
  evidence_coverage: { search_volume: "NOT_AVAILABLE", web: "AVAILABLE", trend: "NOT_COLLECTED", provider_competition: "NOT_AVAILABLE" },
  search_demand_findings: {
    planner_hypothesis_evidence: { status: "EVIDENCE_WEAK", items: [{ seed: "yen" }] },
    reviewer_direction_evidence: { status: "REVIEW_REQUIRED", items: [] },
    new_demand_candidates: [{ keyword_id: "kw-3", status: "REVIEW_REQUIRED" }],
    demand_clusters: [{ cluster_id: "cluster-1", status: "REVIEW_REQUIRED", demand_summary: "yen", member_keyword_ids: ["kw-1"], representative_search_entrance_candidates: ["kw-1"], coverage: { trend: "NOT_COLLECTED" }, provenance: { collection_ids: ["col-1"] }, source_evidence_ids: ["ev-1"], source_metric_ids: ["metric-1"] }],
    representative_entrances: [{ candidate_id: "entry-1", keyword_id: "kw-1", keyword: "엔화", cluster_id: "cluster-1", status: "REVIEW_REQUIRED", source_evidence_ids: ["ev-1"], provenance: { collection_ids: ["col-1"] } }],
    grounded_questions: [{ question: "무엇인가?", status: "SUPPORTED", relation_id: "rel-1" }],
    relationship_candidates: [
      { relationship_id: "rel-1", source_keyword_id: "kw-1", source_keyword: "엔화", target_keyword_id: "kw-2", target_keyword: "엔화 환율", relationship_type: "SAME_DEMAND_CANDIDATE", judgment: "SUPPORTED", review_required: false, source_evidence_ids: ["ev-1"], source_metric_ids: [] },
      { relationship_id: "rel-2", source_keyword_id: "kw-1", source_keyword: "엔화", target_keyword_id: "kw-3", target_keyword: "환율", relationship_type: "RELATED_DEMAND", judgment: "REVIEW_REQUIRED", review_required: true, source_evidence_ids: ["ev-2"], source_metric_ids: [] },
    ],
    unclustered_summary: { count: 1, details: [{ keyword_id: "kw-3", keyword: "환율", has_relationship_candidate: true, relationship_candidate_ids: ["rel-2"], review_required: true, unclustered_reason_status: "REVIEW_REQUIRED", collection_source_references: [] }] },
    source_evidence_status: [{ search_seed: "원·엔 환율", collection_id: "col-1", collection_status: "PARTIAL_SUCCESS", sources: { NAVER_SEARCH_ADS: { status: "FAILED", evidence_types: ["SEARCH_RESULT_TOTAL"] }, NAVER_API_HUB_WEBKR: { status: "SUCCESS", evidence_types: ["SEARCH_RESULT_TOTAL"] } }, related_keyword_evidence: { status: "SOURCE_FAILED" } }],
  },
  planner_judgment_required: ["Knowledge Node creation, merge, or exclusion"],
  lineage: { context_reference: { path: "context-v1.json" }, integration_reference: { integration_version: 3 }, compression_reference: { compression_version: 6 }, source_collection_ids: ["col-1"], source_evidence_ids: ["ev-1"], source_metric_ids: ["metric-1"], raw_references: ["raw-1"] },
};

const consumer = buildPlannerConsumerHandoff({ fullHandoff, fullHandoffPath: "final-planner-handoff-v6.json" });
assert.equal(consumer.projection_status, "READY");
assert.equal(consumer.lineage.status, "COMPLETE");
assert.deepEqual(consumer.lineage.source_evidence_ids, ["ev-1"]);
assert.deepEqual(consumer.lineage.source_metric_ids, ["metric-1"]);
assert.deepEqual(consumer.lineage.raw_references, ["raw-1"]);
assert.equal(consumer.lineage.full_handoff_reference.path, "final-planner-handoff-v6.json");
assert.equal(consumer.context_summary.planner_hypothesis["MAIN KEYWORD"].length, 1);
assert.equal(consumer.search_demand_summary.demand_clusters.length, 1);
assert.equal(consumer.search_demand_summary.relationships.same_demand_candidate, 1);
assert.equal(consumer.search_demand_summary.relationships.related_demand, 1);
assert.equal(consumer.search_demand_summary.relationships.review_required, 1);
assert.equal(consumer.search_demand_summary.unclustered.count, 1);
assert.equal(consumer.source_evidence_summary.collections[0].related_keyword_evidence.status, "SOURCE_FAILED");
assert.equal(consumer.evidence_coverage.competition_ratio.status, "NOT_CONFIGURED");
assert.equal(consumer.planner_judgment_required[0], "Knowledge Node creation, merge, or exclusion");
assert.equal(consumer.search_demand_summary.planner_hypothesis_evidence.status, "EVIDENCE_WEAK");
assert.equal(consumer.search_demand_summary.new_demand_candidates[0].keyword_id, "kw-3");
assert.equal("raw_text" in consumer.context_summary.planner_hypothesis, false);
assert.equal("ranking" in consumer, false);
assert.equal("score" in consumer, false);

const incomplete = buildPlannerConsumerHandoff({
  fullHandoff: {
    ...fullHandoff,
    lineage: { context_reference: { path: "context-v1.json" }, source_collection_ids: ["col-1"] },
  },
  fullHandoffPath: "final-planner-handoff-v6.json",
});
assert.equal(incomplete.projection_status, "PARTIAL");
assert.equal(incomplete.lineage.status, "SOURCE_REFERENCE_INCOMPLETE");
console.log("Planner Consumer Handoff tests passed");
