import assert from "node:assert/strict";
import { buildPlannerDecisionBrief } from "../src/handoff/planner-decision-brief.mjs";

const consumer = {
  consumer_handoff_version: 2,
  research_session_id: "research_session_fixture",
  projection_status: "PARTIAL",
  context_summary: {
    hub_context: { hub_story: "Hub story" },
    planner_hypothesis: {
      "USER QUESTION": ["USER QUESTION: What is the demand?"],
      "DIRECT ANSWER GOAL": ["DIRECT ANSWER GOAL: Explain the evidence."],
      "UNDERSTANDING GOAL": ["UNDERSTANDING GOAL: Understand the structure."],
      "MAIN KEYWORD": ["MAIN KEYWORD: yen"],
      confirmed: true,
      source: "PLANNER_HYPOTHESIS",
    },
    reviewer_research_direction: { stage_markers: ["## 1차 핵심 조회 — Demand Anchor Discovery"], direction_markers: ["Demand Anchor 후보", "*Demand Anchor 확정: 보류**"], source: "REVIEWER_RESEARCH_DIRECTION" },
  },
  research_summary: { collection_count: 2, keyword_count: 4, evidence_count: 8, metric_count: 2, collection_ids: ["col_a", "col_b"] },
  evidence_coverage: { search_volume: "NOT_AVAILABLE", web: "AVAILABLE", trend: "NOT_COLLECTED", overall: "PARTIAL", competition_ratio: { formula: "NOT_CONFIGURED", formula_version: "NOT_CONFIGURED", status: "NOT_CONFIGURED" } },
  search_demand_summary: {
    planner_hypothesis_evidence: { status: "EVIDENCE_WEAK", items: [{ seed: "yen" }] },
    reviewer_direction_evidence: { status: "REVIEW_REQUIRED", items: [] },
    new_demand_candidates: [{ keyword_id: "kw-3", status: "REVIEW_REQUIRED" }],
    demand_clusters: [{ cluster_id: "cluster_1", status: "REVIEW_REQUIRED", review_required: true, demand_summary: "yen format variants", member_count: 2, member_keywords: [{ keyword_id: "kw_1", keyword: "yen" }, { keyword_id: "kw_2", keyword: "yenvalue" }], representative_entrance_ids: ["kw_1", "kw_2"], representative_entrances: [], evidence_coverage: { search_volume: "AVAILABLE" }, evidence_reference: { source_evidence_ids: ["ev_1"], source_metric_ids: ["mt_1"] }, interpretation_reference: "relation_1" }],
    representative_entrances: [{ candidate_id: "entrance_1", keyword_id: "kw_1", keyword: "yen", cluster_id: "cluster_1", status: "REVIEW_REQUIRED" }, { candidate_id: "entrance_2", keyword_id: "kw_2", keyword: "yenvalue", cluster_id: "cluster_1", status: "REVIEW_REQUIRED" }],
    grounded_questions: { count: 1, items: [{ question: "USER QUESTION: What is the demand?", status: "SUPPORTED", relation_ids: ["relation_1"] }] },
    relationships: { items: [{ relationship_id: "relation_1", source: { keyword_id: "kw_1", keyword: "yen" }, target: { keyword_id: "kw_2", keyword: "yenvalue" }, relationship_type: "FORMAT_VARIANT", judgment: "REVIEW_REQUIRED", review_required: true, reason: "Needs review", evidence_reference: { source_evidence_ids: ["ev_1"], source_metric_ids: ["mt_1"] } }] },
    unclustered: { count: 1, status_counts: { UNKNOWN: 1 }, relationship_counts: { NO_RELATIONSHIP_CANDIDATE: 1 }, representative_items: [{ keyword_id: "kw_3", keyword: "other", status: "UNKNOWN" }], full_handoff_reference: true },
  },
  source_evidence_summary: { collection_status_counts: { SUCCESS: 1, PARTIAL_SUCCESS: 1 }, evidence_types: ["SEARCH_RESULT_TOTAL"], collections: [{ search_seed: "원·엔 환율", collection_id: "col_b", collection_status: "PARTIAL_SUCCESS", sources: { NAVER_SEARCH_ADS: { status: "FAILED", evidence_types: ["SEARCH_RESULT_TOTAL"] }, NAVER_API_HUB_WEBKR: { status: "SUCCESS", evidence_types: ["SEARCH_RESULT_TOTAL"] } }, related_keyword_evidence: { status: "SOURCE_FAILED" } }] },
  planner_judgment_required: ["Knowledge Node creation, merge, or exclusion"],
  lineage: {
    full_handoff_reference: { path: "full-v6.json", handoff_version: 6 },
    context_reference: { relative_path: "context-v1.json" },
    integration_reference: { integration_version: 3 },
    compression_reference: { compression_version: 6 },
    collection_ids: ["col_a", "col_b"],
    source_evidence_ids: Array.from({ length: 1636 }, (_, index) => `ev_${index}`),
    source_metric_ids: Array.from({ length: 540 }, (_, index) => `metric_${index}`),
    raw_references: Array.from({ length: 32 }, (_, index) => `data/raw/raw_${index}.json`),
    source_evidence_count: 1636,
    source_metric_count: 540,
    raw_reference_count: 32,
    status: "SOURCE_REFERENCE_INCOMPLETE",
  },
};

const brief = buildPlannerDecisionBrief({ consumerHandoff: consumer, consumerHandoffPath: "consumer-v2.json", now: "2026-10-03T00:00:00.000Z" });
assert.equal(brief.decision_brief_version, null);
assert.equal(brief.context.planner_hypothesis.user_questions[0], "What is the demand?");
assert.deepEqual(brief.context.planner_hypothesis.direct_answer_goals, ["Explain the evidence."]);
assert.equal(brief.demand_decision_view.demand_clusters.length, 1);
assert.deepEqual(brief.demand_decision_view.demand_clusters[0].format_variants, [{ keywords: ["yen", "yenvalue"], relationship_id: "relation_1" }]);
assert.equal(brief.demand_decision_view.relationship_view.by_type.REVIEW_REQUIRED, 1);
assert.equal(brief.demand_decision_view.relationship_view.item_schema.length, 8);
assert.equal(brief.demand_decision_view.relationship_view.items[0][3], "FORMAT_VARIANT");
assert.equal(brief.demand_decision_view.unclustered_summary.total, 1);
assert.equal(brief.evidence_limitation_summary.partial_failures[0].search_seed, "원·엔 환율");
assert.equal(brief.evidence_limitation_summary.partial_failures[0].sources.NAVER_SEARCH_ADS.status, "FAILED");
assert.equal(brief.context.reviewer_research_direction.direction_markers.length, 1);
assert.equal(brief.lineage.full_handoff_reference.handoff_version, 6);
assert.equal(brief.lineage.source_consumer_handoff.path, "consumer-v2.json");
assert.equal(brief.lineage.source_evidence_count, 1636);
assert.equal(brief.lineage.source_metric_count, 540);
assert.equal(brief.lineage.raw_reference_count, 32);
assert.equal(brief.evidence_limitation_summary.coverage.competition_ratio.status, "NOT_CONFIGURED");
assert.equal(brief.planner_judgment_required[0], "Knowledge Node creation, merge, or exclusion");
assert.equal(brief.demand_decision_view.planner_hypothesis_evidence.status, "EVIDENCE_WEAK");
assert.equal(brief.demand_decision_view.new_demand_candidates[0].keyword_id, "kw-3");
console.log("Planner Decision Brief tests passed");
