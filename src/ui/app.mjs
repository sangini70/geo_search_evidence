import { createReviewRows, filterReviewRows, sortReviewRows } from "./review-model.mjs";
import { generateResearchSeeds, updateResearchSeedStatus } from "../research/research-seed-generator.mjs";
import { buildCollectionTargets } from "../research/research-collection-targets.mjs";
import { createResearchSession, projectCollectionRequests, projectConfirmedCollectionRequests } from "../research/research-session.mjs";
import { executeSingleResearchTargetCollection } from "../research/research-target-collection-adapter.mjs";
import { buildResearchPlan } from "../research/research-plan.mjs";
import { projectInitialDiscovery } from "../research/initial-discovery-projection.mjs";
import { projectInitialDiscoveryCollectionRequests } from "../research/initial-discovery-collection-requests.mjs";

const $ = (selector) => document.querySelector(selector);
const status = $("#status");
const seed = $("#seed");
const rawStatus = $("#raw-status");
const collectButton = $("#collect");
const packId = $("#pack-id");
const loadPackButton = $("#load-pack");
const review = $("#review");
const reviewMessage = $("#review-message");
const tableBody = $("#review-body");
const searchInput = $("#keyword-search");
const roleFilter = $("#role-filter");
const totalFilter = $("#total-filter");
const competitionFilter = $("#competition-filter");
const webFilter = $("#web-filter");
const sortField = $("#sort-field");
const sortDirection = $("#sort-direction");
const resultCount = $("#result-count");
const reviewVersion = $("#review-version");
const reviewVersionSelect = $("#review-version-select");
const saveReviewButton = $("#save-review");
const loadReviewButton = $("#load-review");
const createHandoffButton = $("#create-handoff");
const reviewSaveStatus = $("#review-save-status");
const hubSeedInput = $("#hub-seed");
const hubStoryInput = $("#hub-story");
const storyDirectionInput = $("#story-direction");
const plannerHypothesisInput = $("#planner-hypothesis");
const reviewerDirectionInput = $("#reviewer-direction");
const confirmHubContextButton = $("#confirm-hub-context");
const confirmPlannerHypothesisButton = $("#confirm-planner-hypothesis");
const confirmReviewerDirectionButton = $("#confirm-reviewer-direction");
const step1Status = $("#step-1-status");
const step2Status = $("#step-2-status");
const step3Status = $("#step-3-status");
const researchReady = $("#research-ready");
const researchSeedsPanel = $("#research-seeds-panel");
const generateResearchSeedsButton = $("#generate-research-seeds");
const researchSeedsMessage = $("#research-seeds-message");
const researchSeedsStatus = $("#research-seeds-status");
const researchSeedsBody = $("#research-seeds-body");
const researchSeedsReady = $("#research-seeds-ready");
const researchContextSaveStatus = $("#research-context-save-status");
const initialDiscoveryPanel = $("#initial-discovery-panel");
const initialDiscoveryStatus = $("#initial-discovery-status");
const initialDiscoverySelectedCount = $("#initial-discovery-selected-count");
const initialDiscoveryDeferredCount = $("#initial-discovery-deferred-count");
const initialDiscoveryRequestCount = $("#initial-discovery-request-count");
const initialDiscoveryRequestsBody = $("#initial-discovery-requests-body");
const runInitialDiscoveryButton = $("#run-initial-discovery");
const initialDiscoveryRunMessage = $("#initial-discovery-run-message");
const initialDiscoveryRunSummary = $("#initial-discovery-run-summary");
const initialDiscoveryRunResult = $("#initial-discovery-run-result");
const initialDiscoveryRunBody = $("#initial-discovery-run-body");
const evaluateInitialDiscoveryButton = $("#evaluate-initial-discovery");
const initialDiscoveryEvaluationMessage = $("#initial-discovery-evaluation-message");
const initialDiscoveryEvaluationSummary = $("#initial-discovery-evaluation-summary");
const initialDiscoveryEvaluationResult = $("#initial-discovery-evaluation-result");
const initialDiscoveryEvaluationBody = $("#initial-discovery-evaluation-body");
const projectFollowUpResearchButton = $("#project-follow-up-research");
const followUpProjectionMessage = $("#follow-up-projection-message");
const followUpProjectionSummary = $("#follow-up-projection-summary");
const followUpProjectionResult = $("#follow-up-projection-result");
const followUpProjectionBody = $("#follow-up-projection-body");
const confirmAllResearchSeedsButton = $("#confirm-all-research-seeds");
const resetAllResearchSeedsButton = $("#reset-all-research-seeds");
const collectionTargetsPanel = $("#collection-targets-panel");
const collectionTargetsStatus = $("#collection-targets-status");
const collectionTargetsCount = $("#collection-targets-count");
const collectionTargetsBody = $("#collection-targets-body");
const researchSessionId = $("#research-session-id");
const collectionTargetExecutionButton = $("#collection-target-execution");
const collectionTargetExecutionMessage = $("#collection-target-execution-message");
const collectionTargetExecutionResult = $("#collection-target-execution-result");
const collectionTargetResultDetails = $("#collection-target-result-details");
const collectionResultSearchSeed = $("#collection-result-search-seed");
const collectionResultSearchAds = $("#collection-result-search-ads");
const collectionResultWeb = $("#collection-result-web");
const collectionResultCandidates = $("#collection-result-candidates");
const collectionResultEvidence = $("#collection-result-evidence");
const collectionResultMetrics = $("#collection-result-metrics");
const multiCollectionButton = $("#multi-collection-execution");
const multiCollectionResult = $("#multi-collection-result");
const multiCollectionSummary = $("#multi-collection-summary");
const multiCollectionBody = $("#multi-collection-body");
const integrationButton = $("#session-integration-execution");
const integrationStatus = $("#session-integration-status");
const integrationSummary = $("#session-integration-summary");
const compressionButton = $("#session-compression-execution");
const compressionStatus = $("#session-compression-status");
const compressionSummary = $("#session-compression-summary");
const interpretationButton = $("#session-interpretation-execution");
const interpretationStatus = $("#session-interpretation-status");
const interpretationSummary = $("#session-interpretation-summary");
const finalPlannerHandoffPanel = $("#final-planner-handoff-panel");
const finalPlannerHandoffStatus = $("#final-planner-handoff-status");
const finalHandoffSession = $("#final-handoff-session");
const finalHandoffContext = $("#final-handoff-context");
const finalHandoffIntegration = $("#final-handoff-integration");
const finalHandoffCompression = $("#final-handoff-compression");
const finalHandoffVersion = $("#final-handoff-version");
const finalHandoffKeywords = $("#final-handoff-keywords");
const finalHandoffEvidence = $("#final-handoff-evidence");
const finalHandoffMetrics = $("#final-handoff-metrics");
const finalHandoffClusters = $("#final-handoff-clusters");
const finalHandoffEntrances = $("#final-handoff-entrances");
const finalHandoffQuestions = $("#final-handoff-questions");
const finalHandoffReviewRequired = $("#final-handoff-review-required");
const finalHandoffCoverage = $("#final-handoff-coverage");
const createFinalPlannerHandoffButton = $("#create-final-planner-handoff");
const loadFinalPlannerHandoffButton = $("#load-final-planner-handoff");
const finalHandoffMessage = $("#final-handoff-message");
const plannerDecisionBriefPanel = $("#planner-decision-brief-panel");
const plannerDecisionBriefStatus = $("#planner-decision-brief-status");
const plannerDecisionBriefFilename = $("#planner-decision-brief-filename");
const downloadPlannerDecisionBriefButton = $("#download-planner-decision-brief");
const plannerDecisionBriefMessage = $("#planner-decision-brief-message");
const recentCompletedResearchStatus = $("#recent-completed-research-status");
const recentCompletedResearchMessage = $("#recent-completed-research-message");
const recentCompletedResearchDetails = $("#recent-completed-research-details");
const recentCompletedResearchTitle = $("#recent-completed-research-title");
const recentCompletedResearchSession = $("#recent-completed-research-session");
const recentCompletedResearchFile = $("#recent-completed-research-file");
const openRecentCompletedResearchButton = $("#open-recent-completed-research");
const downloadRecentCompletedBriefButton = $("#download-recent-completed-brief");
let sessionCompressionData = null;
let recentCompletedResearch = null;
let currentRows = [];
let decisions = new Map();
let notes = new Map();
let currentPackVersion = 1;
const researchInput = {
  hub_context: { hub_seed: "", hub_story: "", story_direction: "", confirmed: false },
  planner_hypothesis: { raw_text: "", confirmed: false },
  reviewer_research_direction: { raw_text: "", confirmed: false },
};
let researchSeeds = [];
let researchSeedsStale = false;
let collectionTargets = { status: "NOT_READY", count: 0, targets: [] };
let researchSession = null;
let collectionRequests = { status: "NOT_READY", count: 0, requests: [] };
let researchPlan = null;
let initialDiscoveryProjection = null;
let collectionRequestProjection = null;
let initialDiscoveryRun = null;
let initialDiscoveryEvaluation = null;
let followUpProjection = null;
let selectedCollectionTargetId = null;
let collectionTargetExecution = null;
let multiCollectionExecution = false;
let multiCollectionData = null;
let sessionIntegrationData = null;
const initialResearchSessionId = new URLSearchParams(location.search).get("researchSessionId");
if (/^research_session_[A-Za-z0-9_-]+$/.test(initialResearchSessionId || "")) researchSession = { research_session_id: initialResearchSessionId };

