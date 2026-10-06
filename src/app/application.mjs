import { COMPETITION_RATIO, SCHEMA_VERSION } from "../core/constants.mjs";
import { getNaverPreflight } from "../config/index.mjs";
import { collectNaverRaw as collectNaverSearchAdsSource } from "../collectors/naver-search-demand-collector.mjs";
import { createCollectionIdGenerator } from "../core/id-generator.mjs";
import { runMultiSourceCollection } from "./multi-source-collection-orchestrator.mjs";
import { readSearchEvidencePack } from "../repositories/pack-repository.mjs";
import { readReviewSelection, saveReviewSelection, listReviewVersions } from "../repositories/review-selection-repository.mjs";
import { readGeoHandoff, saveGeoHandoff, listGeoHandoffVersions } from "../repositories/geo-handoff-repository.mjs";
import { buildGeoHandoffFromReview } from "../handoff/review-selection-handoff.mjs";
import { executeResearchSessionCollections } from "../research/research-session-collection.mjs";
import { createResearchSessionIntegration } from "../research/research-session-integration.mjs";
import { createSearchDemandCompression } from "../research/search-demand-compression.mjs";
import { createInterpretedSearchDemandCompression } from "../research/search-demand-interpretation.mjs";
import { readResearchSessionContext, saveResearchSessionContext } from "../repositories/research-session-context-repository.mjs";
import { readResearchSessionIntegration } from "../repositories/research-session-integration-repository.mjs";
import { readSearchDemandCompression } from "../repositories/search-demand-compression-repository.mjs";
import { createFinalPlannerHandoff } from "../handoff/final-planner-handoff.mjs";
import { readFinalPlannerHandoff } from "../repositories/final-planner-handoff-repository.mjs";
import { readLatestPlannerDecisionBriefFile, listCompletedResearchSessions } from "../repositories/planner-decision-brief-repository.mjs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "../repositories/storage-paths.mjs";
import { runInitialDiscovery } from "../research/initial-discovery-runner.mjs";
import { saveInitialDiscoveryRun } from "../repositories/initial-discovery-run-repository.mjs";
import { readInitialDiscoveryRun } from "../repositories/initial-discovery-run-repository.mjs";
import { evaluateInitialDiscovery } from "../research/initial-discovery-evaluation.mjs";
import { saveInitialDiscoveryEvaluation, readInitialDiscoveryEvaluation } from "../repositories/initial-discovery-evaluation-repository.mjs";
import { readCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { projectFollowUpResearch } from "../research/follow-up-research-projection.mjs";
import { saveFollowUpResearchProjection, readFollowUpResearchProjection } from "../repositories/follow-up-research-projection-repository.mjs";
import { RESEARCH_E2E_STATUS, runResearchSessionE2E } from "./research-e2e-orchestrator.mjs";

const snapshotRoot = dataDirectory("snapshots");

function normalizeSearchSeed(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

async function findExistingCollectionForRequest(request) {
  let entries;
  try { entries = await readdir(snapshotRoot, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
  for (const entry of entries.filter((item) => item.isDirectory())) {
    try {
      const snapshot = JSON.parse(await readFile(join(snapshotRoot, entry.name, "v1.json"), "utf8"));
      const context = snapshot.research_context;
      if (context?.research_session_id !== request.research_session_id) continue;
      if (normalizeSearchSeed(context.search_seed || snapshot.seed_keyword) !== request.normalized_search_seed) continue;
      return { collection_id: snapshot.collection_id, collection_status: snapshot.status, snapshot };
    } catch (error) { if (error.code !== "ENOENT") continue; }
  }
  return null;
}

function collectionResearchContext(request) {
  return {
    research_session_id: request.research_session_id,
    research_plan_id: request.research_plan_id,
    initial_discovery_id: request.initial_discovery_id,
    research_target_id: request.research_target_id,
    research_plan_item_id: request.research_plan_item_id,
    research_plan_item_ids: request.research_plan_item_ids,
    search_seed: request.search_seed,
    normalized_search_seed: request.normalized_search_seed,
    evidence_to_collect: request.evidence_to_collect,
    selection_reason: request.selection_reason,
    context_references: request.context_references,
    related_planner_hypotheses: request.related_planner_hypotheses,
    related_reviewer_direction: request.related_reviewer_direction,
    source_types: request.source_types,
    source_references: request.source_references,
    reviewer_stages: request.reviewer_stages,
    reason: request.reason,
  };
}

export function getStatus(seedKeyword = "달러") {
  return Object.freeze({
    name: "GEO Search Evidence Collector",
    stage: "Stage 5-1 — RAW Evidence Collection",
    schemaVersion: SCHEMA_VERSION,
    status: "READY_FOR_COLLECTION",
    sourcePreflight: getNaverPreflight(seedKeyword),
    competitionRatio: COMPETITION_RATIO,
  });
}

export function collectNaverRaw(seedKeyword) {
  const collectionId = `col_${Date.now()}`;
  const sourceRunId = createCollectionIdGenerator(collectionId).nextSourceRunId();
  return collectNaverSearchAdsSource(seedKeyword, { collectionId, sourceRunId });
}

export function collectMultiSource(seedKeyword, options = {}) {
  return runMultiSourceCollection(seedKeyword, options);
}

export function collectResearchSession(researchSession) {
  return executeResearchSessionCollections({
    researchSession,
    collectionExecutor: async (request) => collectMultiSource(request.search_seed, {
      researchContext: {
        research_session_id: request.research_session_id,
        research_target_id: request.research_target_id,
        search_seed: request.search_seed,
        source_types: request.source_types,
        source_references: request.source_references,
        reviewer_stages: request.reviewer_stages,
        reason: request.reason,
      },
    }),
  });
}

export async function runInitialDiscoveryForSession({ collectionRequestProjection } = {}) {
  const run = await runInitialDiscovery({
    collectionRequestProjection,
    findExistingCollection: findExistingCollectionForRequest,
    collectionExecutor: async (request) => collectMultiSource(request.search_seed, { researchContext: collectionResearchContext(request) }),
  });
  return saveInitialDiscoveryRun(run);
}

export async function createInitialDiscoveryEvaluationForSession({ researchSessionId, researchPlan = null, initialDiscoveryRun = null } = {}) {
  const run = initialDiscoveryRun || await readInitialDiscoveryRun(researchSessionId);
  if (!run) throw new Error("INITIAL_DISCOVERY_RUN_NOT_FOUND");
  const evaluation = await evaluateInitialDiscovery({ researchPlan, initialDiscoveryRun: run, loadSnapshot: readCollectionSnapshot });
  return saveInitialDiscoveryEvaluation(evaluation);
}

export function getInitialDiscoveryEvaluationForSession(researchSessionId) {
  return readInitialDiscoveryEvaluation(researchSessionId);
}

export async function createFollowUpResearchProjectionForSession({ researchSessionId, researchPlan = null, evaluation = null } = {}) {
  const sourceEvaluation = evaluation || await readInitialDiscoveryEvaluation(researchSessionId);
  if (!sourceEvaluation) throw new Error("INITIAL_DISCOVERY_EVALUATION_NOT_FOUND");
  return saveFollowUpResearchProjection(projectFollowUpResearch({ evaluation: sourceEvaluation, researchPlan }));
}

export function getFollowUpResearchProjectionForSession(researchSessionId) {
  return readFollowUpResearchProjection(researchSessionId);
}

export { RESEARCH_E2E_STATUS, runResearchSessionE2E };

export function getLatestPlannerDecisionBriefFile(researchSessionId) {
  return readLatestPlannerDecisionBriefFile(researchSessionId);
}

export async function getLatestPlannerDecisionBriefMetadata(researchSessionId) {
  const brief = await readLatestPlannerDecisionBriefFile(researchSessionId);
  return brief ? { version: brief.version, file_name: brief.fileName } : null;
}

export async function getLatestCompletedResearchSession() {
  const [latest] = await listCompletedResearchSessions();
  if (!latest) return null;
  const contextArtifact = await readResearchSessionContext(latest.research_session_id);
  const hubContext = contextArtifact?.context?.hub_context || contextArtifact?.hub_context || {};
  return { ...latest, hub_title: hubContext.hub_title || hubContext.hub_topic || hubContext.hub_seed || null };
}

export async function createSessionEvidenceIntegration({ researchSessionId, targetResults, researchContext } = {}) {
  let contextResult = await readResearchSessionContext(researchSessionId);
  if (!contextResult && researchContext) contextResult = (await saveResearchSessionContext({ researchSessionId, context: researchContext })).artifact;
  return createResearchSessionIntegration({ researchSessionId, targetResults, researchContextReference: contextResult ? { context_id: contextResult.context_id, context_version: contextResult.context_version, relative_path: `data/research-sessions/${researchSessionId}/context-v${contextResult.context_version}.json` } : null });
}

export async function saveSessionResearchContext({ researchSessionId, context } = {}) {
  const existing = await readResearchSessionContext(researchSessionId);
  if (existing) return { artifact: existing, relativePath: `data/research-sessions/${researchSessionId}/context-v${existing.context_version}.json`, reused: true };
  return saveResearchSessionContext({ researchSessionId, context });
}

export async function getSessionResearchContext(researchSessionId) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  return readResearchSessionContext(researchSessionId);
}

export function createSessionSearchDemandCompression(integration) {
  return createSearchDemandCompression({ integration });
}

export async function createSessionInterpretedSearchDemandCompression({ compression, integration, researchContext } = {}) {
  const loadedContext = researchContext || (integration?.research_session_id ? (await readResearchSessionContext(integration.research_session_id))?.context : null);
  return createInterpretedSearchDemandCompression({ compression, integration, researchContext: loadedContext });
}

function finalPlannerHandoffSummary({ context, integration, compression, handoff } = {}) {
  const coverage = handoff?.evidence_coverage || compression?.coverage_summary || {};
  const clusters = handoff?.search_demand_findings?.demand_clusters || compression?.demand_clusters || [];
  const entrances = handoff?.search_demand_findings?.representative_entrances || compression?.representative_entrance_candidates || [];
  const questions = handoff?.search_demand_findings?.grounded_questions || compression?.grounded_question_links || [];
  return {
    research_session_id: handoff?.research_session_id || context?.research_session_id || integration?.research_session_id || compression?.research_session_id || null,
    context_version: context?.context_version ?? null,
    integration_version: integration?.integration_version ?? null,
    compression_version: compression?.compression_version ?? null,
    handoff_version: handoff?.handoff_version ?? null,
    status: !handoff ? "NOT_READY" : coverage.overall === "PARTIAL" ? "PARTIAL" : "READY",
    keywords: handoff?.research_summary?.keyword_count ?? compression?.source_integration?.unique_keyword_count ?? integration?.unique_keyword_count ?? null,
    evidence: handoff?.research_summary?.evidence_count ?? compression?.source_integration?.evidence_count ?? integration?.evidence_count ?? null,
    metrics: handoff?.research_summary?.metric_count ?? compression?.source_integration?.metric_count ?? integration?.metric_count ?? null,
    demand_clusters: clusters.length,
    representative_entrances: entrances.length,
    grounded_questions: questions.length,
    review_required_clusters: clusters.filter((cluster) => cluster.status === "REVIEW_REQUIRED").length,
    coverage,
  };
}

export async function getFinalPlannerHandoffState(researchSessionId) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  const [context, integration, compression, handoff] = await Promise.all([
    readResearchSessionContext(researchSessionId),
    readResearchSessionIntegration(researchSessionId),
    readSearchDemandCompression(researchSessionId),
    readFinalPlannerHandoff(researchSessionId),
  ]);
  return { handoff, summary: finalPlannerHandoffSummary({ context, integration, compression, handoff }) };
}

export async function createFinalPlannerHandoffForSession(researchSessionId) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  const [context, integration, compression] = await Promise.all([
    readResearchSessionContext(researchSessionId),
    readResearchSessionIntegration(researchSessionId),
    readSearchDemandCompression(researchSessionId),
  ]);
  if (!context || !integration || !compression) {
    const error = new Error("FINAL_PLANNER_HANDOFF_INPUT_NOT_READY");
    error.code = "FINAL_PLANNER_HANDOFF_INPUT_NOT_READY";
    throw error;
  }
  const result = await createFinalPlannerHandoff({ context, integration, compression });
  return { ...result, summary: finalPlannerHandoffSummary({ context, integration, compression, handoff: result.handoff }) };
}

export function getSearchEvidencePack(collectionId, options = {}) {
  return readSearchEvidencePack(collectionId, options);
}

export async function getReviewSelection(collectionId, options = {}) {
  return { review: await readReviewSelection(collectionId, options), versions: await listReviewVersions(collectionId) };
}

export function validateReviewSelection(pack, reviewerSelection) {
  const candidates = new Map(pack.keywords.map((keyword) => [keyword.keyword_id, keyword]));
  const errors = [];
  if (!Array.isArray(reviewerSelection) || reviewerSelection.length !== candidates.size) return ["REVIEW_SELECTION_MUST_COVER_ALL_CANDIDATES"];
  const seen = new Set();
  for (const item of reviewerSelection) {
    if (!item || !candidates.has(item.keyword_id) || seen.has(item.keyword_id)) errors.push("REVIEW_SELECTION_KEYWORD_REFERENCE_INVALID");
    if (!["SELECTED", "EXCLUDED", "UNDECIDED"].includes(item?.decision)) errors.push("REVIEW_SELECTION_DECISION_INVALID");
    if (item?.reviewer_note != null && typeof item.reviewer_note !== "string") errors.push("REVIEWER_NOTE_INVALID");
    if (item?.keyword_id) seen.add(item.keyword_id);
  }
  if (seen.size !== candidates.size) errors.push("REVIEW_SELECTION_KEYWORD_MISSING");
  return [...new Set(errors)];
}

export async function createReviewSelection({ collectionId, packVersion = 1, reviewerSelection, reviewerId = null } = {}) {
  const pack = await readSearchEvidencePack(collectionId, { packVersion });
  const errors = validateReviewSelection(pack, reviewerSelection);
  if (errors.length) throw new Error(errors.join(","));
  const now = new Date().toISOString();
  return saveReviewSelection({
    review_id: `review_${collectionId}`,
    collection_id: collectionId,
    pack_version: String(pack.metadata.pack_version),
    created_at: now,
    updated_at: now,
    reviewer_id: reviewerId,
    reviewer_selection: reviewerSelection.map((item) => ({ keyword_id: item.keyword_id, decision: item.decision, reviewer_note: item.reviewer_note || "" })),
  });
}

export async function createGeoHandoff({ collectionId, reviewVersion = null, packVersion = 1 } = {}) {
  const [pack, review] = await Promise.all([readSearchEvidencePack(collectionId, { packVersion }), readReviewSelection(collectionId, { reviewVersion })]);
  if (!review) { const error = new Error("REVIEW_NOT_FOUND"); error.code = "REVIEW_NOT_FOUND"; throw error; }
  return saveGeoHandoff(buildGeoHandoffFromReview(pack, review));
}

export async function getGeoHandoff(collectionId, options = {}) {
  return { handoff: await readGeoHandoff(collectionId, options), versions: await listGeoHandoffVersions(collectionId) };
}
