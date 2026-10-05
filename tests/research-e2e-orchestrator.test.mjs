import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvironmentValue } from "../src/config/index.mjs";
import { runResearchSessionE2E } from "../src/app/application.mjs";
import { generateResearchSeeds } from "../src/research/research-seed-generator.mjs";
import { saveResearchArtifactInvalidation } from "../src/repositories/research-artifact-invalidation-repository.mjs";
import { saveRawSnapshot } from "../src/repositories/raw-repository.mjs";
import { saveResearchSessionContext } from "../src/repositories/research-session-context-repository.mjs";
import { saveCollectionSnapshot } from "../src/repositories/snapshot-repository.mjs";

function contextInput() {
  return {
    hubContext: { hub_story: "alpha hub story", story_direction: "alpha demand" },
    plannerHypothesis: { raw_text: "MAIN KEYWORD: alpha" },
    reviewerResearchDirection: { raw_text: "Demand Anchor: alpha" },
  };
}

function snapshotFor(request) {
  const collectionId = `col_${request.research_session_id}_alpha`;
  const keywordId = `kw_${collectionId}_001`;
  return {
    snapshot_id: `${collectionId}_v1`, snapshot_version: 1, collection_id: collectionId,
    seed_keyword: request.search_seed, status: "SUCCESS", captured_at: "2026-10-05T00:00:00.000Z",
    research_context: { research_session_id: request.research_session_id, search_seed: request.search_seed, normalized_search_seed: request.normalized_search_seed },
    keywords: [{ keyword_id: keywordId, collection_id: collectionId, raw_keyword: request.search_seed, normalized_keyword: request.normalized_search_seed, keyword_role: "HUB_SEED", status: "VALID" }],
    source_runs: [
      { source_run_id: `${collectionId}_ads`, collection_id: collectionId, source_id: "NAVER_SEARCH_ADS", status: "SUCCESS" },
      { source_run_id: `${collectionId}_web`, collection_id: collectionId, source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS" },
    ],
    evidence: [
      { evidence_id: `${collectionId}_pc`, collection_id: collectionId, keyword_id: keywordId, evidence_type: "MONTHLY_SEARCH_VOLUME_PC", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS", value: 100 },
      { evidence_id: `${collectionId}_mobile`, collection_id: collectionId, keyword_id: keywordId, evidence_type: "MONTHLY_SEARCH_VOLUME_MOBILE", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS", value: 200 },
      { evidence_id: `${collectionId}_competition`, collection_id: collectionId, keyword_id: keywordId, evidence_type: "PROVIDER_COMPETITION_VALUE", source_id: "NAVER_SEARCH_ADS", status: "SUCCESS", value: "LOW" },
      { evidence_id: `${collectionId}_web`, collection_id: collectionId, keyword_id: keywordId, evidence_type: "SEARCH_RESULT_TOTAL", source_id: "NAVER_API_HUB_WEBKR", status: "SUCCESS", value: 123 },
    ],
    derived_metrics: [{ metric_id: `${collectionId}_total`, collection_id: collectionId, keyword_id: keywordId, metric_type: "MONTHLY_SEARCH_VOLUME_TOTAL", formula_version: "total_search_volume_v1", status: "EXACT", value: 300 }],
    errors: [], raw_references: [`data/raw/${collectionId}/ads.json`, `data/raw/${collectionId}/web.json`],
    source_provenance: [{ source_id: "NAVER_SEARCH_ADS" }, { source_id: "NAVER_API_HUB_WEBKR" }],
  };
}

function executorWith(counter) {
  return async (request) => {
    counter.calls += 1;
    const snapshot = snapshotFor(request);
    await saveCollectionSnapshot(snapshot.collection_id, snapshot, { snapshotVersion: 1 });
    return { collectionId: snapshot.collection_id, collectionStatus: "SUCCESS", snapshot, sourceRuns: snapshot.source_runs };
  };
}

const successSession = "research_session_orchestrator_success";
const successInput = contextInput();
const successCounter = { calls: 0 };
for (const name of ["GEO_DATA_ROOT", "GEO_BACKUP_ROOT", "NAVER_ADS_CUSTOMER_ID", "NAVER_ADS_ACCESS_LICENSE", "NAVER_ADS_SECRET_KEY", "NAVER_API_HUB_CLIENT_ID", "NAVER_API_HUB_CLIENT_SECRET"]) assert.ok(getEnvironmentValue(name));
const persistedContextSession = "research_session_orchestrator_context_reuse";
const persistedContext = {
  hub_context: { hub_story: "persisted hub story", story_direction: "persisted demand direction", confirmed: true },
  planner_hypothesis: { raw_text: "MAIN KEYWORD: persisted alpha\nSECONDARY KEYWORDS: persisted beta, persisted gamma", confirmed: true },
  reviewer_research_direction: { raw_text: "Demand Anchor: persisted alpha\nSearch Entrance: persisted beta\n1차 핵심 조회\n```\npersisted stage one\n```\n2차 추가 조회\n```\npersisted stage two\n```\n3차 선택 조회\n```\npersisted stage three\n```", confirmed: true },
};
const expectedPersistedSeeds = generateResearchSeeds(persistedContext);
await saveResearchSessionContext({ researchSessionId: persistedContextSession, context: persistedContext, now: "2026-10-05T00:00:00.000Z" });
const contextReuseResult = await runResearchSessionE2E({
  researchSessionId: persistedContextSession,
  collectionExecutor: async () => { throw new Error("CONTEXT_REUSE_TEST_STOP"); },
});
assert.equal(contextReuseResult.status, "PARTIAL");
assert.equal(contextReuseResult.artifacts.research_plan.plan_items.length, expectedPersistedSeeds.length);
assert.ok(expectedPersistedSeeds.length > 0);
assert.deepEqual(contextReuseResult.artifacts.research_plan.context.hub_context, persistedContext.hub_context);
assert.deepEqual(contextReuseResult.artifacts.research_plan.context.planner_hypothesis, persistedContext.planner_hypothesis);
assert.deepEqual(contextReuseResult.artifacts.research_plan.context.reviewer_direction, persistedContext.reviewer_research_direction);
assert.ok(contextReuseResult.artifacts.research_plan.plan_items.every((item) => Array.isArray(item.source_references)));
assert.ok(contextReuseResult.artifacts.research_plan.plan_items.every((item) => Array.isArray(item.reviewer_stages)));
assert.ok(contextReuseResult.artifacts.research_plan.plan_items.some((item) => item.reviewer_stages.includes(1)));
assert.ok(contextReuseResult.artifacts.research_plan.plan_items.some((item) => item.reviewer_stages.includes(2)));
assert.ok(contextReuseResult.artifacts.research_plan.plan_items.some((item) => item.reviewer_stages.includes(3)));

const invalidationSession = "research_session_orchestrator_invalidation";
const invalidationCounter = { calls: 0 };
let invalidationCollectionId = null;
const invalidationExecutor = async (request) => {
  invalidationCounter.calls += 1;
  const snapshot = snapshotFor(request);
  invalidationCollectionId = snapshot.collection_id;
  await saveRawSnapshot(snapshot.collection_id, { metadata: { source: "NAVER_SEARCH_ADS" }, raw_payload: { seed: request.search_seed } }, { sourceRunId: snapshot.source_runs[0].source_run_id });
  await saveCollectionSnapshot(snapshot.collection_id, snapshot, { snapshotVersion: 1 });
  return { collectionId: snapshot.collection_id, collectionStatus: "SUCCESS", snapshot, sourceRuns: snapshot.source_runs };
};
const invalidationFirst = await runResearchSessionE2E({ researchSessionId: invalidationSession, ...contextInput(), collectionExecutor: invalidationExecutor });
assert.equal(invalidationFirst.status, "COMPLETED");
assert.equal(invalidationCounter.calls, 1);
const invalidationDirectory = join(process.env.GEO_DATA_ROOT, "research-sessions", invalidationSession);
const v1Files = (await readdir(invalidationDirectory)).filter((name) => /-v1\.json$/u.test(name));
const v1ContentsBefore = new Map(await Promise.all(v1Files.map(async (name) => [name, await readFile(join(invalidationDirectory, name), "utf8")])));
const rawDirectory = join(process.env.GEO_DATA_ROOT, "raw", invalidationCollectionId);
const rawFiles = await readdir(rawDirectory);
const rawContentsBefore = new Map(await Promise.all(rawFiles.map(async (name) => [name, await readFile(join(rawDirectory, name), "utf8")])));
await saveResearchArtifactInvalidation({
  researchSessionId: invalidationSession,
  invalidatedArtifacts: [
    { artifact_type: "research_plan", version: 1 },
    { artifact_type: "initial_discovery", version: 1 },
    { artifact_type: "initial_discovery_run", version: 1 },
    { artifact_type: "evaluation", version: 1 },
    { artifact_type: "follow_up", version: 1 },
    { artifact_type: "integration", version: 1 },
    { artifact_type: "compression", version: 1 },
    { artifact_type: "compression", version: 2 },
    { artifact_type: "full_planner_handoff", version: 1 },
    { artifact_type: "planner_consumer_handoff", version: 1 },
    { artifact_type: "planner_decision_brief", version: 1 },
  ],
  reasonCode: "INVALID_E2E_CONTEXT_INPUT",
  reason: "Research Plan and downstream artifacts were generated from empty E2E context input.",
  replacementStartStage: "RESEARCH_PLAN",
  createdAt: "2026-10-05T00:00:00.000Z",
});
const invalidationSecond = await runResearchSessionE2E({
  researchSessionId: invalidationSession,
  collectionExecutor: async () => { throw new Error("SUCCESS_COLLECTION_MUST_NOT_RERUN"); },
});
assert.equal(invalidationSecond.status, "COMPLETED");
assert.equal(invalidationCounter.calls, 1);
assert.equal(invalidationSecond.artifacts.context.context_version, 1);
assert.equal(invalidationSecond.artifacts.research_plan.plan_version, 2);
assert.equal(invalidationSecond.artifacts.initial_discovery.projection_version, 2);
assert.equal(invalidationSecond.artifacts.initial_discovery_run.run_version, 2);
assert.equal(invalidationSecond.artifacts.evaluation.evaluation_version, 2);
assert.equal(invalidationSecond.artifacts.follow_up.projection_version, 2);
assert.equal(invalidationSecond.artifacts.integration.integration_version, 2);
assert.ok(invalidationSecond.artifacts.compression.compression_version >= 3);
assert.equal(invalidationSecond.artifacts.full_planner_handoff.handoff_version, 2);
assert.equal(invalidationSecond.artifacts.planner_consumer_handoff.consumer_handoff_version, 2);
assert.equal(invalidationSecond.artifacts.planner_decision_brief.decision_brief_version, 2);
assert.ok(invalidationSecond.artifacts.planner_decision_brief);
assert.equal(invalidationSecond.artifacts.planner_decision_brief.final_knowledge_node, undefined);
assert.ok(invalidationCollectionId);
const v1ContentsAfter = new Map(await Promise.all(v1Files.map(async (name) => [name, await readFile(join(invalidationDirectory, name), "utf8")])));
assert.deepEqual(v1ContentsAfter, v1ContentsBefore);
const rawContentsAfter = new Map(await Promise.all(rawFiles.map(async (name) => [name, await readFile(join(rawDirectory, name), "utf8")])));
assert.deepEqual(rawContentsAfter, rawContentsBefore);
const first = await runResearchSessionE2E({ researchSessionId: successSession, ...successInput, collectionExecutor: executorWith(successCounter) });
assert.equal(first.status, "COMPLETED");
assert.deepEqual(first.state_history, ["READY", "RUNNING", "COMPLETED"]);
assert.equal(successCounter.calls, 1);
assert.ok(first.artifacts.planner_decision_brief);
assert.ok(first.artifacts.planner_decision_brief.context);
assert.ok(first.artifacts.planner_decision_brief.lineage);
assert.equal(first.artifacts.planner_consumer_handoff.lineage.full_handoff_reference.path, `data/research-sessions/${successSession}/final-planner-handoff-v1.json`);
assert.equal(first.artifacts.planner_decision_brief.lineage.source_consumer_handoff.path, `data/research-sessions/${successSession}/planner-consumer-handoff-v1.json`);
assert.equal(first.artifacts.planner_decision_brief.lineage.source_evidence_count, first.artifacts.planner_consumer_handoff.lineage.source_evidence_count);
assert.equal(first.artifacts.planner_decision_brief.lineage.source_metric_count, first.artifacts.planner_consumer_handoff.lineage.source_metric_count);
assert.equal(first.artifacts.planner_decision_brief.lineage.raw_reference_count, first.artifacts.planner_consumer_handoff.lineage.raw_reference_count);
assert.deepEqual(first.artifacts.planner_decision_brief.lineage.source_evidence_ids, first.artifacts.planner_consumer_handoff.lineage.source_evidence_ids);
assert.deepEqual(first.artifacts.planner_decision_brief.lineage.source_metric_ids, first.artifacts.planner_consumer_handoff.lineage.source_metric_ids);
assert.deepEqual(first.artifacts.planner_decision_brief.lineage.raw_references, first.artifacts.planner_consumer_handoff.lineage.raw_references);
assert.equal(Object.hasOwn(first.artifacts.planner_decision_brief, "final_knowledge_node"), false);

const second = await runResearchSessionE2E({ researchSessionId: successSession, ...successInput, collectionExecutor: async () => { throw new Error("COLLECTION_MUST_NOT_RERUN"); } });
assert.equal(second.status, "COMPLETED");
assert.equal(successCounter.calls, 1);
assert.ok(second.stages.filter((stage) => stage.stage !== "INITIAL_DISCOVERY_COLLECTION_REQUESTS").every((stage) => stage.reused));

const partialSession = "research_session_orchestrator_partial";
let partialCalls = 0;
const partialFirst = await runResearchSessionE2E({ researchSessionId: partialSession, ...contextInput(), collectionExecutor: async () => { partialCalls += 1; throw new Error("SYNTHETIC_COLLECTION_FAILURE"); } });
assert.equal(partialFirst.status, "PARTIAL");
assert.deepEqual(partialFirst.state_history, ["READY", "RUNNING", "PARTIAL"]);
assert.equal(partialCalls, 1);
assert.equal(partialFirst.artifacts.initial_discovery_run.status, "FAILED");
const partialSecond = await runResearchSessionE2E({ researchSessionId: partialSession, ...contextInput(), collectionExecutor: async () => { partialCalls += 1; throw new Error("COLLECTION_MUST_NOT_RERUN"); } });
assert.equal(partialSecond.status, "PARTIAL");
assert.equal(partialCalls, 1);
assert.equal(partialSecond.failed_stage, null);

let preflightCalls = 0;
const missingRoot = await runResearchSessionE2E({ researchSessionId: "research_session_orchestrator_no_root", ...contextInput(), environment: { dataRoot: "", backupRoot: process.env.GEO_BACKUP_ROOT }, collectionExecutor: async () => { preflightCalls += 1; } });
assert.equal(missingRoot.status, "FAILED");
assert.deepEqual(missingRoot.state_history, ["READY", "FAILED"]);
assert.equal(missingRoot.failed_stage, "ENVIRONMENT_PREFLIGHT");
assert.equal(missingRoot.error, "DATA_ROOT_REQUIRED");
assert.equal(preflightCalls, 0);
const fallbackRoot = await runResearchSessionE2E({ researchSessionId: "research_session_orchestrator_fallback", ...contextInput(), environment: { dataRoot: join(fileURLToPath(new URL("../", import.meta.url)), "data"), backupRoot: process.env.GEO_BACKUP_ROOT }, collectionExecutor: async () => { preflightCalls += 1; } });
assert.equal(fallbackRoot.status, "FAILED");
assert.equal(fallbackRoot.error, "DATA_ROOT_WORKSPACE_FALLBACK_FORBIDDEN");
assert.equal(preflightCalls, 0);
const backupMissing = await runResearchSessionE2E({ researchSessionId: "research_session_orchestrator_backup_missing", ...contextInput(), environment: { dataRoot: process.env.GEO_DATA_ROOT, backupRoot: "" }, collectionExecutor: async () => { preflightCalls += 1; } });
assert.equal(backupMissing.status, "FAILED");
assert.equal(backupMissing.error, "BACKUP_ROOT_REQUIRED");
assert.equal(preflightCalls, 0);
const credentialsMissing = await runResearchSessionE2E({ researchSessionId: "research_session_orchestrator_credentials_missing", ...contextInput(), environment: { dataRoot: process.env.GEO_DATA_ROOT, backupRoot: process.env.GEO_BACKUP_ROOT, searchAdsPreflight: { credentialsConfigured: false }, webSearchPreflight: { credentialsConfigured: true } }, collectionExecutor: async () => { preflightCalls += 1; } });
assert.equal(credentialsMissing.status, "FAILED");
assert.equal(credentialsMissing.error, "API_CONFIGURATION_REQUIRED");
assert.equal(preflightCalls, 0);

const versionSession = "research_session_orchestrator_versions";
await runResearchSessionE2E({ researchSessionId: versionSession, ...contextInput(), collectionExecutor: executorWith({ calls: 0 }) });
const versionDirectory = join(process.env.GEO_DATA_ROOT, "research-sessions", versionSession);
const before = (await readdir(versionDirectory)).sort();
await runResearchSessionE2E({ researchSessionId: versionSession, ...contextInput(), collectionExecutor: async () => { throw new Error("COLLECTION_MUST_NOT_RERUN"); } });
const after = (await readdir(versionDirectory)).sort();
assert.deepEqual(after, before);

console.log("Research E2E Orchestrator tests passed.");

console.log("Environment loading and credential preflight tests passed.");
