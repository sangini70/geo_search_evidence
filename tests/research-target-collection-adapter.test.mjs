import assert from "node:assert/strict";
import { executeSingleResearchTargetCollection } from "../src/research/research-target-collection-adapter.mjs";

const requests = [
  { research_session_id: "session-1", research_target_id: "target-a", search_seed: "A", source_types: ["PLANNER_HYPOTHESIS"], source_references: [{ line_number: 1 }], reviewer_stages: [1], reason: "planner", status: "READY" },
  { research_session_id: "session-1", research_target_id: "target-b", search_seed: "B", source_types: ["REVIEWER_RESEARCH_DIRECTION"], source_references: [{ line_number: 2 }], reason: "reviewer", status: "READY" },
];

let calls = [];
const mapping = await executeSingleResearchTargetCollection({
  collectionRequests: requests,
  researchTargetId: "target-a",
  collectionExecutor: async (request) => { calls.push(request); return { collectionId: "col_fake_returned", snapshot: { status: "SUCCESS" } }; },
});
assert.deepEqual(calls.map((request) => request.search_seed), ["A"]);
assert.equal(mapping.collection_id, "col_fake_returned");
assert.equal(mapping.research_session_id, "session-1");
assert.equal(mapping.research_target_id, "target-a");
assert.deepEqual(mapping.source_references, requests[0].source_references);
assert.deepEqual(mapping.reviewer_stages, [1]);
assert.equal(Object.hasOwn(mapping, "collection_id"), true);

await assert.rejects(() => executeSingleResearchTargetCollection({ collectionRequests: [{ ...requests[0], status: "EXCLUDED" }], researchTargetId: "target-a", collectionExecutor: async () => ({ collectionId: "should-not-run" }) }), /RESEARCH_TARGET_NOT_READY/);
await assert.rejects(() => executeSingleResearchTargetCollection({ collectionRequests: requests, researchTargetId: null, collectionExecutor: async () => ({ collectionId: "should-not-run" }) }), /SINGLE_RESEARCH_TARGET_REQUIRED/);
await assert.rejects(() => executeSingleResearchTargetCollection({ collectionRequests: requests, researchTargetId: "target-a", collectionExecutor: async () => ({ collectionStatus: "SUCCESS" }) }), /COLLECTION_ID_NOT_RETURNED/);
console.log("Research Target Collection Adapter tests passed.");
