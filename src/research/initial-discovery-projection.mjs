const RESEARCH_ALGORITHM_VERSION = "1.1";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function references(item) {
  return item.source_references || [];
}

function hasSourceType(item, sourceType) {
  return (item.context_references || []).some((reference) => reference.source_type === sourceType)
    || references(item).some((reference) => reference.source_type === sourceType);
}

function hasMarker(item, markers) {
  return references(item).some((reference) => markers.includes(reference.marker));
}

function selectionReasons(item) {
  const reasons = [];
  if (hasSourceType(item, "HUB_CONTEXT")) reasons.push("HUB_DIRECT");
  if (hasMarker(item, ["MAIN_KEYWORD"])) reasons.push("PLANNER_MAIN_KEYWORD");
  if (hasMarker(item, ["SECONDARY_KEYWORDS"])) reasons.push("PLANNER_CORE_HYPOTHESIS");
  if (hasMarker(item, [
    "DEMAND_ANCHOR",
    "DEMAND_ANCHOR_GROUP",
    "PRIMARY_DEMAND_ANCHORS",
  ])) {
    reasons.push("REVIEWER_CORE_QUERY");
  }
  return unique(reasons);
}

function selectedItem(item, selectionReason) {
  return {
    research_plan_item_id: item.research_plan_item_id,
    search_seed: item.search_seed,
    selection_reason: selectionReason,
    context_references: clone(item.context_references || []),
    related_planner_hypotheses: clone(item.related_planner_hypotheses || []),
    related_reviewer_direction: clone(item.related_reviewer_direction || []),
    evidence_to_collect: clone(item.evidence_to_collect || []),
    reviewer_stages: [...(item.reviewer_stages || [])],
    source_references: clone(item.source_references || []),
  };
}

function deferredItem(item) {
  const markerNames = references(item).map((reference) => reference.marker);
  let deferReason = "INSUFFICIENT_INITIAL_JUSTIFICATION";
  if (markerNames.includes("REVIEW_QUERY_STAGE_3")) deferReason = "LONG_TAIL_VERIFICATION";
  else if (markerNames.includes("REVIEW_QUERY_STAGE_2") || markerNames.some((marker) => ["SEARCH_ENTRANCE_GROUP", "INTENT_BRIDGE_GROUP"].includes(marker))) deferReason = "RELATION_QUERY";
  else if (markerNames.includes("EXPRESSION_VARIANT")) deferReason = "EXPRESSION_VARIANT";
  else if (markerNames.includes("RELATED_KEYWORD")) deferReason = "POSSIBLE_RELATED_KEYWORD_DISCOVERY";
  return {
    research_plan_item_id: item.research_plan_item_id,
    search_seed: item.search_seed,
    defer_reason: deferReason,
    reviewer_stages: [...(item.reviewer_stages || [])],
    source_references: clone(item.source_references || []),
  };
}

export function projectInitialDiscovery({ researchPlan, researchPlanVersion = null, now = new Date().toISOString(), algorithmVersion = RESEARCH_ALGORITHM_VERSION } = {}) {
  if (!researchPlan?.research_plan_id || !researchPlan?.research_session_id) throw new Error("RESEARCH_PLAN_REQUIRED");
  const selectedItems = [];
  const deferredItems = [];
  for (const item of researchPlan.plan_items || []) {
    const reasons = selectionReasons(item);
    if (reasons.length > 0) selectedItems.push(selectedItem(item, reasons));
    else deferredItems.push(deferredItem(item));
  }
  return {
    initial_discovery_id: `initial_discovery_${researchPlan.research_plan_id}`,
    research_plan_id: researchPlan.research_plan_id,
    research_plan_version: researchPlanVersion,
    research_session_id: researchPlan.research_session_id,
    created_at: now,
    algorithm_version: algorithmVersion,
    selected_items: selectedItems,
    deferred_items: deferredItems,
    status: selectedItems.length > 0 ? "READY" : "NOT_READY",
  };
}
