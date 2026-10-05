import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { runInitialDiscovery } from "../src/research/initial-discovery-runner.mjs";
import { readInitialDiscoveryRun, saveInitialDiscoveryRun } from "../src/repositories/initial-discovery-run-repository.mjs";

function projection(sessionId, requests) {
  return {
    collection_request_projection_id: "projection-1",
    research_session_id: sessionId,
    research_plan_id: "plan-1",
    initial_discovery_id: "discovery-1",
    created_at: "2026-10-02T00:00:00.000Z",
    algorithm_version: "1.1",
    requests: requests.map((request, index) => ({
      research_session_id: sessionId,
      research_plan_id: "plan-1",
      initial_discovery_id: "discovery-1",
      research_plan_item_id: `item-${index + 1}`,
      research_plan_item_ids: [`item-${index + 1}`],
      search_seed: request.search_seed,
      normalized_search_seed: request.search_seed,
      evidence_to_collect: ["SEARCH_VOLUME_TOTAL"],
      selection_reason: ["PLANNER_MAIN_KEYWORD"],
      context_references: [{ source_type: "PLANNER_HYPOTHESIS" }],
      related_planner_hypotheses: [],
      related_reviewer_direction: [],
      reviewer_stages: [1],
      source_references: [{ source_type: "PLANNER_HYPOTHESIS", line_number: index + 1 }],
      status: "READY",
    })),
  };
}

const successProjection = projection("research_session_runner_test", [{ search_seed: "A" }, { search_seed: "B" }]);
let calls = [];
const successRun = await runInitialDiscovery({
  collectionRequestProjection: successProjection,
  runId: "run-success",
  now: "2026-10-02T00:00:00.000Z",
  collectionExecutor: async (request) => {
    calls.push(request.search_seed);
    return { collectionId: `col_${request.search_seed}`, collectionStatus: "SUCCESS", snapshot: { research_context: { research_session_id: request.research_session_id, research_plan_id: request.research_plan_id, initial_discovery_id: request.initial_discovery_id, research_plan_item_id: request.research_plan_item_id, search_seed: request.search_seed, reviewer_stages: request.reviewer_stages } } };
  },
});
assert.deepEqual(calls, ["A", "B"]);
assert.equal(successRun.status, "SUCCESS");
assert.deepEqual(successRun.collection_ids, ["col_A", "col_B"]);
assert.deepEqual(successRun.request_results[0].snapshot_research_context.research_plan_id, "plan-1");

const partialRun = await runInitialDiscovery({
  collectionRequestProjection: projection("research_session_partial", [{ search_seed: "A" }, { search_seed: "B" }]),
  collectionExecutor: async (request) => request.search_seed === "B" ? { collectionId: "col_B", collectionStatus: "PARTIAL_SUCCESS" } : { collectionId: "col_A", collectionStatus: "SUCCESS" },
});
assert.equal(partialRun.status, "PARTIAL_SUCCESS");

const failedRun = await runInitialDiscovery({
  collectionRequestProjection: projection("research_session_failed", [{ search_seed: "A" }, { search_seed: "B" }]),
  collectionExecutor: async (request) => { if (request.search_seed === "A") throw new Error("FAKE_FAILURE"); return { collectionId: "col_B", collectionStatus: "SUCCESS" }; },
});
assert.equal(failedRun.status, "PARTIAL_SUCCESS");
assert.equal(failedRun.request_results[0].request_status, "FAILED");
assert.equal(failedRun.request_results[1].request_status, "SUCCESS");

let reuseCalls = 0;
const reusedRun = await runInitialDiscovery({
  collectionRequestProjection: projection("research_session_reuse", [{ search_seed: "A" }, { search_seed: "B" }]),
  existingCollections: [{ research_session_id: "research_session_reuse", search_seed: "A", collection_id: "col_existing_a", collection_status: "SUCCESS" }],
  collectionExecutor: async () => { reuseCalls += 1; return { collectionId: "col_new", collectionStatus: "SUCCESS" }; },
});
assert.equal(reuseCalls, 1);
assert.equal(reusedRun.status, "SUCCESS");
assert.equal(reusedRun.request_results[0].request_status, "REUSED");
assert.deepEqual(reusedRun.reused_collection_ids, ["col_existing_a"]);

const reviewRun = await runInitialDiscovery({
  collectionRequestProjection: projection("research_session_review", [{ search_seed: "A" }]),
  existingCollections: [{ research_session_id: "research_session_review", search_seed: "A", collection_id: "col_old", collection_status: "FAILED" }],
  collectionExecutor: async () => { throw new Error("MUST_NOT_RETRY"); },
});
assert.equal(reviewRun.status, "REVIEW_REQUIRED");
assert.equal(reviewRun.request_results[0].request_status, "REVIEW_REQUIRED");

const runSessionId = "research_session_run_repository_test";
try {
  const saved = await saveInitialDiscoveryRun(successRun);
  assert.equal(saved.relativePath, `data/research-sessions/${successRun.research_session_id}/initial-discovery-run-v1.json`);
  const readBack = await readInitialDiscoveryRun(successRun.research_session_id);
  assert.equal(readBack.run_id, "run-success");
  assert.equal(readBack.run_version, 1);
} finally {
  await rm(`data/research-sessions/${successRun.research_session_id}`, { recursive: true, force: true });
  await rm(`data/research-sessions/${runSessionId}`, { recursive: true, force: true });
}

console.log("Initial Discovery Runner tests passed.");
