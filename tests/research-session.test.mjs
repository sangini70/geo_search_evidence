import assert from "node:assert/strict";
import { createResearchSession, projectCollectionRequests } from "../src/research/research-session.mjs";

const session = createResearchSession({
  researchSessionId: "research_session_test",
  hubContext: { hub_seed: "Hub context" },
  researchTargets: [
    { research_target_id: "target-a", keyword: "A", decision: "PROPOSED", source_types: ["PLANNER_HYPOTHESIS"], source_references: [{ source_type: "PLANNER_HYPOTHESIS", line_number: 1 }], reviewer_stages: [1], reason: "planner", collection_status: "READY" },
    { research_target_id: "target-b", keyword: "B", decision: "CONFIRMED", source_types: ["REVIEWER_RESEARCH_DIRECTION"], source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", line_number: 2 }], reviewer_stages: [2, 3], reason: "reviewer", collection_status: "READY" },
    { research_target_id: "target-c", keyword: "C", decision: "EXCLUDED", source_types: ["HUB_CONTEXT"], source_references: [{ source_type: "HUB_CONTEXT", line_number: 3 }], reason: "excluded", collection_status: "READY" },
  ],
});

assert.equal(session.research_targets.length, 3);
const projection = projectCollectionRequests(session);
assert.equal(projection.status, "READY");
assert.equal(projection.count, 2);
assert.deepEqual(projection.requests.map((request) => request.search_seed), ["A", "B"]);
assert.deepEqual(projection.requests.map((request) => request.research_target_id), ["target-a", "target-b"]);
assert.equal(projection.requests.every((request) => request.status === "READY"), true);
assert.deepEqual(projection.requests.map((request) => request.reviewer_stages), [[1], [2, 3]]);
assert.equal(projection.requests.some((request) => Object.hasOwn(request, "collection_id")), false);
assert.deepEqual(projection.requests[0].source_references, session.research_targets[0].source_references);
assert.equal(projectCollectionRequests({ ...session, research_targets: [] }).status, "NOT_READY");
console.log("Research Session tests passed.");
