import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { projectInitialDiscovery } from "../src/research/initial-discovery-projection.mjs";
import { readInitialDiscoveryProjection, saveInitialDiscoveryProjection } from "../src/repositories/initial-discovery-repository.mjs";

const sessionId = `research_session_discovery_test_${Date.now()}`;
const researchPlan = {
  research_plan_id: `research_plan_${sessionId}`,
  research_session_id: sessionId,
  plan_items: [
    {
      research_plan_item_id: "item-hub",
      search_seed: "hub seed",
      context_references: [{ source_type: "HUB_CONTEXT", context_field: "hub_context" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [],
      source_references: [{ source_type: "HUB_CONTEXT", marker: "EXPLICIT_HUB_SEARCH_EXPRESSION" }],
    },
    {
      research_plan_item_id: "item-main",
      search_seed: "planner main",
      context_references: [{ source_type: "PLANNER_HYPOTHESIS", context_field: "planner_hypothesis" }],
      related_planner_hypotheses: [{ source_type: "PLANNER_HYPOTHESIS", marker: "MAIN_KEYWORD" }],
      related_reviewer_direction: [],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [],
      source_references: [{ source_type: "PLANNER_HYPOTHESIS", marker: "MAIN_KEYWORD" }],
    },
    {
      research_plan_item_id: "item-stage-1",
      search_seed: "reviewer anchor",
      context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", context_field: "reviewer_direction" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_1" }],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [1],
      source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_1" }],
    },
    {
      research_plan_item_id: "item-reviewer-core",
      search_seed: "reviewer demand anchor",
      context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", context_field: "reviewer_direction" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "DEMAND_ANCHOR_GROUP" }],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [1],
      source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "DEMAND_ANCHOR_GROUP" }],
    },
    {
      research_plan_item_id: "item-stage-2",
      search_seed: "reviewer entrance",
      context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", context_field: "reviewer_direction" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_2" }],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [2],
      source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_2" }],
    },
    {
      research_plan_item_id: "item-stage-3",
      search_seed: "reviewer long tail",
      context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", context_field: "reviewer_direction" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_3" }],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [3],
      source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_3" }],
    },
  ],
};

const projection = projectInitialDiscovery({ researchPlan, researchPlanVersion: 1, now: "2026-10-02T00:00:00.000Z" });
assert.equal(projection.status, "READY");
assert.deepEqual(projection.selected_items.map((item) => item.research_plan_item_id), ["item-hub", "item-main", "item-reviewer-core"]);
assert.deepEqual(projection.selected_items[0].selection_reason, ["HUB_DIRECT"]);
assert.deepEqual(projection.selected_items[1].selection_reason, ["PLANNER_MAIN_KEYWORD"]);
assert.deepEqual(projection.selected_items[2].selection_reason, ["REVIEWER_CORE_QUERY"]);
assert.deepEqual(projection.deferred_items.map((item) => item.research_plan_item_id), ["item-stage-1", "item-stage-2", "item-stage-3"]);
assert.equal(projection.deferred_items[0].defer_reason, "INSUFFICIENT_INITIAL_JUSTIFICATION");
assert.equal(projection.deferred_items[1].defer_reason, "RELATION_QUERY");
assert.equal(projection.deferred_items[2].defer_reason, "LONG_TAIL_VERIFICATION");
assert.deepEqual(projection.selected_items[2].reviewer_stages, [1]);
assert.equal(Object.values(projection).some((value) => value === "EXECUTE"), false);
assert.equal(projection.selected_items.some((item) => Object.hasOwn(item, "collection_id")), false);
assert.equal(projection.selected_items.length + projection.deferred_items.length, researchPlan.plan_items.length);

try {
  const saved = await saveInitialDiscoveryProjection(projection);
  assert.equal(saved.relativePath, `data/research-sessions/${sessionId}/initial-discovery-v1.json`);
  const readBack = await readInitialDiscoveryProjection(sessionId);
  assert.equal(readBack.projection_version, 1);
  assert.equal(readBack.research_plan_id, researchPlan.research_plan_id);
  assert.equal(readBack.selected_items.length, 3);
} finally {
  await rm(`data/research-sessions/${sessionId}`, { recursive: true, force: true });
}

console.log("Initial Discovery Projection tests passed.");
