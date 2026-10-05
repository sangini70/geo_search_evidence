import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvironmentValue, getNaverPreflight, getNaverWebPreflight } from "../config/index.mjs";
import { buildResearchPlan } from "../research/research-plan.mjs";
import { generateResearchSeeds } from "../research/research-seed-generator.mjs";
import { projectInitialDiscovery } from "../research/initial-discovery-projection.mjs";
import { projectInitialDiscoveryCollectionRequests } from "../research/initial-discovery-collection-requests.mjs";
import { runInitialDiscovery } from "../research/initial-discovery-runner.mjs";
import { evaluateInitialDiscovery } from "../research/initial-discovery-evaluation.mjs";
import { projectFollowUpResearch } from "../research/follow-up-research-projection.mjs";
import { createResearchSessionIntegration } from "../research/research-session-integration.mjs";
import { buildSearchDemandCompression } from "../research/search-demand-compression.mjs";
import { buildInterpretedSearchDemandCompression } from "../research/search-demand-interpretation.mjs";
import { buildFinalPlannerHandoff } from "../handoff/final-planner-handoff.mjs";
import { buildPlannerConsumerHandoff } from "../handoff/planner-consumer-handoff.mjs";
import { buildPlannerDecisionBrief } from "../handoff/planner-decision-brief.mjs";
import { assertBackupPreflight } from "../repositories/backup-repository.mjs";
import { dataDirectory } from "../repositories/storage-paths.mjs";
import { readCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { readResearchSessionContext, saveResearchSessionContext } from "../repositories/research-session-context-repository.mjs";
import { readResearchPlan, saveResearchPlan } from "../repositories/research-plan-repository.mjs";
import { readInitialDiscoveryProjection, saveInitialDiscoveryProjection } from "../repositories/initial-discovery-repository.mjs";
import { readInitialDiscoveryRun, saveInitialDiscoveryRun } from "../repositories/initial-discovery-run-repository.mjs";
import { readInitialDiscoveryEvaluation, saveInitialDiscoveryEvaluation } from "../repositories/initial-discovery-evaluation-repository.mjs";
import { readFollowUpResearchProjection, saveFollowUpResearchProjection } from "../repositories/follow-up-research-projection-repository.mjs";
import { readResearchSessionIntegration } from "../repositories/research-session-integration-repository.mjs";
import { readSearchDemandCompression, saveSearchDemandCompression } from "../repositories/search-demand-compression-repository.mjs";
import { readFinalPlannerHandoff, saveFinalPlannerHandoff } from "../repositories/final-planner-handoff-repository.mjs";
import { readPlannerConsumerHandoff, savePlannerConsumerHandoff } from "../repositories/planner-consumer-handoff-repository.mjs";
import { readPlannerDecisionBrief, savePlannerDecisionBrief } from "../repositories/planner-decision-brief-repository.mjs";
import { readResearchArtifactInvalidation } from "../repositories/research-artifact-invalidation-repository.mjs";
import { runMultiSourceCollection } from "./multi-source-collection-orchestrator.mjs";

function normalizeSearchSeed(value) { return String(value ?? "").trim().replace(/\s+/gu, " "); }

async function assertOrchestrationEnvironment({ dataRoot = getEnvironmentValue("GEO_DATA_ROOT"), backupRoot = getEnvironmentValue("GEO_BACKUP_ROOT"), searchAdsPreflight = getNaverPreflight("PREFLIGHT_ONLY"), webSearchPreflight = getNaverWebPreflight("PREFLIGHT_ONLY") } = {}) {
  dataRoot = dataRoot?.trim();
  backupRoot = backupRoot?.trim();
  if (!dataRoot) throw new Error("DATA_ROOT_REQUIRED");
  if (!backupRoot) throw new Error("BACKUP_ROOT_REQUIRED");
  const resolvedDataRoot = resolve(dataRoot);
  const workspaceDataRoot = resolve(join(fileURLToPath(new URL("../../", import.meta.url)), "data"));
  if (resolvedDataRoot === workspaceDataRoot) throw new Error("DATA_ROOT_WORKSPACE_FALLBACK_FORBIDDEN");
  const details = await stat(resolvedDataRoot).catch((error) => { throw new Error(error.code === "ENOENT" ? "DATA_ROOT_NOT_FOUND" : "DATA_ROOT_NOT_USABLE"); });
  if (!details.isDirectory()) throw new Error("DATA_ROOT_NOT_DIRECTORY");
  await assertBackupPreflight();
  if (!searchAdsPreflight.credentialsConfigured || !webSearchPreflight.credentialsConfigured) throw new Error("API_CONFIGURATION_REQUIRED");
  return { data_root: resolvedDataRoot, backup_root: resolve(backupRoot) };
}

async function findExistingCollection(request) {
  const root = dataDirectory("snapshots");
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
  for (const entry of entries.filter((item) => item.isDirectory())) {
    try {
      const snapshot = JSON.parse(await readFile(join(root, entry.name, "v1.json"), "utf8"));
      const context = snapshot.research_context;
      if (context?.research_session_id !== request.research_session_id) continue;
      if (normalizeSearchSeed(context.search_seed || snapshot.seed_keyword) !== request.normalized_search_seed) continue;
      return { collection_id: snapshot.collection_id, collection_status: snapshot.status, snapshot };
    } catch { /* Ignore malformed or incomplete snapshot candidates. */ }
  }
  return null;
}

function collectionContext(request) {
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

function contextReference(contextArtifact) {
  return contextArtifact ? {
    context_id: contextArtifact.context_id,
    context_version: contextArtifact.context_version,
    relative_path: `data/research-sessions/${contextArtifact.research_session_id}/context-v${contextArtifact.context_version}.json`,
  } : null;
}

function artifactRelativePath(researchSessionId, filePrefix, version) {
  return `data/research-sessions/${researchSessionId}/${filePrefix}-v${version}.json`;
}

function hasCanonicalContext(context) {
  return ["hub_context", "planner_hypothesis", "reviewer_research_direction"]
    .some((field) => Object.keys(context?.[field] || {}).length > 0);
}

const ARTIFACT_VERSION_FIELDS = Object.freeze({
  research_plan: "plan_version",
  initial_discovery: "projection_version",
  initial_discovery_run: "run_version",
  evaluation: "evaluation_version",
  follow_up: "projection_version",
  integration: "integration_version",
  compression: "compression_version",
  full_planner_handoff: "handoff_version",
  planner_consumer_handoff: "consumer_handoff_version",
  planner_decision_brief: "decision_brief_version",
});

function isInvalidatedArtifact(artifact, artifactType, invalidation) {
  const versionField = ARTIFACT_VERSION_FIELDS[artifactType];
  const version = versionField ? Number(artifact?.[versionField]) : NaN;
  return Number.isInteger(version) && invalidation?.invalidated_artifacts?.some((item) => item.artifact_type === artifactType && Number(item.version) === version);
}

function stageRecord(name, artifact, reused = false) {
  return { stage: name, status: "COMPLETED", reused, artifact_id: artifact?.research_session_id || artifact?.run_id || artifact?.evaluation_id || artifact?.follow_up_projection_id || artifact?.integration_id || artifact?.compression_id || artifact?.handoff_id || artifact?.consumer_handoff_id || artifact?.decision_brief_id || null };
}

function finalStatus(artifacts) {
  const initialRun = artifacts.initial_discovery_run;
  if (initialRun?.status === "PARTIAL_SUCCESS" || initialRun?.status === "FAILED" || initialRun?.status === "REVIEW_REQUIRED") return "PARTIAL";
  return artifacts.planner_decision_brief ? "COMPLETED" : "PARTIAL";
}

export const RESEARCH_E2E_STATUS = Object.freeze({ READY: "READY", RUNNING: "RUNNING", COMPLETED: "COMPLETED", PARTIAL: "PARTIAL", FAILED: "FAILED" });

export async function runResearchSessionE2E({
  researchSessionId,
  hubContext = {},
  plannerHypothesis = {},
  reviewerResearchDirection = {},
  collectionExecutor = null,
  environment = {},
  now = new Date().toISOString(),
} = {}) {
  const stages = [];
  const artifacts = {};
  const stateHistory = [RESEARCH_E2E_STATUS.READY];
  let currentStage = "ENVIRONMENT_PREFLIGHT";
  let lastSuccessfulArtifact = null;
  try {
    if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
    const environmentDetails = await assertOrchestrationEnvironment(environment);
    stateHistory.push(RESEARCH_E2E_STATUS.RUNNING);
    const contextInput = { hub_context: { ...hubContext }, planner_hypothesis: { ...plannerHypothesis }, reviewer_research_direction: { ...reviewerResearchDirection }, reviewer_direction: { ...reviewerResearchDirection } };

    currentStage = "RESEARCH_CONTEXT";
    let contextArtifact = await readResearchSessionContext(researchSessionId);
    let reused = Boolean(contextArtifact);
    if (!contextArtifact) contextArtifact = (await saveResearchSessionContext({ researchSessionId, context: contextInput, now })).artifact;
    artifacts.context = contextArtifact;
    stages.push(stageRecord(currentStage, contextArtifact, reused)); lastSuccessfulArtifact = "context";
    const artifactInvalidation = await readResearchArtifactInvalidation(researchSessionId);
    artifacts.artifact_invalidation = artifactInvalidation;

    currentStage = "RESEARCH_PLAN";
    const planningContext = contextArtifact && !hasCanonicalContext(contextInput)
      ? contextArtifact.context
      : contextInput;
    let researchPlan = await readResearchPlan(researchSessionId);
    if (isInvalidatedArtifact(researchPlan, "research_plan", artifactInvalidation)) researchPlan = null;
    reused = Boolean(researchPlan);
    if (!researchPlan) researchPlan = (await saveResearchPlan(buildResearchPlan({ researchSessionId, context: planningContext, researchSeeds: generateResearchSeeds(planningContext), now }))).plan;
    artifacts.research_plan = researchPlan;
    stages.push(stageRecord(currentStage, researchPlan, reused)); lastSuccessfulArtifact = "research_plan";

    currentStage = "INITIAL_DISCOVERY_PROJECTION";
    let initialDiscovery = await readInitialDiscoveryProjection(researchSessionId);
    if (isInvalidatedArtifact(initialDiscovery, "initial_discovery", artifactInvalidation)) initialDiscovery = null;
    reused = Boolean(initialDiscovery);
    if (!initialDiscovery) initialDiscovery = (await saveInitialDiscoveryProjection(projectInitialDiscovery({ researchPlan, researchPlanVersion: researchPlan.plan_version || null, now }))).projection;
    artifacts.initial_discovery = initialDiscovery;
    stages.push(stageRecord(currentStage, initialDiscovery, reused)); lastSuccessfulArtifact = "initial_discovery";

    currentStage = "INITIAL_DISCOVERY_COLLECTION_REQUESTS";
    const collectionRequestProjection = projectInitialDiscoveryCollectionRequests({ initialDiscovery });
    artifacts.collection_request_projection = collectionRequestProjection;
    stages.push(stageRecord(currentStage, collectionRequestProjection, true)); lastSuccessfulArtifact = "collection_request_projection";

    currentStage = "INITIAL_DISCOVERY_RUN";
    let initialDiscoveryRun = await readInitialDiscoveryRun(researchSessionId);
    if (isInvalidatedArtifact(initialDiscoveryRun, "initial_discovery_run", artifactInvalidation)) initialDiscoveryRun = null;
    reused = Boolean(initialDiscoveryRun);
    if (!initialDiscoveryRun) {
      const executor = collectionExecutor || ((request) => runMultiSourceCollection(request.search_seed, { researchContext: collectionContext(request) }));
      initialDiscoveryRun = (await saveInitialDiscoveryRun(await runInitialDiscovery({ collectionRequestProjection, findExistingCollection, collectionExecutor: executor, now }))).run;
    }
    artifacts.initial_discovery_run = initialDiscoveryRun;
    stages.push(stageRecord(currentStage, initialDiscoveryRun, reused)); lastSuccessfulArtifact = "initial_discovery_run";

    currentStage = "INITIAL_DISCOVERY_EVALUATION";
    let evaluation = await readInitialDiscoveryEvaluation(researchSessionId);
    if (isInvalidatedArtifact(evaluation, "evaluation", artifactInvalidation)) evaluation = null;
    reused = Boolean(evaluation);
    if (!evaluation) evaluation = (await saveInitialDiscoveryEvaluation(await evaluateInitialDiscovery({ researchPlan, initialDiscoveryRun, loadSnapshot: readCollectionSnapshot, now }))).evaluation;
    artifacts.evaluation = evaluation;
    stages.push(stageRecord(currentStage, evaluation, reused)); lastSuccessfulArtifact = "evaluation";

    currentStage = "FOLLOW_UP_PROJECTION";
    let followUp = await readFollowUpResearchProjection(researchSessionId);
    if (isInvalidatedArtifact(followUp, "follow_up", artifactInvalidation)) followUp = null;
    reused = Boolean(followUp);
    if (!followUp) followUp = (await saveFollowUpResearchProjection(projectFollowUpResearch({ evaluation, researchPlan, now }))).projection;
    artifacts.follow_up = followUp;
    stages.push(stageRecord(currentStage, followUp, reused)); lastSuccessfulArtifact = "follow_up";

    currentStage = "SESSION_INTEGRATION";
    let integration = await readResearchSessionIntegration(researchSessionId);
    if (isInvalidatedArtifact(integration, "integration", artifactInvalidation)) integration = null;
    reused = Boolean(integration);
    if (!integration) integration = (await createResearchSessionIntegration({ researchSessionId, targetResults: initialDiscoveryRun.request_results, researchContextReference: contextReference(contextArtifact), now })).integration;
    artifacts.integration = integration;
    stages.push(stageRecord(currentStage, integration, reused)); lastSuccessfulArtifact = "integration";

    currentStage = "SEARCH_DEMAND_COMPRESSION";
    let compression = await readSearchDemandCompression(researchSessionId);
    if (isInvalidatedArtifact(compression, "compression", artifactInvalidation)) compression = null;
    let sourceCompression = compression?.interpreted_relationships ? null : compression;
    reused = Boolean(compression);
    if (!compression) compression = (await saveSearchDemandCompression(await buildSearchDemandCompression({ integration, now }))).compression;
    sourceCompression ||= compression;
    artifacts.compression = compression;
    stages.push(stageRecord(currentStage, compression, reused)); lastSuccessfulArtifact = "compression";

    currentStage = "EVIDENCE_SYNTHESIS";
    if (!compression.interpreted_relationships) {
      compression = (await saveSearchDemandCompression(buildInterpretedSearchDemandCompression({ compression, integration, researchContext: contextArtifact.context, now }))).compression;
      artifacts.compression = compression;
      reused = false;
    } else reused = true;
    stages.push(stageRecord(currentStage, compression, reused)); lastSuccessfulArtifact = "compression";

    currentStage = "FULL_PLANNER_HANDOFF";
    let fullHandoff = await readFinalPlannerHandoff(researchSessionId);
    if (isInvalidatedArtifact(fullHandoff, "full_planner_handoff", artifactInvalidation)) fullHandoff = null;
    let fullHandoffPath = fullHandoff ? artifactRelativePath(researchSessionId, "final-planner-handoff", fullHandoff.handoff_version) : null;
    reused = Boolean(fullHandoff);
    if (!fullHandoff) {
      const saved = await saveFinalPlannerHandoff(buildFinalPlannerHandoff({ context: contextArtifact, integration, compression, sourceCompression, now }));
      fullHandoff = saved.handoff;
      fullHandoffPath = saved.relativePath;
    }
    artifacts.full_planner_handoff = fullHandoff;
    stages.push(stageRecord(currentStage, fullHandoff, reused)); lastSuccessfulArtifact = "full_planner_handoff";

    currentStage = "PLANNER_CONSUMER_HANDOFF";
    let consumerHandoff = await readPlannerConsumerHandoff(researchSessionId);
    if (isInvalidatedArtifact(consumerHandoff, "planner_consumer_handoff", artifactInvalidation)) consumerHandoff = null;
    let consumerHandoffPath = consumerHandoff ? artifactRelativePath(researchSessionId, "planner-consumer-handoff", consumerHandoff.consumer_handoff_version) : null;
    reused = Boolean(consumerHandoff);
    if (!consumerHandoff) {
      const saved = await savePlannerConsumerHandoff(buildPlannerConsumerHandoff({ fullHandoff, fullHandoffPath, now }));
      consumerHandoff = saved.handoff;
      consumerHandoffPath = saved.relativePath;
    }
    artifacts.planner_consumer_handoff = consumerHandoff;
    stages.push(stageRecord(currentStage, consumerHandoff, reused)); lastSuccessfulArtifact = "planner_consumer_handoff";

    currentStage = "PLANNER_DECISION_BRIEF";
    let decisionBrief = await readPlannerDecisionBrief(researchSessionId);
    if (isInvalidatedArtifact(decisionBrief, "planner_decision_brief", artifactInvalidation)) decisionBrief = null;
    reused = Boolean(decisionBrief);
    if (!decisionBrief) decisionBrief = (await savePlannerDecisionBrief(buildPlannerDecisionBrief({ consumerHandoff, consumerHandoffPath, now }))).brief;
    artifacts.planner_decision_brief = decisionBrief;
    stages.push(stageRecord(currentStage, decisionBrief, reused)); lastSuccessfulArtifact = "planner_decision_brief";

    const status = finalStatus(artifacts);
    stateHistory.push(status);
    return { status, state_history: stateHistory, research_session_id: researchSessionId, environment: environmentDetails, stages, artifacts, failed_stage: null, last_successful_artifact: lastSuccessfulArtifact };
  } catch (error) {
    const status = lastSuccessfulArtifact ? RESEARCH_E2E_STATUS.PARTIAL : RESEARCH_E2E_STATUS.FAILED;
    stateHistory.push(status);
    return { status, state_history: stateHistory, research_session_id: researchSessionId || null, stages, artifacts, failed_stage: currentStage, last_successful_artifact: lastSuccessfulArtifact, error: error?.message || "RESEARCH_E2E_FAILED" };
  }
}
