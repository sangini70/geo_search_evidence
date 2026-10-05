import assert from "node:assert/strict";
import { projectFollowUpResearch } from "../src/research/follow-up-research-projection.mjs";

const base = (id, status, condition = [], coverage = []) => ({
  research_plan_item_id: id,
  search_seed: id,
  normalized_search_seed: id,
  reviewer_stages: [2],
  evaluation_status: status,
  follow_up_condition: condition,
  requested_evidence: ["RELATED_KEYWORDS"],
  evidence_evaluation: coverage,
  collection: { collection_id: `col_${id}`, collection_status: "SUCCESS", reused: false },
  source_references: [{ marker: "REVIEW_QUERY_STAGE_2" }],
  context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION" }],
});

const availableRelated = [{ evidence_type: "RELATED_KEYWORDS", availability_status: "AVAILABLE", source_type: "NAVER_SEARCH_ADS" }];
const missingRelated = [{ evidence_type: "RELATED_KEYWORDS", availability_status: "NOT_AVAILABLE", source_type: "NAVER_SEARCH_ADS" }];
const evaluation = (items) => ({ research_session_id: "research_session_test", research_plan_id: "research_plan_test", evaluation_id: "evaluation_test", plan_item_evaluations: items });

let result = projectFollowUpResearch({ evaluation: evaluation([
  base("satisfied", "SATISFIED"),
  base("partial", "PARTIALLY_SATISFIED", [], missingRelated),
  base("failed", "REVIEW_REQUIRED", [], missingRelated),
  base("candidate", "FOLLOW_UP_REQUIRED", ["RELATED_SEARCH_ENTRANCE_DISCOVERED"], availableRelated),
]) });
assert.deepEqual(result.summary, { total_plan_items: 4, no_follow_up: 2, follow_up_candidate: 1, review_required: 1 });
assert.equal(result.items.find((item) => item.search_seed === "candidate").projection_status, "FOLLOW_UP_CANDIDATE");
assert.equal(result.items.find((item) => item.search_seed === "partial").projection_status, "NO_FOLLOW_UP");
assert.equal(result.items.find((item) => item.search_seed === "failed").projection_status, "REVIEW_REQUIRED");
assert.equal(result.items.find((item) => item.search_seed === "candidate").existing_collection_ids[0], "col_candidate");
assert.deepEqual(result.items.find((item) => item.search_seed === "candidate").reviewer_stages, [2]);
console.log("Follow-up Research Projection tests passed.");
