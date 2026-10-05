const RESEARCH_ALGORITHM_VERSION = "1.1";

export const RESEARCH_PLAN_EVIDENCE_TYPES = Object.freeze([
  "SEARCH_VOLUME_PC",
  "SEARCH_VOLUME_MOBILE",
  "SEARCH_VOLUME_TOTAL",
  "RELATED_KEYWORDS",
  "PROVIDER_COMPETITION",
  "WEB_SEARCH_RESULT_TOTAL",
  "SOURCE_PROVENANCE",
  "COLLECTION_STATUS",
]);

export const RESEARCH_PLAN_FOLLOW_UP_CONDITIONS = Object.freeze([
  "RELATED_SEARCH_ENTRANCE_DISCOVERED",
  "PLANNER_HYPOTHESIS_EVIDENCE_MISSING",
  "REVIEWER_REQUIRED_AREA_NOT_COVERED",
  "DISTINCT_INTENT_REQUIRES_VERIFICATION",
  "RELATION_QUERY_REQUIRES_VERIFICATION",
]);

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function uniqueSortedNumbers(values = []) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value)))].sort((a, b) => a - b);
}

function sourceReferences(seed) {
  return (seed.source_references || []).map((reference) => clone(reference));
}

function sourceTypes(seed) {
  return [...new Set(seed.source_types || [])];
}

function mergeSeeds(researchSeeds = []) {
  const merged = new Map();
  for (const seed of researchSeeds) {
    const searchSeed = String(seed?.seed_text ?? seed?.keyword ?? "").trim();
    if (!searchSeed) continue;
    const key = String(seed.normalized_seed_text || searchSeed).trim();
    const current = merged.get(key);
    if (!current) {
      merged.set(key, {
        ...clone(seed),
        seed_text: searchSeed,
        source_types: sourceTypes(seed),
        source_references: sourceReferences(seed),
        reviewer_stages: uniqueSortedNumbers(seed.reviewer_stages || []),
      });
      continue;
    }
    current.source_types = [...new Set([...current.source_types, ...sourceTypes(seed)])];
    current.source_references.push(...sourceReferences(seed));
    current.reviewer_stages = uniqueSortedNumbers([...current.reviewer_stages, ...(seed.reviewer_stages || [])]);
    if (seed.reason && seed.reason !== current.reason) current.reason = [current.reason, seed.reason].filter(Boolean).join("; ");
  }
  return [...merged.values()];
}

function contextReference(sourceType) {
  const contextField = {
    HUB_CONTEXT: "hub_context",
    PLANNER_HYPOTHESIS: "planner_hypothesis",
    REVIEWER_RESEARCH_DIRECTION: "reviewer_direction",
  }[sourceType];
  return contextField ? { source_type: sourceType, context_field: contextField } : null;
}

function buildPlanItem(seed, index) {
  const references = sourceReferences(seed);
  const types = sourceTypes(seed);
  const contextReferences = types.map(contextReference).filter(Boolean);
  return {
    research_plan_item_id: `research_plan_item_${String(index + 1).padStart(3, "0")}`,
    search_seed: seed.seed_text,
    purpose: seed.reason
      ? `Investigate this declared Research Seed. Source reason: ${seed.reason}`
      : "Investigate this declared Research Seed using the available Search Evidence sources.",
    context_references: contextReferences,
    related_planner_hypotheses: references.filter((reference) => reference.source_type === "PLANNER_HYPOTHESIS"),
    related_reviewer_direction: references.filter((reference) => reference.source_type === "REVIEWER_RESEARCH_DIRECTION"),
    evidence_to_collect: [...RESEARCH_PLAN_EVIDENCE_TYPES],
    follow_up_condition: [...RESEARCH_PLAN_FOLLOW_UP_CONDITIONS],
    reviewer_stages: uniqueSortedNumbers(seed.reviewer_stages || []),
    source_references: references,
    status: "PLANNED",
    initial_discovery_status: "NOT_SELECTED",
  };
}

export function buildResearchPlan({ researchSessionId, context = {}, researchSeeds = [], now = new Date().toISOString(), algorithmVersion = RESEARCH_ALGORITHM_VERSION } = {}) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  const reviewerDirection = context.reviewer_direction || context.reviewer_research_direction || context.reviewerDirection || {};
  const planItems = mergeSeeds(researchSeeds).map(buildPlanItem);
  return {
    research_plan_id: `research_plan_${researchSessionId}`,
    research_session_id: researchSessionId,
    created_at: now,
    algorithm_version: algorithmVersion,
    context: {
      hub_context: clone(context.hub_context || context.hubContext || {}),
      planner_hypothesis: clone(context.planner_hypothesis || context.plannerHypothesis || {}),
      reviewer_direction: clone(reviewerDirection),
    },
    initial_discovery: {
      status: "NOT_EXECUTED",
      plan_item_ids: [],
    },
    plan_items: planItems,
    status: "PLANNED",
  };
}
