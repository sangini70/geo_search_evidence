import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { runMultiSourceCollection } from "../src/app/multi-source-collection-orchestrator.mjs";
import { collectMultiSource, collectNaverRaw } from "../src/app/application.mjs";
import { COMPETITION_RATIO } from "../src/core/constants.mjs";
import { saveRawSnapshot } from "../src/repositories/raw-repository.mjs";
import { saveCollectionSnapshot } from "../src/repositories/snapshot-repository.mjs";

const searchPayload = {
  keywordList: [
    { relKeyword: "달러", monthlyPcQcCnt: 100, monthlyMobileQcCnt: 200, compIdx: "높음" },
    { relKeyword: "달러 환율", monthlyPcQcCnt: "<10", monthlyMobileQcCnt: 50, compIdx: "중간" },
  ],
};

const searchAdsCollector = async (query, { collectionId, sourceRunId }) => ({
  status: "SUCCESS",
  collectionId,
  sourceRunId,
  rawReference: { relativePath: `data/raw/${collectionId}/${sourceRunId}.json` },
  rawSnapshot: {
    metadata: { provider: "NAVER", source: "NAVER_SEARCH_ADS", product: "NAVER Search Ads API", query, collected_at: "2026-09-29T00:00:00.000Z" },
    raw_payload: searchPayload,
  },
});

const webCollector = async (query, { collectionId, sourceRunId }) => ({
  ok: true,
  collectionId,
  sourceRunId,
  query,
  responseStatus: 200,
  payload: { lastBuildDate: "now", total: 123, start: 1, display: 10, items: [] },
});

const result = await runMultiSourceCollection("달러", { collectionId: "col_test_multi", persist: false, searchAdsCollector, webCollector });
assert.equal(result.snapshot.status, "SUCCESS");
assert.equal(result.sourceRuns.length, 2);
assert.equal(new Set(result.sourceRuns.map((run) => run.source_run_id)).size, 2);
assert.ok(result.sourceRuns.every((run) => run.collection_id === "col_test_multi"));
assert.equal(result.snapshot.snapshot_id, "col_test_multi_v1");
assert.deepEqual(result.rawReferences, ["data/raw/col_test_multi/sr_col_test_multi_001.json", "data/raw/col_test_multi/sr_col_test_multi_002.json"]);
assert.equal(result.snapshot.evidence.filter((item) => item.source_id === "NAVER_SEARCH_ADS").length, 6);
assert.equal(result.snapshot.evidence.find((item) => item.evidence_type === "SEARCH_RESULT_TOTAL").value, 123);
assert.equal(result.snapshot.derived_metrics.length, 2);
assert.equal(result.snapshot.derived_metrics[0].value, 300);
assert.equal(result.snapshot.derived_metrics[1].status, "NOT_CALCULABLE");
assert.equal(new Set(result.evidence.map((item) => item.evidence_id)).size, result.evidence.length);
assert.equal(new Set(result.derivedMetrics.map((item) => item.metric_id)).size, result.derivedMetrics.length);
assert.ok(result.evidence.every((item) => item.collection_id === result.collectionId));
assert.ok(result.derivedMetrics.every((item) => item.collection_id === result.collectionId));
assert.equal(COMPETITION_RATIO.formula, "NOT_CONFIGURED");
assert.equal(COMPETITION_RATIO.formulaVersion, "NOT_CONFIGURED");

const boundaryCalls = [];
const boundarySearchAdsCollector = async (query, options) => {
  boundaryCalls.push({ source: "search_ads", query, options });
  return searchAdsCollector(query, options);
};
const boundaryWebCollector = async (query, options) => {
  boundaryCalls.push({ source: "web", query, options });
  return webCollector(query, options);
};
const boundaryResult = await collectMultiSource("dollar", {
  collectionId: "col_test_application_boundary",
  snapshotVersion: 7,
  persist: false,
  searchAdsCollector: boundarySearchAdsCollector,
  webCollector: boundaryWebCollector,
});
assert.equal(boundaryResult.snapshot.snapshot_id, "col_test_application_boundary_v7");
assert.deepEqual(boundaryCalls.map((call) => call.query), ["dollar", "dollar"]);
assert.deepEqual(boundaryCalls.map((call) => call.options.collectionId), ["col_test_application_boundary", "col_test_application_boundary"]);
assert.deepEqual(boundaryCalls.map((call) => call.options.sourceRunId), ["sr_col_test_application_boundary_001", "sr_col_test_application_boundary_002"]);
assert.equal(boundaryResult.collectionId, "col_test_application_boundary");
assert.equal(typeof collectNaverRaw, "function");

const partial = await runMultiSourceCollection("달러", {
  collectionId: "col_test_partial",
  persist: false,
  searchAdsCollector,
  webCollector: async () => ({ ok: false, error: { type: "AUTH_FAILED", status: 401 } }),
});
assert.equal(partial.snapshot.status, "PARTIAL_SUCCESS");
assert.equal(partial.sourceRuns.filter((run) => run.status === "SUCCESS").length, 1);
assert.equal(partial.sourceRuns.filter((run) => run.status === "FAILED").length, 1);
assert.ok(partial.snapshot.evidence.some((item) => item.source_id === "NAVER_SEARCH_ADS"));
assert.equal(partial.snapshot.errors.length, 1);

const repositoryCollectionId = `col_test_repository_${Date.now()}`;
const repositoryRawDirectory = `data/raw/${repositoryCollectionId}`;
const repositorySnapshotDirectory = `data/snapshots/${repositoryCollectionId}`;
try {
  const rawSnapshot = { metadata: { collection_id: repositoryCollectionId }, raw_payload: { source: "test" } };
  const rawSaved = await saveRawSnapshot(repositoryCollectionId, rawSnapshot, { sourceRunId: `sr_${repositoryCollectionId}_001` });
  assert.equal(rawSaved.relativePath, `${repositoryRawDirectory}/sr_${repositoryCollectionId}_001.json`);
  await assert.rejects(() => saveRawSnapshot(repositoryCollectionId, rawSnapshot, { sourceRunId: `sr_${repositoryCollectionId}_001` }), /RAW snapshot already exists/);
  const snapshot = { collection_id: repositoryCollectionId, source_runs: [], evidence: [], derived_metrics: [], errors: [] };
  const v1 = await saveCollectionSnapshot(repositoryCollectionId, snapshot, { snapshotVersion: 1 });
  const v2 = await saveCollectionSnapshot(repositoryCollectionId, snapshot, { snapshotVersion: 2 });
  assert.equal(v1.relativePath, `${repositorySnapshotDirectory}/v1.json`);
  assert.equal(v2.relativePath, `${repositorySnapshotDirectory}/v2.json`);
} finally {
  await rm(repositoryRawDirectory, { recursive: true, force: true });
  await rm(repositorySnapshotDirectory, { recursive: true, force: true });
}
console.log("Multi-source Collection contract tests passed.");
