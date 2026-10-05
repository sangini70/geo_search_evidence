function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalizeSearchSeed(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function mergeRequest(current, item) {
  current.research_plan_item_ids = unique([...current.research_plan_item_ids, item.research_plan_item_id]);
  current.selection_reason = unique([...current.selection_reason, ...(item.selection_reason || [])]);
  current.context_references = [...current.context_references, ...clone(item.context_references || [])];
  current.related_planner_hypotheses = [...current.related_planner_hypotheses, ...clone(item.related_planner_hypotheses || [])];
  current.related_reviewer_direction = [...current.related_reviewer_direction, ...clone(item.related_reviewer_direction || [])];
  current.evidence_to_collect = unique([...current.evidence_to_collect, ...(item.evidence_to_collect || [])]);
  current.reviewer_stages = [...new Set([...current.reviewer_stages, ...(item.reviewer_stages || [])])].sort((a, b) => a - b);
  current.source_references = [...current.source_references, ...clone(item.source_references || [])];
}

function buildRequest(projection, item) {
  return {
    research_session_id: projection.research_session_id,
    research_plan_id: projection.research_plan_id,
    initial_discovery_id: projection.initial_discovery_id,
    research_plan_item_id: item.research_plan_item_id,
    research_plan_item_ids: [item.research_plan_item_id],
    search_seed: item.search_seed,
    normalized_search_seed: normalizeSearchSeed(item.search_seed),
    evidence_to_collect: clone(item.evidence_to_collect || []),
    selection_reason: [...(item.selection_reason || [])],
    context_references: clone(item.context_references || []),
    related_planner_hypotheses: clone(item.related_planner_hypotheses || []),
    related_reviewer_direction: clone(item.related_reviewer_direction || []),
    reviewer_stages: [...(item.reviewer_stages || [])],
    source_references: clone(item.source_references || []),
    status: "READY",
  };
}

export function projectInitialDiscoveryCollectionRequests({ initialDiscovery } = {}) {
  if (!initialDiscovery?.initial_discovery_id || !initialDiscovery?.research_plan_id || !initialDiscovery?.research_session_id) {
    throw new Error("INITIAL_DISCOVERY_PROJECTION_REQUIRED");
  }
  const bySeed = new Map();
  for (const item of initialDiscovery.selected_items || []) {
    const normalizedSeed = normalizeSearchSeed(item.search_seed);
    if (!normalizedSeed) continue;
    const current = bySeed.get(normalizedSeed);
    if (current) mergeRequest(current, item);
    else bySeed.set(normalizedSeed, buildRequest(initialDiscovery, item));
  }
  const requests = [...bySeed.values()];
  return {
    collection_request_projection_id: `collection_request_projection_${initialDiscovery.initial_discovery_id}`,
    research_session_id: initialDiscovery.research_session_id,
    research_plan_id: initialDiscovery.research_plan_id,
    initial_discovery_id: initialDiscovery.initial_discovery_id,
    created_at: initialDiscovery.created_at,
    algorithm_version: initialDiscovery.algorithm_version,
    request_count: requests.length,
    requests,
    status: requests.length > 0 ? "READY" : "NOT_READY",
  };
}
