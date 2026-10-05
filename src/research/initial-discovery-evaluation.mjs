const SEARCH_ADS_EVIDENCE = new Set(["SEARCH_VOLUME_PC", "SEARCH_VOLUME_MOBILE", "SEARCH_VOLUME_TOTAL", "RELATED_KEYWORDS", "PROVIDER_COMPETITION"]);

const EVIDENCE_MAPPING = Object.freeze({
  SEARCH_VOLUME_PC: { evidenceTypes: ["MONTHLY_SEARCH_VOLUME_PC"], sourceId: "NAVER_SEARCH_ADS" },
  SEARCH_VOLUME_MOBILE: { evidenceTypes: ["MONTHLY_SEARCH_VOLUME_MOBILE"], sourceId: "NAVER_SEARCH_ADS" },
  SEARCH_VOLUME_TOTAL: { metricTypes: ["MONTHLY_SEARCH_VOLUME_TOTAL"], sourceId: "NAVER_SEARCH_ADS" },
  RELATED_KEYWORDS: { keywordRole: "RELATED_KEYWORD", sourceId: "NAVER_SEARCH_ADS" },
  PROVIDER_COMPETITION: { evidenceTypes: ["PROVIDER_COMPETITION_VALUE"], sourceId: "NAVER_SEARCH_ADS" },
  WEB_SEARCH_RESULT_TOTAL: { evidenceTypes: ["SEARCH_RESULT_TOTAL"], sourceId: "NAVER_API_HUB_WEBKR" },
  SOURCE_PROVENANCE: { provenance: true },
  COLLECTION_STATUS: { collectionStatus: true },
});

