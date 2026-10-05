import assert from "node:assert/strict";
import { buildResearchSessionIntegration } from "../src/research/research-session-integration.mjs";

const snapshots = {
  col_a: { keywords: [{ keyword_id: "kw_a", normalized_keyword: "same" }, { keyword_id: "kw_a2", normalized_keyword: "only-a" }], evidence: [{ evidence_id: "ev_a", keyword_id: "kw_a" }, { evidence_id: "ev_a2", keyword_id: "kw_a2" }], derived_metrics: [{ metric_id: "met_a", keyword_id: "kw_a" }] },
  col_b: { keywords: [{ keyword_id: "kw_b", normalized_keyword: "same" }, { keyword_id: "kw_b2", normalized_keyword: "only-b" }], evidence: [{ evidence_id: "ev_b", keyword_id: "kw_b" }], derived_metrics: [{ metric_id: "met_b", keyword_id: "kw_b" }, { metric_id: "met_b2", keyword_id: "kw_b2" }] },
};
const integration = await buildResearchSessionIntegration({
  researchSessionId: "research_session_integration_test",
  targetResults: [
    { research_target_id: "target-a", collection_id: "col_a", collection_status: "SUCCESS" },
    { research_target_id: "target-b", collection_id: "col_b", collection_status: "PARTIAL_SUCCESS" },
    { research_target_id: "target-c", collection_id: null, collection_status: "FAILED" },
  ],
  snapshotReader: async (collectionId) => snapshots[collectionId],
  researchContextReference: { context_id: "research_context_test", context_version: 1, relative_path: "data/research-sessions/research_session_integration_test/context-v1.json" },
});

assert.equal(integration.target_count, 3);
assert.equal(integration.collection_count, 2);
assert.equal(integration.unique_keyword_count, 3);
assert.equal(integration.evidence_count, 3);
assert.equal(integration.metric_count, 3);
assert.deepEqual(integration.collection_results.map((item) => item.collection_status), ["SUCCESS", "PARTIAL_SUCCESS", "FAILED"]);
assert.deepEqual(integration.research_context_reference, { context_id: "research_context_test", context_version: 1, relative_path: "data/research-sessions/research_session_integration_test/context-v1.json" });
const same = integration.session_keywords.find((item) => item.normalized_keyword === "same");
assert.deepEqual(same.research_target_ids, ["target-a", "target-b"]);
assert.deepEqual(same.collection_ids, ["col_a", "col_b"]);
assert.deepEqual(same.source_evidence_ids, ["ev_a", "ev_b"]);
assert.deepEqual(same.source_metric_ids, ["met_a", "met_b"]);
console.log("Research Session Integration tests passed.");
