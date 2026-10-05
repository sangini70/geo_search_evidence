import assert from "node:assert/strict";
import { projectInitialDiscoveryCollectionRequests } from "../src/research/initial-discovery-collection-requests.mjs";

const projection = {
  initial_discovery_id: "initial_discovery_plan-1",
  research_plan_id: "research_plan_session-1",
  research_session_id: "session-1",
  created_at: "2026-10-02T00:00:00.000Z",
  algorithm_version: "1.1",
  selected_items: [
    {
      research_plan_item_id: "item-a",
      search_seed: "엔화  환율",
      selection_reason: ["PLANNER_MAIN_KEYWORD"],
      context_references: [{ source_type: "PLANNER_HYPOTHESIS" }],
      related_planner_hypotheses: [{ marker: "MAIN_KEYWORD" }],
      related_reviewer_direction: [],
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      reviewer_stages: [],
      source_references: [{ source_type: "PLANNER_HYPOTHESIS", marker: "MAIN_KEYWORD" }],
    },
    {
      research_plan_item_id: "item-a-reviewer",
      search_seed: "엔화 환율",
      selection_reason: ["REVIEWER_CORE_QUERY"],
      context_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [{ marker: "DEMAND_ANCHOR_GROUP" }],
      evidence_to_collect: ["WEB_SEARCH_RESULT_TOTAL"],
      reviewer_stages: [1],
      source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "DEMAND_ANCHOR_GROUP" }],
    },
  ],
  deferred_items: [{ research_plan_item_id: "item-deferred", search_seed: "엔화 환율 원인" }],
};

const result = projectInitialDiscoveryCollectionRequests({ initialDiscovery: projection });
assert.equal(result.status, "READY");
assert.equal(result.request_count, 1);
const request = result.requests[0];
assert.equal(request.search_seed, "엔화  환율");
assert.deepEqual(request.research_plan_item_ids, ["item-a", "item-a-reviewer"]);
assert.deepEqual(request.selection_reason, ["PLANNER_MAIN_KEYWORD", "REVIEWER_CORE_QUERY"]);
assert.deepEqual(request.evidence_to_collect, ["SEARCH_VOLUME_TOTAL", "WEB_SEARCH_RESULT_TOTAL"]);
assert.deepEqual(request.reviewer_stages, [1]);
assert.equal(request.source_references.length, 2);
assert.equal(Object.hasOwn(request, "collection_id"), false);
assert.equal(result.requests.some((item) => item.search_seed.includes("원인")), false);
console.log("Initial Discovery Collection Request tests passed.");
