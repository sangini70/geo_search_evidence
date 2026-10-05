import assert from "node:assert/strict";
import { createResearchSession } from "../src/research/research-session.mjs";
import { executeResearchSessionCollections } from "../src/research/research-session-collection.mjs";

const session = createResearchSession({
  researchSessionId: "research_session_multi_test",
  researchTargets: [
    { research_target_id: "target-a", keyword: "A", decision: "CONFIRMED", source_types: ["PLANNER_HYPOTHESIS"], source_references: [{ line: 1 }], reviewer_stages: [1], reason: "planner", collection_status: "READY" },
    { research_target_id: "target-b", keyword: "B", decision: "PROPOSED", source_types: ["REVIEWER_RESEARCH_DIRECTION"], source_references: [{ line: 2 }], reason: "reviewer", collection_status: "READY" },
    { research_target_id: "target-c", keyword: "C", decision: "CONFIRMED", source_types: ["REVIEWER_RESEARCH_DIRECTION"], source_references: [{ line: 3 }], reviewer_stages: [2, 3], reason: "reviewer", collection_status: "READY" },
    { research_target_id: "target-d", keyword: "D", decision: "EXCLUDED", source_types: ["HUB_CONTEXT"], source_references: [{ line: 4 }], reason: "excluded", collection_status: "READY" },
  ],
});

const calls = [];
const result = await executeResearchSessionCollections({
  researchSession: session,
  collectionExecutor: async (request) => {
    calls.push(request);
    if (request.research_target_id === "target-c") throw new Error("FAKE_FAILURE");
    return { collectionId: "col_fake_a", snapshot: { status: "SUCCESS", source_runs: [{ source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" }, { source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" }], keywords: [{ id: 1 }], evidence: [{ id: 1 }], derived_metrics: [{ id: 1 }] } };
  },
});

assert.deepEqual(calls.map((call) => call.research_target_id), ["target-a", "target-c"]);
assert.deepEqual(calls.map((call) => call.search_seed), ["A", "C"]);
assert.equal(result.research_session_id, "research_session_multi_test");
assert.equal(result.summary.total_targets, 2);
assert.equal(result.summary.completed_count, 2);
assert.equal(result.summary.success_count, 1);
assert.equal(result.summary.failed_count, 1);
assert.equal(result.results[0].collection_id, "col_fake_a");
assert.equal(result.results[1].collection_id, null);
assert.deepEqual(result.results[0].source_references, [{ line: 1 }]);
assert.deepEqual(result.results[0].reviewer_stages, [1]);
assert.deepEqual(result.results[1].reviewer_stages, [2, 3]);
console.log("Research Session Collection tests passed.");
