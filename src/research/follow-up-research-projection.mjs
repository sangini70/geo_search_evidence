function clone(value) { return value == null ? value : structuredClone(value); }
function normalizeSeed(value) { return String(value ?? "").trim().replace(/\s+/gu, " "); }
const FOLLOW_UP_CONDITIONS = new Set([
  "RELATED_SEARCH_ENTRANCE_DISCOVERED",
  "PLANNER_HYPOTHESIS_EVIDENCE_MISSING",
  "REVIEWER_REQUIRED_AREA_NOT_COVERED",
  "DISTINCT_INTENT_REQUIRES_VERIFICATION",
  "RELATION_QUERY_REQUIRES_VERIFICATION",
]);

function availableTypes(item) {
  return (item.evidence_evaluation || []).filter((entry) => entry.availability_status === "AVAILABLE").map((entry) => entry.evidence_type);
}

function missingTypes(item) {
  return (item.evidence_evaluation || []).filter((entry) => entry.availability_status !== "AVAILABLE").map((entry) => ({
    evidence_type: entry.evidence_type,
    availability_status: entry.availability_status,
    source_type: entry.source_type || null,
    evidence_id: entry.evidence_id || null,
    metric_id: entry.metric_id || null,
    note: entry.note || null,
  }));
}

function decideProjection(item) {
  const conditions = (item.follow_up_condition || []).filter((condition) => FOLLOW_UP_CONDITIONS.has(condition));
  const evaluationStatus = item.evaluation_status;
  if (evaluationStatus === "REVIEW_REQUIRED") return {
    projection_status: "REVIEW_REQUIRED",
    projection_reasons: ["Initial Discovery Evidence does not support an automatic follow-up decision."],
  };
  if (evaluationStatus === "FOLLOW_UP_REQUIRED" && conditions.length) return {
    projection_status: "FOLLOW_UP_CANDIDATE",
    projection_reasons: ["An explicit Research Plan follow-up condition is supported by the Initial Discovery Evaluation."],
  };
  if (conditions.length && evaluationStatus === "PARTIALLY_SATISFIED") return {
    projection_status: "REVIEW_REQUIRED",
    projection_reasons: ["A follow-up condition exists, but current Evidence is insufficient to project a follow-up safely."],
  };
  return {
    projection_status: "NO_FOLLOW_UP",
    projection_reasons: evaluationStatus === "PARTIALLY_SATISFIED"
      ? ["Missing or NOT_CALCULABLE Evidence is not a basis for repeating the same Collection."]
      : ["Initial Discovery does not identify an explicit, evidence-supported follow-up condition."],
  };
}

export function projectFollowUpResearch({ evaluation, researchPlan = null, projectionId = `follow_up_research_projection_${Date.now()}`, now = new Date().toISOString(), algorithmVersion = "1.0" } = {}) {
  if (!evaluation?.research_session_id) throw new Error("INITIAL_DISCOVERY_EVALUATION_REQUIRED");
  const sourceItems = evaluation.plan_item_evaluations || [];
  const planById = new Map((researchPlan?.plan_items || []).map((item) => [item.research_plan_item_id, item]));
  const items = sourceItems.map((evaluationItem) => {
    const planItem = planById.get(evaluationItem.research_plan_item_id);
    const item = { ...evaluationItem, follow_up_condition: planItem?.follow_up_condition || evaluationItem.follow_up_condition || [] };
    const decision = decideProjection(item);
    return {
      research_plan_item_id: evaluationItem.research_plan_item_id,
      search_seed: evaluationItem.search_seed,
      normalized_search_seed: evaluationItem.normalized_search_seed || normalizeSeed(evaluationItem.search_seed),
      reviewer_stages: [...(evaluationItem.reviewer_stages || planItem?.reviewer_stages || [])],
      initial_evaluation_status: evaluationItem.evaluation_status,
      projection_status: decision.projection_status,
      projection_reasons: decision.projection_reasons,
      follow_up_condition: clone(item.follow_up_condition),
      existing_collection_ids: evaluationItem.collection?.collection_id ? [evaluationItem.collection.collection_id] : [],
      requested_evidence: [...(evaluationItem.requested_evidence || planItem?.evidence_to_collect || [])],
      available_evidence: availableTypes(evaluationItem),
      missing_evidence: missingTypes(evaluationItem),
      source_references: clone(evaluationItem.source_references || planItem?.source_references || []),
      context_references: clone(evaluationItem.context_references || planItem?.context_references || []),
    };
  });
  const summary = items.reduce((result, item) => {
    result.total_plan_items += 1;
    if (item.projection_status === "NO_FOLLOW_UP") result.no_follow_up += 1;
    else if (item.projection_status === "FOLLOW_UP_CANDIDATE") result.follow_up_candidate += 1;
    else result.review_required += 1;
    return result;
  }, { total_plan_items: 0, no_follow_up: 0, follow_up_candidate: 0, review_required: 0 });
  return {
    follow_up_projection_id: projectionId,
    research_session_id: evaluation.research_session_id,
    research_plan_id: evaluation.research_plan_id,
    evaluation_id: evaluation.evaluation_id,
    created_at: now,
    algorithm_version: algorithmVersion,
    summary,
    items,
  };
}
