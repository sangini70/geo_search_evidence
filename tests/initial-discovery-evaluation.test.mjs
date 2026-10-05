import assert from "node:assert/strict";
import { evaluateInitialDiscovery } from "../src/research/initial-discovery-evaluation.mjs";
import { projectFollowUpResearch } from "../src/research/follow-up-research-projection.mjs";

const sessionId = "research_session_evaluation_test";
const request = (itemId, seed, status, collectionId, evidenceToCollect, reused = false) => ({
  research_session_id: sessionId, research_plan_id: "plan-evaluation", initial_discovery_id: "discovery-evaluation",
  research_plan_item_id: itemId, research_plan_item_ids: [itemId], search_seed: seed, normalized_search_seed: seed,
  evidence_to_collect: evidenceToCollect, context_references: [{ source_type: "PLANNER_HYPOTHESIS" }],
  source_references: [{ source_type: "PLANNER_HYPOTHESIS", line_number: 1 }], reviewer_stages: [],
  request_status: status, collection_status: status, collection_id: collectionId, reused,
});

const fullEvidence = ["SEARCH_VOLUME_PC", "SEARCH_VOLUME_MOBILE", "SEARCH_VOLUME_TOTAL", "RELATED_KEYWORDS", "PROVIDER_COMPETITION", "WEB_SEARCH_RESULT_TOTAL", "SOURCE_PROVENANCE", "COLLECTION_STATUS"];
const run = {
  run_id: "initial_discovery_run_evaluation", research_session_id: sessionId, research_plan_id: "plan-evaluation", initial_discovery_id: "discovery-evaluation",
  request_results: [
    request("item-1", "정상", "SUCCESS", "col_success", fullEvidence),
    request("item-2", "부분", "PARTIAL_SUCCESS", "col_partial", ["SEARCH_VOLUME_TOTAL", "WEB_SEARCH_RESULT_TOTAL"]),
    request("item-3", "재사용", "REUSED", "col_reused", ["SEARCH_VOLUME_PC"], true),
    request("item-4", "계산불가", "SUCCESS", "col_not_calculable", ["SEARCH_VOLUME_TOTAL"]),
  ],
};

const snapshots = new Map([
  ["col_success", { status: "SUCCESS", source_runs: [{ source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }, { source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" }], raw_references: ["ads.json"], source_provenance: [{ source: "NAVER_SEARCH_ADS" }], keywords: [{ keyword_role: "RELATED_KEYWORD" }], evidence: [{ evidence_id: "ev-pc", evidence_type: "MONTHLY_SEARCH_VOLUME_PC", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }, { evidence_id: "ev-mobile", evidence_type: "MONTHLY_SEARCH_VOLUME_MOBILE", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }, { evidence_id: "ev-comp", evidence_type: "PROVIDER_COMPETITION_VALUE", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }, { evidence_id: "ev-web", evidence_type: "SEARCH_RESULT_TOTAL", source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" }], derived_metrics: [{ metric_id: "metric-total", metric_type: "MONTHLY_SEARCH_VOLUME_TOTAL", status: "EXACT" }] }],
  ["col_partial", { status: "PARTIAL_SUCCESS", source_runs: [{ source_id: "NAVER_SEARCH_ADS", status: "FAILED" }, { source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" }], raw_references: ["web.json"], source_provenance: [{ source: "NAVER_API_HUB_WEBKR" }], evidence: [{ evidence_id: "ev-web-partial", evidence_type: "SEARCH_RESULT_TOTAL", source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" }], derived_metrics: [] }],
  ["col_reused", { status: "SUCCESS", source_runs: [{ source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }], raw_references: ["ads.json"], source_provenance: [{ source: "NAVER_SEARCH_ADS" }], evidence: [{ evidence_id: "ev-reused-pc", evidence_type: "MONTHLY_SEARCH_VOLUME_PC", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }], derived_metrics: [] }],
  ["col_not_calculable", { status: "SUCCESS", source_runs: [{ source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }], raw_references: ["ads.json"], source_provenance: [{ source: "NAVER_SEARCH_ADS" }], evidence: [], derived_metrics: [{ metric_id: "metric-missing", metric_type: "MONTHLY_SEARCH_VOLUME_TOTAL", status: "NOT_CALCULABLE" }] }],
]);
const item = (id, seed, evidence, followUp = []) => ({ research_plan_item_id: id, search_seed: seed, purpose: `${seed} purpose`, evidence_to_collect: evidence, follow_up_condition: followUp, source_references: [{ source_type: "PLANNER_HYPOTHESIS", line_number: 1 }], context_references: [{ source_type: "PLANNER_HYPOTHESIS" }] });
const plan = { research_plan_id: "plan-evaluation", plan_items: [item("item-1", "정상", fullEvidence), item("item-2", "부분", ["SEARCH_VOLUME_TOTAL", "WEB_SEARCH_RESULT_TOTAL"]), item("item-3", "재사용", ["SEARCH_VOLUME_PC"]), item("item-4", "계산불가", ["SEARCH_VOLUME_TOTAL"]) ] };
const loadSnapshot = async (collectionId) => snapshots.get(collectionId);

const evaluation = await evaluateInitialDiscovery({ researchPlan: plan, initialDiscoveryRun: run, loadSnapshot });
assert.equal(evaluation.summary.total_plan_items, 4);
assert.equal(evaluation.plan_item_evaluations[0].evaluation_status, "SATISFIED");
assert.equal(evaluation.plan_item_evaluations[1].evaluation_status, "REVIEW_REQUIRED");
assert.equal(evaluation.plan_item_evaluations[1].evidence_evaluation.find((entry) => entry.evidence_type === "WEB_SEARCH_RESULT_TOTAL").availability_status, "AVAILABLE");
assert.equal(evaluation.plan_item_evaluations[2].collection.reused, true);
assert.equal(evaluation.plan_item_evaluations[3].evidence_evaluation[0].availability_status, "NOT_CALCULABLE");
assert.equal(evaluation.plan_item_evaluations[3].evaluation_status, "PARTIALLY_SATISFIED");
assert.equal(evaluation.plan_item_evaluations[0].source_references[0].line_number, 1);

const followUp = await evaluateInitialDiscovery({ researchPlan: { ...plan, plan_items: [{ ...plan.plan_items[0], follow_up_condition: ["RELATED_SEARCH_ENTRANCE_DISCOVERED"] }] }, initialDiscoveryRun: run, loadSnapshot });
assert.equal(followUp.plan_item_evaluations[0].evaluation_status, "FOLLOW_UP_REQUIRED");
const followUpProjection = projectFollowUpResearch({ evaluation: { research_session_id: "research_session_test", research_plan_id: "research_plan_test", evaluation_id: "evaluation_test", plan_item_evaluations: [{ ...followUp.plan_item_evaluations[0] }] } });
assert.equal(followUpProjection.items[0].projection_status, "FOLLOW_UP_CANDIDATE");
const partialProjection = projectFollowUpResearch({ evaluation: { research_session_id: "research_session_test", research_plan_id: "research_plan_test", evaluation_id: "evaluation_test", plan_item_evaluations: [{ ...followUp.plan_item_evaluations[0], evaluation_status: "PARTIALLY_SATISFIED", follow_up_condition: [] }] } });
assert.equal(partialProjection.items[0].projection_status, "NO_FOLLOW_UP");
console.log("Initial Discovery Evaluation tests passed.");
