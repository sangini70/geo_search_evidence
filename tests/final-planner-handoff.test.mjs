import assert from "node:assert/strict";
import { buildFinalPlannerHandoff } from "../src/handoff/final-planner-handoff.mjs";

const handoff = buildFinalPlannerHandoff({
  context: { research_session_id: "session-handoff-test", hub_context: { hub_seed: "환율" }, planner_hypothesis: { raw_text: "Planner" }, reviewer_research_direction: { raw_text: "Reviewer" } },
  integration: { research_session_id: "session-handoff-test", integration_version: 1, source_research_session_id: "source-session", source_collection_ids: ["col-1"], collection_results: [{ collection_id: "col-1", search_seed: "alpha", normalized_search_seed: "alpha", collection_status: "PARTIAL_SUCCESS", source_runs: [{ source_run_id: "run-ads", source_id: "NAVER_SEARCH_ADS", status: "FAILED", raw_reference: null }, { source_run_id: "run-web", source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS", raw_reference: "raw-web" }], evidence_availability: { evidence_types: ["SEARCH_RESULT_TOTAL"], metric_types: [], source_statuses: { NAVER_SEARCH_ADS: "FAILED", NAVER_API_HUB_WEBKR: "SUCCESS" }, evidence_count: 1, metric_count: 0 } }], session_keywords: [{ normalized_keyword: "alpha", keyword_ids: ["kw-1"], source_evidence_ids: ["ev-1"], source_metric_ids: ["met-1"] }, { normalized_keyword: "beta", keyword_ids: ["kw-2"], source_evidence_ids: ["ev-2"], source_metric_ids: [] }], lineage: { source_evidence_ids: ["ev-1"], source_metric_ids: ["met-1"], raw_references: ["raw-1"] }, unique_keyword_count: 2, evidence_count: 3, metric_count: 1 },
  compression: { research_session_id: "session-handoff-test", compression_version: 1, source_integration: { unique_keyword_count: 2, evidence_count: 3, metric_count: 1 }, coverage_summary: { search_volume: "AVAILABLE", web: "AVAILABLE", trend: "NOT_COLLECTED" }, demand_clusters: [{ cluster_id: "cluster-1", status: "REVIEW_REQUIRED" }], representative_entrance_candidates: [], grounded_question_links: [], unclustered_keyword_ids: ["kw-2"], interpreted_relationships: [{ relation_id: "r-1", relation_type: "RELATED_DEMAND", left_keyword_id: "kw-1", left_keyword: "alpha", right_keyword_id: "kw-2", right_keyword: "beta", status: "REVIEW_REQUIRED", source_keyword_ids: ["kw-1", "kw-2"], interpretation_basis: "review" }], planner_hypothesis_evidence: { status: "EVIDENCE_WEAK", items: [{ seed: "alpha" }] }, reviewer_direction_evidence: { status: "REVIEW_REQUIRED", items: [] }, new_demand_candidates: [{ keyword_id: "kw-2", status: "REVIEW_REQUIRED" }], lineage: {} },
  sourceCompression: { lineage: {} },
});
assert.equal(handoff.research_session_id, "session-handoff-test");
assert.equal(handoff.research_summary.source_research_session_id, "source-session");
assert.deepEqual(handoff.lineage.source_evidence_ids, ["ev-1"]);
assert.equal(handoff.search_demand_findings.demand_clusters[0].status, "REVIEW_REQUIRED");
assert.ok(handoff.planner_judgment_required.some((item) => item.includes("Cluster adoption")));
assert.equal(handoff.search_demand_findings.relationship_candidates[0].relationship_id, "r-1");
assert.equal(handoff.search_demand_findings.relationship_candidates[0].review_required, true);
assert.equal(handoff.search_demand_findings.unclustered_summary.details[0].unclustered_reason_status, "REVIEW_REQUIRED");
assert.equal(handoff.search_demand_findings.source_evidence_status[0].related_keyword_evidence.status, "SOURCE_FAILED");
assert.equal(handoff.search_demand_findings.source_evidence_status[0].sources.NAVER_API_HUB_WEBKR.status, "SUCCESS");
assert.equal(handoff.search_demand_findings.planner_hypothesis_evidence.status, "EVIDENCE_WEAK");
assert.equal(handoff.search_demand_findings.new_demand_candidates[0].keyword_id, "kw-2");
console.log("Final Planner Handoff tests passed");