function clone(value) { return value == null ? value : structuredClone(value); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function normalizeSeed(value) { return String(value ?? "").trim().replace(/\s+/gu, " "); }

function sourceStatus(snapshot, sourceId) {
  return snapshot?.source_runs?.find((run) => run.source_id === sourceId)?.status || null;
}

function sourceFailureStatus(snapshot, sourceId) {
  const status = sourceStatus(snapshot, sourceId);
  return status === "FAILED" ? "SOURCE_FAILED" : null;
}

function evidenceStatus(record) {
  if (record?.status === "SUCCESS" || record?.status === "EXACT") return "AVAILABLE";
  if (record?.status === "NOT_CALCULABLE") return "NOT_CALCULABLE";
  if (record?.status === "FAILED") return "SOURCE_FAILED";
  return "NOT_AVAILABLE";
}

function evaluateEvidenceRequest(evidenceType, snapshot) {
  const mapping = EVIDENCE_MAPPING[evidenceType];
  const evidence = snapshot?.evidence || [];
  const metrics = snapshot?.derived_metrics || [];
  if (!mapping) return { evidence_type: evidenceType, availability_status: "NOT_AVAILABLE", source_type: null, evidence_id: null, metric_id: null, note: "Evidence type is not supported by the current contract." };
  if (mapping.collectionStatus) return { evidence_type: evidenceType, availability_status: snapshot?.status ? "AVAILABLE" : "NOT_AVAILABLE", source_type: "COLLECTION", evidence_id: null, metric_id: null, note: snapshot?.status ? `Collection status: ${snapshot.status}` : "Collection status is missing." };
  if (mapping.provenance) {
    const available = (snapshot?.source_provenance?.length || 0) > 0 || (snapshot?.raw_references?.length || 0) > 0;
    return { evidence_type: evidenceType, availability_status: available ? "AVAILABLE" : "NOT_AVAILABLE", source_type: "SOURCE_PROVENANCE", evidence_id: null, metric_id: null, note: available ? "Source provenance is present." : "Source provenance is missing." };
  }
  const matchingMetric = mapping.metricTypes?.map((type) => metrics.find((metric) => metric.metric_type === type)).find(Boolean);
  if (matchingMetric) return { evidence_type: evidenceType, availability_status: evidenceStatus(matchingMetric), source_type: mapping.sourceId, evidence_id: null, metric_id: matchingMetric.metric_id || null, note: matchingMetric.status || "Metric present." };
  const matchingEvidence = mapping.evidenceTypes?.map((type) => evidence.find((item) => item.evidence_type === type)).find(Boolean);
  if (matchingEvidence) return { evidence_type: evidenceType, availability_status: evidenceStatus(matchingEvidence), source_type: matchingEvidence.source_id || mapping.sourceId, evidence_id: matchingEvidence.evidence_id || null, metric_id: null, note: matchingEvidence.status || "Evidence present." };
  if (mapping.keywordRole) {
    const related = snapshot?.keywords?.find((keyword) => keyword.keyword_role === mapping.keywordRole);
    if (related) return { evidence_type: evidenceType, availability_status: "AVAILABLE", source_type: mapping.sourceId, evidence_id: null, metric_id: null, note: "Related keyword records are present." };
  }
  const failed = sourceFailureStatus(snapshot, mapping.sourceId);
  return { evidence_type: evidenceType, availability_status: failed || "NOT_AVAILABLE", source_type: mapping.sourceId, evidence_id: null, metric_id: null, note: failed ? `${mapping.sourceId} Source Run failed.` : `${evidenceType} was not found in the Snapshot.` };
}

function hasStatus(evaluations, status) { return evaluations.some((evaluation) => evaluation.availability_status === status); }
function allAvailable(evaluations) { return evaluations.length > 0 && evaluations.every((evaluation) => evaluation.availability_status === "AVAILABLE"); }

function followUpStatus(item, evidenceEvaluations, collectionStatus) {
  const conditions = item.follow_up_condition || [];
  const hasFailure = ["FAILED", "PARTIAL_SUCCESS"].includes(collectionStatus) && evidenceEvaluations.some((evaluation) => ["SOURCE_FAILED", "NOT_AVAILABLE", "NOT_COLLECTED"].includes(evaluation.availability_status));
  if (hasFailure || collectionStatus === "FAILED") return "REVIEW_REQUIRED";
  if (conditions.includes("DISTINCT_INTENT_REQUIRES_VERIFICATION") || conditions.includes("RELATION_QUERY_REQUIRES_VERIFICATION")) return "REVIEW_REQUIRED";
  if (conditions.includes("RELATED_SEARCH_ENTRANCE_DISCOVERED") && evidenceEvaluations.some((evaluation) => evaluation.evidence_type === "RELATED_KEYWORDS" && evaluation.availability_status === "AVAILABLE")) return "FOLLOW_UP_REQUIRED";
  if (conditions.includes("PLANNER_HYPOTHESIS_EVIDENCE_MISSING") && !allAvailable(evidenceEvaluations)) return "FOLLOW_UP_REQUIRED";
  if (conditions.includes("REVIEWER_REQUIRED_AREA_NOT_COVERED") && !item.related_reviewer_direction?.length) return "REVIEW_REQUIRED";
  if (hasStatus(evidenceEvaluations, "NOT_CALCULABLE")) return "PARTIALLY_SATISFIED";
  return allAvailable(evidenceEvaluations) ? "SATISFIED" : "PARTIALLY_SATISFIED";
}

function planItemsFromRun(run) {
  return (run?.request_results || []).flatMap((request) => (request.research_plan_item_ids || [request.research_plan_item_id]).map((itemId) => ({
    research_plan_item_id: itemId,
    search_seed: request.search_seed,
    purpose: "Initial Discovery request lineage; persisted Research Plan item was not available.",
    context_references: clone(request.context_references || []),
    related_planner_hypotheses: clone(request.related_planner_hypotheses || []),
    related_reviewer_direction: clone(request.related_reviewer_direction || []),
    evidence_to_collect: [...(request.evidence_to_collect || [])],
    follow_up_condition: [],
    reviewer_stages: [...(request.reviewer_stages || [])],
    source_references: clone(request.source_references || []),
  })));
}

function requestForPlanItem(run, item) {
  return (run?.request_results || []).find((request) => (request.research_plan_item_ids || [request.research_plan_item_id]).includes(item.research_plan_item_id) || normalizeSeed(request.search_seed) === normalizeSeed(item.search_seed));
}

export async function evaluateInitialDiscovery({ researchPlan = null, initialDiscoveryRun, loadSnapshot, evaluationId = `initial_discovery_evaluation_${Date.now()}`, now = new Date().toISOString(), algorithmVersion = "1.0" } = {}) {
  if (!initialDiscoveryRun?.research_session_id) throw new Error("INITIAL_DISCOVERY_RUN_REQUIRED");
  if (typeof loadSnapshot !== "function") throw new Error("SNAPSHOT_LOADER_REQUIRED");
  const run = initialDiscoveryRun.run || initialDiscoveryRun;
  const planItems = researchPlan?.plan_items?.length ? researchPlan.plan_items : planItemsFromRun(run);
  const evaluations = [];
  for (const item of planItems) {
    const request = requestForPlanItem(run, item);
    const collectionId = request?.collection_id || null;
    let snapshot = null;
    let loadError = null;
    if (collectionId) {
      try { snapshot = await loadSnapshot(collectionId); } catch (error) { loadError = error; }
    }
    const requestedEvidence = [...(item.evidence_to_collect || [])];
    const evidenceEvaluation = snapshot
      ? requestedEvidence.map((evidenceType) => evaluateEvidenceRequest(evidenceType, snapshot))
      : requestedEvidence.map((evidenceType) => ({ evidence_type: evidenceType, availability_status: loadError ? "REVIEW_REQUIRED" : "NOT_COLLECTED", source_type: null, evidence_id: null, metric_id: null, note: loadError ? "Collection Snapshot could not be read." : "No Collection is linked." }));
    const collectionStatus = request?.collection_status || request?.request_status || null;
    const status = !request || loadError ? "REVIEW_REQUIRED" : followUpStatus(item, evidenceEvaluation, collectionStatus);
    const reasons = [];
    if (!request) reasons.push("No Initial Discovery Collection Request is linked.");
    if (loadError) reasons.push("Collection Snapshot could not be read.");
    if (collectionStatus === "PARTIAL_SUCCESS") reasons.push("Collection is PARTIAL_SUCCESS; source-level Evidence is evaluated separately.");
    if (status === "FOLLOW_UP_REQUIRED") reasons.push("An explicit follow-up condition is supported by current Initial Discovery Evidence.");
    if (status === "REVIEW_REQUIRED") reasons.push("Automatic next action is not safe from the available Evidence.");
    if (!reasons.length) reasons.push("Requested Evidence is available in the linked Collection Snapshot.");
    evaluations.push({
      research_plan_item_id: item.research_plan_item_id,
      search_seed: item.search_seed,
      normalized_search_seed: normalizeSeed(item.search_seed),
      reviewer_stages: [...(item.reviewer_stages || [])],
      collection: { collection_id: collectionId, collection_status: collectionStatus, reused: Boolean(request?.reused) },
      requested_evidence: requestedEvidence,
      evidence_evaluation: evidenceEvaluation,
      follow_up_condition: clone(item.follow_up_condition || []),
      evaluation_status: status,
      evaluation_reasons: reasons,
      source_references: clone(item.source_references || []),
      context_references: clone(item.context_references || []),
    });
  }
  const summary = evaluations.reduce((counts, evaluation) => { const key = evaluation.evaluation_status.toLowerCase(); if (key === "satisfied") counts.satisfied += 1; else if (key === "partially_satisfied") counts.partially_satisfied += 1; else if (key === "follow_up_required") counts.follow_up_required += 1; else if (key === "review_required") counts.review_required += 1; return counts; }, { total_plan_items: evaluations.length, satisfied: 0, partially_satisfied: 0, follow_up_required: 0, review_required: 0 });
  return { evaluation_id: evaluationId, research_session_id: run.research_session_id, research_plan_id: researchPlan?.research_plan_id || run.research_plan_id, initial_discovery_id: run.initial_discovery_id, initial_discovery_run_id: run.run_id, created_at: now, algorithm_version: algorithmVersion, summary, plan_item_evaluations: evaluations };
}