function hasText(value) { return Boolean(value.trim()); }
function renderRecentCompletedResearch(session = null) {
  recentCompletedResearch = session;
  const ready = Boolean(session?.research_session_id && session?.file_name);
  recentCompletedResearchStatus.textContent = ready ? "READY" : "NOT_READY";
  recentCompletedResearchDetails.hidden = !ready;
  recentCompletedResearchTitle.textContent = ready ? (session.hub_title || "NOT_AVAILABLE") : "NOT_AVAILABLE";
  recentCompletedResearchSession.textContent = ready ? session.research_session_id : "NOT_AVAILABLE";
  recentCompletedResearchFile.textContent = ready ? session.file_name : "NOT_AVAILABLE";
  recentCompletedResearchMessage.textContent = ready ? "기존 완료 결과를 조회할 수 있습니다." : "아직 완료된 Research Session이 없습니다.";
  openRecentCompletedResearchButton.disabled = !ready;
  downloadRecentCompletedBriefButton.disabled = !ready;
}
async function loadRecentCompletedResearch() {
  const response = await fetch("/research-sessions/recent-completed");
  if (response.status === 404) { renderRecentCompletedResearch(); return; }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "RECENT_RESEARCH_SESSION_READ_FAILED");
  renderRecentCompletedResearch(result);
}
function invalidateResearchFrom(step) {
  if (step <= 1) {
    researchInput.hub_context.confirmed = false;
    researchInput.planner_hypothesis.confirmed = false;
    researchInput.reviewer_research_direction.confirmed = false;
  } else if (step === 2) {
    researchInput.planner_hypothesis.confirmed = false;
    researchInput.reviewer_research_direction.confirmed = false;
  } else {
    researchInput.reviewer_research_direction.confirmed = false;
  }
  if (researchSeeds.length > 0) researchSeedsStale = true;
  if (researchSeedsStale) {
    collectionTargets = { status: "NOT_READY", count: 0, targets: [] };
    researchPlan = null;
    initialDiscoveryProjection = null;
    collectionRequestProjection = null;
    initialDiscoveryRun = null;
    initialDiscoveryEvaluation = null;
    followUpProjection = null;
  }
  renderResearchInputState();
  renderCollectionTargets();
}
function renderResearchInputState() {
  step1Status.textContent = researchInput.hub_context.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  step2Status.textContent = researchInput.planner_hypothesis.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  step3Status.textContent = researchInput.reviewer_research_direction.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  confirmPlannerHypothesisButton.disabled = !researchInput.hub_context.confirmed;
  confirmReviewerDirectionButton.disabled = !researchInput.planner_hypothesis.confirmed;
  const contextConfirmed = researchInput.hub_context.confirmed && researchInput.planner_hypothesis.confirmed && researchInput.reviewer_research_direction.confirmed;
  researchReady.hidden = !contextConfirmed;
  researchSeedsPanel.hidden = !contextConfirmed;
  generateResearchSeedsButton.disabled = !contextConfirmed;
  if (researchSeedsStale) {
    researchSeedsStatus.textContent = "재생성 필요";
    researchSeedsMessage.textContent = "Research Context가 변경되었습니다. Research Seed를 다시 생성하세요.";
    researchSeedsReady.hidden = true;
  }
  renderInitialDiscoveryProjection();
}
function bindResearchInput(input, update, invalidationStep) {
  input.addEventListener("input", () => { update(input.value); invalidateResearchFrom(invalidationStep); });
}
bindResearchInput(hubSeedInput, (value) => { researchInput.hub_context.hub_seed = value; }, 1);
bindResearchInput(hubStoryInput, (value) => { researchInput.hub_context.hub_story = value; }, 1);
bindResearchInput(storyDirectionInput, (value) => { researchInput.hub_context.story_direction = value; }, 1);
bindResearchInput(plannerHypothesisInput, (value) => { researchInput.planner_hypothesis.raw_text = value; }, 2);
bindResearchInput(reviewerDirectionInput, (value) => { researchInput.reviewer_research_direction.raw_text = value; }, 3);
function syncResearchInputFromDom() {
  researchInput.hub_context.hub_seed = hubSeedInput.value;
  researchInput.hub_context.hub_story = hubStoryInput.value;
  researchInput.hub_context.story_direction = storyDirectionInput.value;
  researchInput.planner_hypothesis.raw_text = plannerHypothesisInput.value;
  researchInput.reviewer_research_direction.raw_text = reviewerDirectionInput.value;
}
confirmHubContextButton.addEventListener("click", () => {
  if (![researchInput.hub_context.hub_seed, researchInput.hub_context.hub_story, researchInput.hub_context.story_direction].every(hasText)) {
    step1Status.textContent = "입력 필요";
    return;
  }
  researchInput.hub_context.confirmed = true;
  renderResearchInputState();
});
confirmPlannerHypothesisButton.addEventListener("click", () => {
  if (!hasText(researchInput.planner_hypothesis.raw_text)) { step2Status.textContent = "입력 필요"; return; }
  researchInput.planner_hypothesis.confirmed = true;
  renderResearchInputState();
});
confirmReviewerDirectionButton.addEventListener("click", () => {
  if (!hasText(researchInput.reviewer_research_direction.raw_text)) { step3Status.textContent = "입력 필요"; return; }
  researchInput.reviewer_research_direction.confirmed = true;
  renderResearchInputState();
});
function renderResearchSeedCounts() {
  const counts = { PROPOSED: 0, CONFIRMED: 0, EXCLUDED: 0 };
  for (const seed of researchSeeds) counts[seed.status] += 1;
  $("#seed-proposed-count").textContent = counts.PROPOSED;
  $("#seed-confirmed-count").textContent = counts.CONFIRMED;
  $("#seed-excluded-count").textContent = counts.EXCLUDED;
  researchSeedsReady.hidden = researchSeeds.length === 0 || researchSeedsStale || counts.CONFIRMED === 0;
  researchSeedsReady.textContent = `Research Seeds 검토 완료\nCONFIRMED ${counts.CONFIRMED}개`;
}
function sourceLabel(sourceType) {
  return { HUB_CONTEXT: "Hub", PLANNER_HYPOTHESIS: "Planner", REVIEWER_RESEARCH_DIRECTION: "Reviewer" }[sourceType] || sourceType;
}
function stageLabel(stages = []) {
  return (stages || []).map((stage) => `Stage ${stage}`).join(", ");
}
function sourceRunStatus(sourceRuns = [], matcher) {
  const sourceRun = sourceRuns.find((run) => matcher(String(run.source_id || "").toUpperCase()));
  return sourceRun?.status || "NOT_AVAILABLE";
}
function renderInitialDiscoveryProjection() {
  initialDiscoveryPanel.hidden = !initialDiscoveryProjection;
  if (!initialDiscoveryProjection) {
    initialDiscoveryStatus.textContent = "NOT_READY";
    initialDiscoverySelectedCount.textContent = "0";
    initialDiscoveryDeferredCount.textContent = "0";
    initialDiscoveryRequestCount.textContent = "0";
    initialDiscoveryRequestsBody.replaceChildren();
    runInitialDiscoveryButton.disabled = true;
    initialDiscoveryRunMessage.textContent = "";
    initialDiscoveryRunSummary.textContent = "";
    initialDiscoveryRunResult.hidden = true;
    initialDiscoveryRunBody.replaceChildren();
    evaluateInitialDiscoveryButton.disabled = true;
    initialDiscoveryEvaluationMessage.textContent = "";
    initialDiscoveryEvaluationSummary.textContent = "";
    initialDiscoveryEvaluationResult.hidden = true;
    initialDiscoveryEvaluationBody.replaceChildren();
    projectFollowUpResearchButton.disabled = true;
    followUpProjectionMessage.textContent = "";
    followUpProjectionSummary.textContent = "";
    followUpProjectionResult.hidden = true;
    followUpProjectionBody.replaceChildren();
    return;
  }
  initialDiscoveryStatus.textContent = initialDiscoveryProjection.status;
  initialDiscoverySelectedCount.textContent = initialDiscoveryProjection.selected_items.length;
  initialDiscoveryDeferredCount.textContent = initialDiscoveryProjection.deferred_items.length;
  initialDiscoveryRequestCount.textContent = collectionRequestProjection?.request_count || 0;
  initialDiscoveryRequestsBody.replaceChildren();
  for (const request of collectionRequestProjection?.requests || []) {
    const row = document.createElement("tr");
    for (const value of [request.search_seed, request.evidence_to_collect.join(", "), request.selection_reason.join(", "), stageLabel(request.reviewer_stages), request.status]) {
      const cell = document.createElement("td");
      cell.textContent = value || "";
      row.append(cell);
    }
    initialDiscoveryRequestsBody.append(row);
  }
  runInitialDiscoveryButton.disabled = !collectionRequestProjection?.request_count || Boolean(initialDiscoveryRun);
  initialDiscoveryRunResult.hidden = !initialDiscoveryRun;
  initialDiscoveryRunBody.replaceChildren();
  if (!initialDiscoveryRun) {
    initialDiscoveryRunSummary.textContent = "";
    return;
  }
  const run = initialDiscoveryRun.run || initialDiscoveryRun;
  const counts = { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILED: 0, REUSED: 0, REVIEW_REQUIRED: 0 };
  for (const result of run.request_results || []) counts[result.request_status] = (counts[result.request_status] || 0) + 1;
  initialDiscoveryRunMessage.textContent = `Initial Discovery 실행 완료 · Run: ${run.run_id}`;
  initialDiscoveryRunSummary.textContent = `Status: ${run.status} · SUCCESS ${counts.SUCCESS} · PARTIAL_SUCCESS ${counts.PARTIAL_SUCCESS} · FAILED ${counts.FAILED} · REUSED ${counts.REUSED} · REVIEW_REQUIRED ${counts.REVIEW_REQUIRED}`;
  for (const result of run.request_results || []) {
    const row = document.createElement("tr");
    const sourceRuns = result.source_runs || result.snapshot?.source_runs || [];
    const searchAdsStatus = sourceRunStatus(sourceRuns, (sourceId) => sourceId.includes("SEARCH_ADS"));
    const webStatus = sourceRunStatus(sourceRuns, (sourceId) => sourceId.includes("WEB"));
    for (const value of [result.search_seed, result.request_status, result.collection_id || "NOT_CREATED", searchAdsStatus, webStatus]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    initialDiscoveryRunBody.append(row);
  }
  evaluateInitialDiscoveryButton.disabled = !initialDiscoveryRun || Boolean(initialDiscoveryEvaluation);
  initialDiscoveryEvaluationResult.hidden = !initialDiscoveryEvaluation;
  initialDiscoveryEvaluationBody.replaceChildren();
  if (initialDiscoveryEvaluation) {
    const evaluation = initialDiscoveryEvaluation.evaluation || initialDiscoveryEvaluation;
    const summary = evaluation.summary;
    initialDiscoveryEvaluationMessage.textContent = `Evaluation 완료 · ${evaluation.evaluation_id}`;
    initialDiscoveryEvaluationSummary.textContent = `SATISFIED ${summary.satisfied} · PARTIALLY_SATISFIED ${summary.partially_satisfied} · FOLLOW_UP_REQUIRED ${summary.follow_up_required} · REVIEW_REQUIRED ${summary.review_required}`;
    for (const item of evaluation.plan_item_evaluations || []) {
      const row = document.createElement("tr");
      const coverage = item.evidence_evaluation.map((entry) => `${entry.evidence_type}: ${entry.availability_status}`).join(", ");
      const collection = item.collection.collection_id ? `${item.collection.collection_id} (${item.collection.collection_status})` : "NOT_AVAILABLE";
      for (const value of [item.search_seed, item.purpose, collection, coverage, item.evaluation_status]) {
        const cell = document.createElement("td");
        cell.textContent = value || "";
        row.append(cell);
      }
      initialDiscoveryEvaluationBody.append(row);
    }
  }
  projectFollowUpResearchButton.disabled = !initialDiscoveryEvaluation || Boolean(followUpProjection);
  followUpProjectionResult.hidden = !followUpProjection;
  followUpProjectionBody.replaceChildren();
  if (followUpProjection) {
    const projection = followUpProjection.projection || followUpProjection;
    const summary = projection.summary;
    followUpProjectionMessage.textContent = `Follow-up Projection 완료 · ${projection.follow_up_projection_id}`;
    followUpProjectionSummary.textContent = `NO_FOLLOW_UP ${summary.no_follow_up} · FOLLOW_UP_CANDIDATE ${summary.follow_up_candidate} · REVIEW_REQUIRED ${summary.review_required}`;
    for (const item of projection.items || []) {
      const row = document.createElement("tr");
      for (const value of [item.search_seed, item.initial_evaluation_status, item.projection_status, item.projection_reasons.join(", "), stageLabel(item.reviewer_stages)]) {
        const cell = document.createElement("td");
        cell.textContent = value || "";
        row.append(cell);
      }
      followUpProjectionBody.append(row);
    }
  }
}
function renderCollectionTargets() {
  collectionTargetsPanel.hidden = researchSeeds.length === 0 || researchSeedsStale;
  collectionTargetsStatus.textContent = collectionRequests.status;
  collectionTargetsCount.textContent = collectionRequests.count;
  researchSessionId.textContent = researchSession?.research_session_id || "NOT_CREATED";
  if (!collectionRequests.requests.some((request) => request.research_target_id === selectedCollectionTargetId)) selectedCollectionTargetId = null;
  collectionTargetExecutionButton.disabled = !selectedCollectionTargetId || Boolean(collectionTargetExecution);
  const confirmedRequests = researchSession ? projectConfirmedCollectionRequests(researchSession) : { count: 0 };
  multiCollectionButton.disabled = confirmedRequests.count === 0 || multiCollectionExecution || Boolean(collectionTargetExecution);
  researchSeedsReady.hidden = researchSeeds.length === 0 || researchSeedsStale;
  researchSeedsReady.textContent = `Research Targets 자동 준비 완료\nREADY ${collectionRequests.count}개`;
  collectionTargetsBody.replaceChildren();
  for (const request of collectionRequests.requests) {
    const row = document.createElement("tr");
    const selectCell = document.createElement("td");
    const selectInput = document.createElement("input");
    selectInput.type = "radio";
    selectInput.name = "collection-target-selection";
    selectInput.value = request.research_target_id;
    selectInput.checked = request.research_target_id === selectedCollectionTargetId;
    selectInput.addEventListener("change", () => { selectedCollectionTargetId = request.research_target_id; renderCollectionTargets(); });
    selectCell.append(selectInput); row.append(selectCell);
    const keywordCell = document.createElement("td"); keywordCell.textContent = request.search_seed; row.append(keywordCell);
    const sourceCell = document.createElement("td"); sourceCell.textContent = request.source_types.map(sourceLabel).join(", "); row.append(sourceCell);
    const stageCell = document.createElement("td"); stageCell.textContent = stageLabel(request.reviewer_stages); row.append(stageCell);
    const reasonCell = document.createElement("td"); reasonCell.textContent = request.reason || "REVIEW_REQUIRED"; row.append(reasonCell);
    const provenanceCell = document.createElement("td"); provenanceCell.textContent = request.source_references.map((reference) => `${sourceLabel(reference.source_type)}:${reference.marker}:${reference.line_number}`).join(" | "); row.append(provenanceCell);
    const statusCell = document.createElement("td"); statusCell.textContent = request.status; row.append(statusCell);
    collectionTargetsBody.append(row);
  }
}
function invalidateCollectionTargets() {
  collectionTargets = buildCollectionTargets(researchSeeds);
  if (researchSession) {
    researchSession = createResearchSession({ hubContext: researchInput.hub_context, researchTargets: collectionTargets.targets, researchSessionId: researchSession.research_session_id, createdAt: researchSession.created_at });
    collectionRequests = projectCollectionRequests(researchSession);
  }
  renderCollectionTargets();
}
async function runSelectedCollectionTarget() {
  collectionTargetExecution = true;
  collectionTargetExecutionButton.disabled = true;
  collectionTargetExecutionMessage.textContent = "외부 Search API가 실제 호출됩니다.";
  collectionTargetExecutionResult.textContent = "수집 중...";
  collectionTargetResultDetails.hidden = true;
  let collectionResult = null;
  try {
    const mapping = await executeSingleResearchTargetCollection({
      collectionRequests: collectionRequests.requests,
      researchTargetId: selectedCollectionTargetId,
      collectionExecutor: async (request) => {
        const { response, result } = await requestCollection(request.search_seed, {
          research_session_id: request.research_session_id,
          research_target_id: request.research_target_id,
          search_seed: request.search_seed,
          source_types: request.source_types,
          source_references: request.source_references,
          reviewer_stages: request.reviewer_stages,
          reason: request.reason,
        });
        if (!response.ok) throw new Error(result.error || result.status || "COLLECTION_FAILED");
        collectionResult = result;
        return { ...result, collectionStatus: result.snapshot?.status || null };
      },
    });
    collectionTargetExecutionResult.textContent = `Collection ID: ${mapping.collection_id} · Status: ${mapping.collection_status || "UNKNOWN"}`;
    const sourceRuns = collectionResult?.sourceRuns || collectionResult?.snapshot?.source_runs || [];
    const sourceStatus = (sourceId) => sourceRuns.find((run) => run.source_id === sourceId)?.status || "NOT_AVAILABLE";
    const valueOrStatus = (value) => value == null ? "NOT_AVAILABLE" : String(value);
    collectionResultSearchSeed.textContent = mapping.search_seed || "NOT_AVAILABLE";
    collectionResultSearchAds.textContent = sourceStatus("NAVER_SEARCH_ADS");
    collectionResultWeb.textContent = sourceStatus("NAVER_API_HUB_WEBKR");
    collectionResultCandidates.textContent = valueOrStatus(collectionResult?.keywords?.length ?? collectionResult?.snapshot?.keywords?.length);
    collectionResultEvidence.textContent = valueOrStatus(collectionResult?.evidence?.length ?? collectionResult?.snapshot?.evidence?.length);
    collectionResultMetrics.textContent = valueOrStatus(collectionResult?.derivedMetrics?.length ?? collectionResult?.snapshot?.derived_metrics?.length);
    collectionTargetResultDetails.hidden = false;
  } catch (error) {
    collectionTargetExecutionResult.textContent = `수집 실패: ${error.message}`;
  } finally {
    collectionTargetExecution = null;
    renderCollectionTargets();
  }
}
async function runConfirmedResearchCollections() {
  if (!researchSession || multiCollectionExecution) return;
  multiCollectionExecution = true;
  multiCollectionButton.disabled = true;
  multiCollectionResult.hidden = false;
  multiCollectionSummary.textContent = "수집 중...";
  multiCollectionBody.replaceChildren();
  try {
    const response = await fetch("/research-session/collect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ researchSession }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "RESEARCH_SESSION_COLLECTION_FAILED");
    const summary = result.summary;
    multiCollectionData = result.results || [];
    integrationButton.disabled = multiCollectionData.length === 0;
    multiCollectionSummary.textContent = `전체 ${summary.total_targets} · 완료 ${summary.completed_count} · SUCCESS ${summary.success_count} · PARTIAL_SUCCESS ${summary.partial_success_count} · FAILED ${summary.failed_count}`;
    for (const item of result.results || []) {
      const row = document.createElement("tr");
      for (const value of [item.search_seed, item.collection_id || "NOT_CREATED", item.collection_status, item.search_ads_status, item.web_status, item.candidates ?? "NOT_AVAILABLE", item.evidence ?? "NOT_AVAILABLE", item.metrics ?? "NOT_AVAILABLE"]) {
        const cell = document.createElement("td"); cell.textContent = String(value); row.append(cell);
      }
      multiCollectionBody.append(row);
    }
  } catch (error) {
    multiCollectionSummary.textContent = `세션 수집 실패: ${error.message}`;
  } finally {
    multiCollectionExecution = false;
    renderCollectionTargets();
  }
}
async function createSessionEvidenceIntegration() {
  if (!researchSession || !multiCollectionData?.length) return;
  integrationButton.disabled = true;
  integrationStatus.textContent = "통합 중...";
  try {
    const response = await fetch("/research-session/integration", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ research_session_id: researchSession.research_session_id, target_results: multiCollectionData, research_context: researchInput }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "RESEARCH_SESSION_INTEGRATION_FAILED");
    const integration = result.integration;
    sessionIntegrationData = integration;
    renderFinalPlannerHandoffState();
    await loadFinalPlannerHandoff().catch(() => {});
    compressionButton.disabled = false;
    integrationStatus.textContent = `Integration v${integration.integration_version} 저장 완료`;
    integrationSummary.textContent = `Targets ${integration.target_count} · Collections ${integration.collection_count} · Unique Keywords ${integration.unique_keyword_count} · Evidence ${integration.evidence_count} · Metrics ${integration.metric_count}`;
  } catch (error) {
    integrationStatus.textContent = `통합 실패: ${error.message}`;
    integrationButton.disabled = false;
  }
}
async function createSessionSearchDemandCompression() {
  if (!sessionIntegrationData) return;
  compressionButton.disabled = true;
  compressionStatus.textContent = "Compression 생성 중...";
  try {
    const response = await fetch("/research-session/compression", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ integration: sessionIntegrationData }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "SEARCH_DEMAND_COMPRESSION_FAILED");
    const compression = result.compression;
    sessionCompressionData = compression;
    renderFinalPlannerHandoffState();
    await loadFinalPlannerHandoff().catch(() => {});
    interpretationButton.disabled = false;
    compressionStatus.textContent = `Compression v${compression.compression_version} 저장 완료`;
    compressionSummary.textContent = `Clusters ${compression.demand_clusters.length} · Representative Candidates ${compression.representative_entrance_candidates.length} · Grounded Questions ${compression.grounded_question_links.length} · Unclustered ${compression.unclustered_keyword_ids.length} · Coverage ${compression.coverage_summary.overall}`;
  } catch (error) {
    compressionStatus.textContent = `Compression 실패: ${error.message}`;
    compressionButton.disabled = false;
  }
}
async function interpretSessionSearchDemandCompression() {
  if (!sessionCompressionData) return;
  interpretationButton.disabled = true;
  interpretationStatus.textContent = "Relationship 해석 중...";
  try {
    const response = await fetch("/research-session/compression/interpret", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ compression: sessionCompressionData, integration: sessionIntegrationData, research_context: researchInput }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "SEARCH_DEMAND_INTERPRETATION_FAILED");
    const interpreted = result.compression;
    interpretationStatus.textContent = `Compression v${interpreted.compression_version} 해석 저장 완료`;
    interpretationSummary.textContent = `Relationships ${interpreted.interpreted_relationships.length} · Clusters ${interpreted.demand_clusters.length} · Clustered ${interpreted.clustered_keyword_ids.length} · Unclustered ${interpreted.unclustered_keyword_ids.length} · Entrances ${interpreted.representative_entrance_candidates.length} · Questions ${interpreted.grounded_question_links.length} · REVIEW_REQUIRED ${interpreted.relationship_summary.review_required}`;
  } catch (error) {
    interpretationStatus.textContent = `Relationship 해석 실패: ${error.message}`;
    interpretationButton.disabled = false;
  }
}
function renderFinalPlannerHandoffState(data = null) {
  const summary = data?.summary || {};
  const sessionId = researchSession?.research_session_id || summary.research_session_id || null;
  finalPlannerHandoffPanel.hidden = !sessionId;
  createFinalPlannerHandoffButton.disabled = !sessionId;
  loadFinalPlannerHandoffButton.disabled = !sessionId;
  finalHandoffSession.textContent = sessionId || "NOT_AVAILABLE";
  finalHandoffContext.textContent = summary.context_version == null ? "NOT_AVAILABLE" : `v${summary.context_version}`;
  finalHandoffIntegration.textContent = summary.integration_version == null ? "NOT_AVAILABLE" : `v${summary.integration_version}`;
  finalHandoffCompression.textContent = summary.compression_version == null ? "NOT_AVAILABLE" : `v${summary.compression_version}`;
  finalHandoffVersion.textContent = summary.handoff_version == null ? "NOT_AVAILABLE" : `v${summary.handoff_version}`;
  finalPlannerHandoffStatus.textContent = summary.status || "NOT_READY";
  for (const [element, value] of [[finalHandoffKeywords, summary.keywords], [finalHandoffEvidence, summary.evidence], [finalHandoffMetrics, summary.metrics], [finalHandoffClusters, summary.demand_clusters], [finalHandoffEntrances, summary.representative_entrances], [finalHandoffQuestions, summary.grounded_questions], [finalHandoffReviewRequired, summary.review_required_clusters]]) element.textContent = value == null ? "NOT_AVAILABLE" : String(value);
  const coverage = summary.coverage || {};
  finalHandoffCoverage.textContent = `Coverage: Search Volume ${coverage.search_volume || "NOT_AVAILABLE"} · WEB ${coverage.web || "NOT_AVAILABLE"} · Trend ${coverage.trend || "NOT_AVAILABLE"} · Provider Competition ${coverage.provider_competition || "NOT_AVAILABLE"} · Provenance ${coverage.provenance || "NOT_AVAILABLE"} · Overall ${coverage.overall || "NOT_AVAILABLE"}`;
}
async function loadFinalPlannerHandoff() {
  if (!researchSession?.research_session_id) return;
  const response = await fetch(`/final-planner-handoff?researchSessionId=${encodeURIComponent(researchSession.research_session_id)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "FINAL_PLANNER_HANDOFF_READ_FAILED");
  renderFinalPlannerHandoffState(result);
  await loadPlannerDecisionBriefState();
  finalHandoffMessage.textContent = result.handoff ? `최신 Final Planner Handoff v${result.handoff.handoff_version} 조회 완료` : "아직 생성된 Final Planner Handoff가 없습니다.";
}
function renderPlannerDecisionBriefState(metadata = null) {
  const sessionId = researchSession?.research_session_id || null;
  plannerDecisionBriefPanel.hidden = !sessionId;
  const ready = Boolean(metadata?.file_name);
  plannerDecisionBriefStatus.textContent = ready ? "READY" : "NOT_READY";
  plannerDecisionBriefFilename.textContent = ready ? metadata.file_name : "아직 생성된 Planner Decision Brief가 없습니다.";
  downloadPlannerDecisionBriefButton.disabled = !ready;
  downloadPlannerDecisionBriefButton.dataset.downloadUrl = ready
    ? `/research-session/planner-decision-brief/download?researchSessionId=${encodeURIComponent(sessionId)}`
    : "";
}
async function loadPlannerDecisionBriefState() {
  if (!researchSession?.research_session_id) return;
  const response = await fetch(`/research-session/planner-decision-brief?researchSessionId=${encodeURIComponent(researchSession.research_session_id)}`);
  if (response.status === 404) { renderPlannerDecisionBriefState(); return; }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "PLANNER_DECISION_BRIEF_READ_FAILED");
  renderPlannerDecisionBriefState(result);
}
async function loadInitialResearchContext() {
  if (!initialResearchSessionId) return false;
  const response = await fetch(`/research-session/context?researchSessionId=${encodeURIComponent(initialResearchSessionId)}`);
  if (response.status === 404) return false;
  const artifact = await response.json();
  if (!response.ok) throw new Error(artifact.error || "RESEARCH_SESSION_CONTEXT_READ_FAILED");
  const context = artifact.context || artifact;
  researchInput.hub_context = { ...researchInput.hub_context, ...(artifact.hub_context || context.hub_context || {}) };
  researchInput.planner_hypothesis = { ...researchInput.planner_hypothesis, ...(artifact.planner_hypothesis || context.planner_hypothesis || {}) };
  researchInput.reviewer_research_direction = { ...researchInput.reviewer_research_direction, ...(artifact.reviewer_research_direction || context.reviewer_research_direction || {}) };
  hubSeedInput.value = researchInput.hub_context.hub_seed || "";
  hubStoryInput.value = researchInput.hub_context.hub_story || "";
  storyDirectionInput.value = researchInput.hub_context.story_direction || "";
  plannerHypothesisInput.value = researchInput.planner_hypothesis.raw_text || "";
  reviewerDirectionInput.value = researchInput.reviewer_research_direction.raw_text || "";
  researchSession = { research_session_id: artifact.research_session_id, created_at: artifact.created_at };
  renderResearchInputState();
  renderCollectionTargets();
  await loadPlannerDecisionBriefState();
  return true;
}
async function createFinalPlannerHandoffFromUi() {
  if (!researchSession?.research_session_id) return;
  createFinalPlannerHandoffButton.disabled = true;
  finalHandoffMessage.textContent = "Final Planner Handoff 생성 중...";
  try {
    const response = await fetch("/final-planner-handoff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ researchSessionId: researchSession.research_session_id }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "FINAL_PLANNER_HANDOFF_CREATE_FAILED");
    renderFinalPlannerHandoffState(result);
    await loadPlannerDecisionBriefState();
    finalHandoffMessage.textContent = `Final Planner Handoff v${result.handoff.handoff_version} 생성 완료`;
  } catch (error) { finalHandoffMessage.textContent = `생성 실패: ${error.message}`; }
  finally { createFinalPlannerHandoffButton.disabled = false; }
}
async function requestCollection(seedKeyword, researchContext = null) {
  const body = researchContext ? { seedKeyword, researchContext } : { seedKeyword };
  const response = await fetch("/collect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { response, result: await response.json() };
}
function renderResearchSeeds() {
  const researchSeedsTable = researchSeedsBody.closest("table");
  const researchSeedsHeader = researchSeedsTable?.querySelector("thead tr");
  researchSeedsHeader?.replaceChildren(...["Research Seed", "Source", "Stage", "Reason", "Decision"].map((label) => {
    const cell = document.createElement("th");
    cell.textContent = label;
    return cell;
  }));
  researchSeedsBody.replaceChildren();
  for (const seed of researchSeeds) {
    const row = document.createElement("tr");
    const seedCell = document.createElement("td"); seedCell.textContent = seed.seed_text; row.append(seedCell);
    const sourceCell = document.createElement("td"); sourceCell.textContent = seed.source_types.map(sourceLabel).join(", "); row.append(sourceCell);
    const stageCell = document.createElement("td"); stageCell.textContent = stageLabel(seed.reviewer_stages); row.append(stageCell);
    const reasonCell = document.createElement("td"); reasonCell.textContent = seed.reason || "REVIEW_REQUIRED"; row.append(reasonCell);
    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    for (const status of ["PROPOSED", "CONFIRMED", "EXCLUDED"]) statusSelect.append(new Option(status, status));
    statusSelect.value = seed.status;
    statusSelect.addEventListener("change", () => { researchSeeds = updateResearchSeedStatus(researchSeeds, seed.research_seed_id, statusSelect.value); invalidateCollectionTargets(); renderResearchSeeds(); });
    statusCell.append(statusSelect); row.append(statusCell); researchSeedsBody.append(row);
  }
  renderResearchSeedCounts();
  renderCollectionTargets();
}
async function runInitialDiscoveryFromUi() {
  const requestCount = collectionRequestProjection?.request_count || 0;
  if (!requestCount || initialDiscoveryRun) return;
  const approved = window.confirm(`초기 조사 Collection Request ${requestCount}개를 순차 실행합니다.\n외부 Search API가 실제 호출됩니다. 계속하시겠습니까?`);
  if (!approved) return;
  runInitialDiscoveryButton.disabled = true;
  initialDiscoveryRunMessage.textContent = "Initial Discovery 실행 중...";
  try {
    const response = await fetch("/research-session/initial-discovery/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collection_request_projection: collectionRequestProjection }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "INITIAL_DISCOVERY_RUN_FAILED");
    initialDiscoveryRun = result;
    renderInitialDiscoveryProjection();
  } catch (error) {
    runInitialDiscoveryButton.disabled = false;
    initialDiscoveryRunMessage.textContent = `Initial Discovery 실행 실패: ${error.message}`;
  }
}
async function evaluateInitialDiscoveryFromUi() {
  if (!researchSession?.research_session_id || !initialDiscoveryRun || initialDiscoveryEvaluation) return;
  evaluateInitialDiscoveryButton.disabled = true;
  initialDiscoveryEvaluationMessage.textContent = "Evaluation 실행 중...";
  try {
    const response = await fetch("/research-session/initial-discovery/evaluation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        research_session_id: researchSession.research_session_id,
        research_plan: researchPlan,
        initial_discovery_run: initialDiscoveryRun.run || initialDiscoveryRun,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "INITIAL_DISCOVERY_EVALUATION_FAILED");
    initialDiscoveryEvaluation = result;
    renderInitialDiscoveryProjection();
  } catch (error) {
    evaluateInitialDiscoveryButton.disabled = false;
    initialDiscoveryEvaluationMessage.textContent = `Evaluation 실패: ${error.message}`;
  }
}
async function projectFollowUpResearchFromUi() {
  if (!researchSession?.research_session_id || !initialDiscoveryEvaluation || followUpProjection) return;
  projectFollowUpResearchButton.disabled = true;
  followUpProjectionMessage.textContent = "Follow-up Projection 실행 중...";
  try {
    const response = await fetch("/research-session/follow-up/projection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        research_session_id: researchSession.research_session_id,
        research_plan: researchPlan,
        evaluation: initialDiscoveryEvaluation.evaluation || initialDiscoveryEvaluation,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "FOLLOW_UP_PROJECTION_FAILED");
    followUpProjection = result;
    renderInitialDiscoveryProjection();
  } catch (error) {
    projectFollowUpResearchButton.disabled = false;
    followUpProjectionMessage.textContent = `Follow-up Projection 실패: ${error.message}`;
  }
}
generateResearchSeedsButton.addEventListener("click", async () => {
  syncResearchInputFromDom();
  if (!(researchInput.hub_context.confirmed && researchInput.planner_hypothesis.confirmed && researchInput.reviewer_research_direction.confirmed)) {
    return;
  }
  researchSeeds = generateResearchSeeds(researchInput);
  researchSeedsStale = false;
  researchPlan = null;
  initialDiscoveryProjection = null;
  collectionRequestProjection = null;
  initialDiscoveryRun = null;
  initialDiscoveryEvaluation = null;
  followUpProjection = null;
  collectionTargets = buildCollectionTargets(researchSeeds);
  researchSession = createResearchSession({ hubContext: researchInput.hub_context, researchTargets: collectionTargets.targets });
  collectionRequests = projectCollectionRequests(researchSession);
  researchPlan = buildResearchPlan({ researchSessionId: researchSession.research_session_id, context: researchInput, researchSeeds });
  initialDiscoveryProjection = projectInitialDiscovery({ researchPlan });
  collectionRequestProjection = projectInitialDiscoveryCollectionRequests({ initialDiscovery: initialDiscoveryProjection });
  researchContextSaveStatus.textContent = "Context 저장 중...";
  try {
    const contextResponse = await fetch("/research-session/context", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ research_session_id: researchSession.research_session_id, context: researchInput }) });
    const contextResult = await contextResponse.json();
    if (!contextResponse.ok) throw new Error(contextResult.error || "RESEARCH_SESSION_CONTEXT_SAVE_FAILED");
    researchContextSaveStatus.textContent = `Context: SAVED · Research Session: ${researchSession.research_session_id} · Context Version: v${contextResult.artifact.context_version}`;
  } catch (error) {
    researchContextSaveStatus.textContent = `Context 저장 실패: ${error.message}`;
  }
  researchSeedsStatus.textContent = researchSeeds.length ? "생성 완료" : "추출된 Seed 없음";
  researchSeedsMessage.textContent = researchSeeds.length ? "Research Seed 후보를 검토하세요. 아직 Search API를 호출하지 않았습니다." : "명시적인 Search Candidate를 찾지 못했습니다. REVIEW_REQUIRED";
   renderResearchSeeds();
   renderFinalPlannerHandoffState();
   await loadFinalPlannerHandoff().catch(() => {});
 });
function setAllResearchSeedStatuses(status) {
  researchSeeds = researchSeeds.map((seed) => ({ ...seed, status }));
  invalidateCollectionTargets();
  renderResearchSeeds();
}
confirmAllResearchSeedsButton.addEventListener("click", () => setAllResearchSeedStatuses("CONFIRMED"));
resetAllResearchSeedsButton.addEventListener("click", () => setAllResearchSeedStatuses("PROPOSED"));
collectionTargetExecutionButton.addEventListener("click", runSelectedCollectionTarget);
multiCollectionButton.addEventListener("click", runConfirmedResearchCollections);
runInitialDiscoveryButton.addEventListener("click", runInitialDiscoveryFromUi);
evaluateInitialDiscoveryButton.addEventListener("click", evaluateInitialDiscoveryFromUi);
projectFollowUpResearchButton.addEventListener("click", projectFollowUpResearchFromUi);
integrationButton.addEventListener("click", createSessionEvidenceIntegration);
compressionButton.addEventListener("click", createSessionSearchDemandCompression);
interpretationButton.addEventListener("click", interpretSessionSearchDemandCompression);
createFinalPlannerHandoffButton.addEventListener("click", createFinalPlannerHandoffFromUi);
loadFinalPlannerHandoffButton.addEventListener("click", async () => { try { await loadFinalPlannerHandoff(); } catch (error) { finalHandoffMessage.textContent = `조회 실패: ${error.message}`; } });
renderResearchInputState();
renderCollectionTargets();
renderFinalPlannerHandoffState();
if (researchSession) loadFinalPlannerHandoff().catch((error) => { finalHandoffMessage.textContent = `조회 실패: ${error.message}`; });

function formatNumber(value) { return typeof value === "number" ? value.toLocaleString("ko-KR") : "—"; }
function volumeValue(value, rawValue) { return typeof value === "number" ? formatNumber(value) : rawValue || "—"; }
function setOptionValues(select, values) {
  const current = select.value;
  select.replaceChildren(new Option("ALL", "ALL"));
  for (const value of values.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), "ko"))) select.append(new Option(value, value));
  select.value = values.includes(current) ? current : "ALL";
}
function updateCounts() {
  const counts = { SELECTED: 0, EXCLUDED: 0, UNDECIDED: 0 };
  for (const decision of decisions.values()) counts[decision] += 1;
  $("#selected-count").textContent = counts.SELECTED;
  $("#excluded-count").textContent = counts.EXCLUDED;
  $("#undecided-count").textContent = counts.UNDECIDED;
}
function resetReviewState() {
  decisions = new Map(currentRows.map((row) => [row.candidate.keyword_id, "UNDECIDED"]));
  notes = new Map(currentRows.map((row) => [row.candidate.keyword_id, ""]));
  reviewVersion.textContent = "NEW";
  updateCounts();
}
function renderSummary(pack) {
  const metadata = pack.metadata;
  $("#summary-collection").textContent = metadata.collection_id;
  $("#summary-seed").textContent = metadata.hub_seed;
  $("#summary-status").textContent = metadata.collection_status;
  $("#summary-candidates").textContent = metadata.keyword_count;
  $("#summary-hub").textContent = pack.keywords.filter((item) => item.keyword_role === "HUB_SEED").length;
  $("#summary-related").textContent = pack.keywords.filter((item) => item.keyword_role === "RELATED_KEYWORD").length;
  $("#summary-evidence").textContent = metadata.evidence_count;
  $("#summary-metrics").textContent = metadata.derived_metric_count;
  $("#summary-search-ads").textContent = pack.source_summary.NAVER_SEARCH_ADS?.status || "NOT_AVAILABLE";
  $("#summary-web").textContent = pack.source_summary.NAVER_API_HUB_WEBKR?.status || "NOT_AVAILABLE";
  $("#summary-trend").textContent = pack.source_summary.NAVER_API_HUB_SEARCH_TREND?.status || "NOT_COLLECTED";
  $("#summary-ratio").textContent = `${pack.competition_ratio.formula} / ${pack.competition_ratio.formula_version}`;
}
function renderTable() {
  const filtered = filterReviewRows(currentRows, { search: searchInput.value, role: roleFilter.value, totalStatus: totalFilter.value, competition: competitionFilter.value, webStatus: webFilter.value });
  const sorted = sortReviewRows(filtered, sortField.value, sortDirection.value);
  resultCount.textContent = `${sorted.length} / ${currentRows.length}`;
  tableBody.replaceChildren();
  for (const row of sorted) {
    const id = row.candidate.keyword_id;
    const tr = document.createElement("tr");
    const values = [row.keyword, row.role, volumeValue(row.pcValue, row.pcRawValue), volumeValue(row.mobileValue, row.mobileRawValue), row.totalValue == null ? "—" : formatNumber(row.totalValue), row.totalStatus, row.competition || "—", row.webStatus, row.trendStatus, row.providers.join(", ") || "—"];
    for (const value of values) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
    const decisionCell = document.createElement("td");
    const decision = document.createElement("select");
    for (const value of ["SELECTED", "EXCLUDED", "UNDECIDED"]) decision.append(new Option(value, value));
    decision.value = decisions.get(id) || "UNDECIDED";
    decision.addEventListener("change", () => { decisions.set(id, decision.value); updateCounts(); });
    decisionCell.append(decision); tr.append(decisionCell);
    const noteCell = document.createElement("td");
    const note = document.createElement("input"); note.type = "text"; note.value = notes.get(id) || ""; note.placeholder = "Reviewer note";
    note.addEventListener("input", () => notes.set(id, note.value)); noteCell.append(note); tr.append(noteCell);
    const detailCell = document.createElement("td"); const details = document.createElement("details"); const summary = document.createElement("summary"); summary.textContent = "Details"; const pre = document.createElement("pre");
    pre.textContent = JSON.stringify({ keyword_id: id, evidence_ids: row.evidenceIds, metric_ids: row.metricIds, source_run_ids: row.sourceRunIds, raw_references: row.rawReferences, collected_at: row.collectedAt }, null, 2);
    details.append(summary, pre); detailCell.append(details); tr.append(detailCell); tableBody.append(tr);
  }
  updateCounts();
}
function renderFilters() {
  setOptionValues(roleFilter, [...new Set(currentRows.map((row) => row.role))]);
  setOptionValues(totalFilter, [...new Set(currentRows.map((row) => row.totalStatus))]);
  setOptionValues(competitionFilter, [...new Set(currentRows.map((row) => row.competition))]);
  setOptionValues(webFilter, [...new Set(currentRows.map((row) => row.webStatus))]);
}
async function loadReview(version = null) {
  const suffix = version ? `&version=${encodeURIComponent(version)}` : "";
  const response = await fetch(`/review?collectionId=${encodeURIComponent(packId.value.trim())}${suffix}`);
  if (!response.ok) throw new Error("Review 조회에 실패했습니다.");
  const data = await response.json();
  reviewVersionSelect.replaceChildren(new Option("LATEST", ""));
  for (const item of data.versions || []) reviewVersionSelect.append(new Option(`v${item}`, String(item)));
  resetReviewState();
  if (data.review) {
    reviewVersion.textContent = `v${data.review.review_version}`;
    for (const item of data.review.reviewer_selection) { decisions.set(item.keyword_id, item.decision); notes.set(item.keyword_id, item.reviewer_note || ""); }
  }
  updateCounts();
}
async function loadPack(collectionId) {
  const trimmed = collectionId.trim();
  if (!trimmed) throw new Error("Collection ID가 필요합니다.");
  reviewMessage.textContent = "Pack을 조회하는 중입니다.";
  const response = await fetch(`/pack?collectionId=${encodeURIComponent(trimmed)}`);
  if (!response.ok) throw new Error(response.status === 404 ? "해당 Collection의 Pack을 찾을 수 없습니다." : "Pack 조회에 실패했습니다.");
  const pack = await response.json(); packId.value = pack.metadata.collection_id; currentPackVersion = Number(pack.metadata.pack_version); currentRows = createReviewRows(pack);
  renderSummary(pack); renderFilters(); await loadReview(); renderTable(); review.hidden = false;
  reviewMessage.textContent = "Pack과 Review Selection을 기준으로 표시 중입니다. Pack은 변경하지 않습니다.";
}
async function saveReview() {
  saveReviewButton.disabled = true;
  saveReviewButton.textContent = "저장 중...";
  reviewSaveStatus.textContent = "저장 중...";
  try {
    const reviewerSelection = currentRows.map((row) => ({ keyword_id: row.candidate.keyword_id, decision: decisions.get(row.candidate.keyword_id) || "UNDECIDED", reviewer_note: notes.get(row.candidate.keyword_id) || "" }));
    const response = await fetch("/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collectionId: packId.value.trim(), packVersion: currentPackVersion, reviewerSelection }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Review 저장에 실패했습니다.");
    await loadReview(String(result.review.review_version)); renderTable(); reviewMessage.textContent = `Review v${result.review.review_version}이 저장되었습니다.`;
    reviewSaveStatus.textContent = `저장 완료 · v${result.review.review_version}`;
  } catch (error) {
    reviewSaveStatus.textContent = "저장 실패";
    throw error;
  } finally {
    saveReviewButton.disabled = false;
    saveReviewButton.textContent = "Review 저장";
  }
}
loadPackButton.addEventListener("click", async () => { try { await loadPack(packId.value); } catch (error) { review.hidden = false; reviewMessage.textContent = error.message; } });
saveReviewButton.addEventListener("click", async () => { try { await saveReview(); } catch (error) { reviewMessage.textContent = error.message; } });
loadReviewButton.addEventListener("click", async () => { try { await loadReview(reviewVersionSelect.value || null); renderTable(); } catch (error) { reviewMessage.textContent = error.message; } });
createHandoffButton.addEventListener("click", async () => {
  createHandoffButton.disabled = true;
  try {
    const reviewVersionValue = reviewVersion.textContent.startsWith("v") ? Number(reviewVersion.textContent.slice(1)) : null;
    const response = await fetch("/handoff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collectionId: packId.value.trim(), packVersion: currentPackVersion, reviewVersion: reviewVersionValue }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "GEO Handoff 생성에 실패했습니다.");
    reviewMessage.textContent = `GEO Handoff 생성 완료 · v${result.handoff.handoff_version} · Review v${result.handoff.review_version} · SELECTED ${result.handoff.selected_candidates.length}개`;
  } catch (error) { reviewMessage.textContent = error.message; } finally { createHandoffButton.disabled = false; }
});
for (const control of [searchInput, roleFilter, totalFilter, competitionFilter, webFilter, sortField, sortDirection]) control.addEventListener("input", renderTable);
collectButton.addEventListener("click", async () => {
  status.textContent = "확인 중"; rawStatus.textContent = "수집 중"; collectButton.disabled = true;
  try {
    const { response, result } = await requestCollection(seed.value); const collectionStatus = result.snapshot?.status;
    if (collectionStatus === "SUCCESS" || collectionStatus === "PARTIAL_SUCCESS") { status.textContent = collectionStatus; rawStatus.textContent = `Evidence ${result.evidence?.length ?? 0}건`; packId.value = result.collectionId || ""; try { await loadPack(result.collectionId); } catch (error) { review.hidden = false; reviewMessage.textContent = `Collection은 완료되었지만 Pack은 아직 조회할 수 없습니다: ${error.message}`; } }
    else { status.textContent = "실패"; rawStatus.textContent = result.status === "WAITING_FOR_CREDENTIALS" ? "대기" : "실패"; $("#preflight").textContent = result.preflight?.status || result.status || "FAILED"; }
  } catch { status.textContent = "실패"; rawStatus.textContent = "실패"; } finally { collectButton.disabled = false; }
});
downloadPlannerDecisionBriefButton.addEventListener("click", () => {
  const url = downloadPlannerDecisionBriefButton.dataset.downloadUrl;
  if (!url) return;
  plannerDecisionBriefMessage.textContent = "Planner Decision Brief 다운로드를 시작합니다.";
  window.location.assign(url);
});
openRecentCompletedResearchButton.addEventListener("click", () => {
  if (!recentCompletedResearch?.research_session_id) return;
  window.location.assign(`/?researchSessionId=${encodeURIComponent(recentCompletedResearch.research_session_id)}`);
});
downloadRecentCompletedBriefButton.addEventListener("click", () => {
  if (!recentCompletedResearch?.download_url) return;
  window.location.assign(recentCompletedResearch.download_url);
});
await fetch("/status").then((response) => response.json()).then((data) => { status.textContent = data.status; $("#stage").textContent = data.stage; $("#preflight").textContent = data.sourcePreflight.status; $("#ratio").textContent = `${data.competitionRatio.formula} / ${data.competitionRatio.formulaVersion}`; }).catch(() => { status.textContent = "상태 확인 실패"; });
loadRecentCompletedResearch().catch((error) => { recentCompletedResearchStatus.textContent = "NOT_READY"; recentCompletedResearchMessage.textContent = `완료 결과 조회 실패: ${error.message}`; });
if (initialResearchSessionId) loadInitialResearchContext().catch((error) => { finalHandoffMessage.textContent = `Context load failed: ${error.message}`; renderPlannerDecisionBriefState(); });
const initialCollectionId = new URLSearchParams(location.search).get("collectionId");
if (initialCollectionId) { packId.value = initialCollectionId; loadPack(initialCollectionId).catch((error) => { review.hidden = false; reviewMessage.textContent = error.message; }); }
