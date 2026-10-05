import { savePlannerDecisionBrief } from "../repositories/planner-decision-brief-repository.mjs";

const unique = (values) => [...new Set(values.filter((value) => value != null && value !== ""))];
const uniqueBy = (items, keyOf) => [...new Map(items.map((item) => [keyOf(item), item])).values()];

function countBy(values) {
  return Object.fromEntries(Object.entries(values.reduce((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {})).sort(([left], [right]) => left.localeCompare(right)));
}

function markerValues(section, marker) {
  return unique((section?.[marker] || []).map((line) => String(line).replace(new RegExp(`^${marker}:\\s*`, "u"), "").trim()));
}

function buildPlannerHypothesis(summary) {
  return {
    title: markerValues(summary, "TITLE"),
    hub: markerValues(summary, "HUB"),
    intent: markerValues(summary, "INTENT"),
    main_keywords: markerValues(summary, "MAIN KEYWORD"),
    secondary_keywords: markerValues(summary, "SECONDARY KEYWORDS"),
    user_questions: markerValues(summary, "USER QUESTION"),
    direct_answer_goals: markerValues(summary, "DIRECT ANSWER GOAL"),
    understanding_goals: markerValues(summary, "UNDERSTANDING GOAL"),
    source: summary.source || null,
    confirmed: summary.confirmed ?? null,
  };
}

function buildReviewerDirection(summary) {
  const stageMarkers = unique((summary?.stage_markers || []).filter((line) => /[123]차\s+(핵심|추가|선택)\s+조회/u.test(line)));
  const directionMarkers = unique((summary?.direction_markers || []).filter((line) => !/확정:\s*보류|NOT\s+CONFIRMED|NOT\s+PROVIDED/iu.test(line)));
  return {
    stage_markers: stageMarkers,
    direction_markers: directionMarkers,
    stage_lineage_only: true,
    source: summary?.source || null,
    confirmed: summary?.confirmed ?? null,
  };
}

function buildRelationshipView(relationships) {
  const items = relationships.map((item) => {
    return {
      relationship_id: item.relationship_id,
      source: item.source,
      target: item.target,
      relationship_type: item.relationship_type,
      judgment: item.judgment,
      review_required: item.review_required,
      reason: item.reason,
      source_reference: `source_consumer_handoff.search_demand_summary.relationships.items[${item.relationship_id}]`,
    };
  });
  return {
    total: items.length,
    by_type: {
      SAME_DEMAND_CANDIDATE: items.filter((item) => item.relationship_type === "SAME_DEMAND_CANDIDATE").length,
      RELATED_DEMAND: items.filter((item) => item.relationship_type === "RELATED_DEMAND").length,
      REVIEW_REQUIRED: items.filter((item) => item.review_required).length,
    },
    item_schema: ["relationship_id", "source", "target", "relationship_type", "judgment", "review_required", "reason", "source_reference"],
    items: items.map((item) => [
      item.relationship_id,
      item.source,
      item.target,
      item.relationship_type,
      item.judgment,
      item.review_required,
      item.reason,
      item.source_reference,
    ]),
  };
}

function buildClusterView(consumer, plannerQuestions) {
  const clusters = consumer.search_demand_summary?.demand_clusters || [];
  const relationships = consumer.search_demand_summary?.relationships?.items || [];
  const questions = consumer.search_demand_summary?.grounded_questions?.items || [];
  return clusters.map((cluster) => {
    const memberIds = new Set((cluster.member_keywords || []).map((item) => item.keyword_id));
    const clusterRelationships = relationships.filter((item) => memberIds.has(item.source?.keyword_id) || memberIds.has(item.target?.keyword_id));
    const entrances = uniqueBy((consumer.search_demand_summary?.representative_entrances || []).filter((item) => item.cluster_id === cluster.cluster_id), (item) => item.keyword_id || item.keyword);
    const variantRelations = clusterRelationships.filter((item) => item.relationship_type === "FORMAT_VARIANT");
    const variantGroups = uniqueBy(variantRelations.map((item) => ({
      keywords: unique([item.source?.keyword, item.target?.keyword]),
      relationship_id: item.relationship_id,
    })), (item) => item.keywords.slice().sort().join("\\u0000"));
    const clusterQuestionIds = new Set(clusterRelationships.map((item) => item.relationship_id));
    const linkedQuestions = uniqueBy(questions.filter((item) => item.relation_ids?.some((id) => clusterQuestionIds.has(id))), (item) => `${item.question}\\u0000${item.status}`);
    return {
      cluster_id: cluster.cluster_id,
      status: cluster.status,
      review_required: cluster.review_required,
      demand_summary: cluster.demand_summary,
      member_count: cluster.member_count,
      member_keywords: cluster.member_keywords,
      representative_entrance_count: entrances.length,
      representative_entrances: entrances.map((item) => ({
        candidate_id: item.candidate_id,
        keyword_id: item.keyword_id,
        keyword: item.keyword,
        status: item.status,
      })),
      format_variants: variantGroups,
      grounded_question_summary: {
        count: linkedQuestions.length,
        statuses: countBy(linkedQuestions.map((item) => item.status || "UNKNOWN")),
        relationship_ids: unique(linkedQuestions.flatMap((item) => item.relation_ids || [])),
      },
      planner_hypothesis_reference: plannerQuestions.length ? "context.planner_hypothesis" : null,
      evidence_coverage: cluster.evidence_coverage,
      evidence_reference: cluster.evidence_reference,
      interpretation_reference: cluster.interpretation_reference,
    };
  });
}

function buildUnclusteredSummary(unclustered) {
  return {
    total: unclustered?.count || 0,
    status_counts: unclustered?.status_counts || {},
    relationship_counts: unclustered?.relationship_counts || {},
    representative_items: (unclustered?.representative_items || []).map((item) => ({
      keyword_id: item.keyword_id,
      keyword: item.keyword,
      status: item.status,
      has_relationship_candidate: item.has_relationship_candidate,
      relationship_candidate_ids: item.relationship_candidate_ids || [],
      collection_sources: uniqueBy((item.collection_source_references || []).map((reference) => ({
        collection_id: reference.collection_id,
        search_seed: reference.search_seed,
      })), (reference) => `${reference.collection_id}\\u0000${reference.search_seed}`),
      source_reference: "source_consumer_handoff.search_demand_summary.unclustered",
    })),
    full_handoff_reference: unclustered?.full_handoff_reference === true,
  };
}

function buildEvidenceLimitations(consumer) {
  const source = consumer.source_evidence_summary || {};
  const collections = source.collections || [];
  const partialFailures = collections.filter((item) => item.collection_status === "PARTIAL_SUCCESS" || Object.values(item.sources || {}).some((value) => value.status === "FAILED"));
  return {
    coverage: consumer.evidence_coverage || {},
    collection_status_counts: source.collection_status_counts || {},
    evidence_types: source.evidence_types || [],
    partial_failures: partialFailures.map((item) => ({
      search_seed: item.search_seed,
      normalized_search_seed: item.normalized_search_seed,
      collection_id: item.collection_id,
      collection_status: item.collection_status,
      sources: Object.fromEntries(Object.entries(item.sources || {}).map(([name, value]) => [name, { status: value.status, evidence_types: value.evidence_types || [], source_run_id: value.source_run_id || null }])),
      related_keyword_evidence: { status: item.related_keyword_evidence?.status || null },
    })),
    source_statuses: collections.map((item) => ({
      search_seed: item.search_seed,
      collection_id: item.collection_id,
      collection_status: item.collection_status,
      sources: Object.fromEntries(Object.entries(item.sources || {}).map(([name, value]) => [name, value.status])),
      related_keyword_evidence: item.related_keyword_evidence?.status || null,
    })),
  };
}

export function buildPlannerDecisionBrief({ consumerHandoff, consumerHandoffPath = null, now = new Date().toISOString() } = {}) {
  if (!consumerHandoff?.research_session_id || !consumerHandoff?.consumer_handoff_version) throw new Error("PLANNER_DECISION_BRIEF_INPUT_REQUIRED");
  const plannerHypothesis = buildPlannerHypothesis(consumerHandoff.context_summary?.planner_hypothesis || {});
  const relationships = consumerHandoff.search_demand_summary?.relationships?.items || [];
  const plannerQuestions = plannerHypothesis.user_questions;
  return {
    decision_brief_id: `planner_decision_brief_${consumerHandoff.research_session_id}`,
    decision_brief_version: null,
    research_session_id: consumerHandoff.research_session_id,
    created_at: now,
    projection_status: consumerHandoff.projection_status || "PARTIAL",
    source_consumer_handoff: { path: consumerHandoffPath, version: consumerHandoff.consumer_handoff_version },
    context: {
      hub_context: consumerHandoff.context_summary?.hub_context || {},
      planner_hypothesis: plannerHypothesis,
      reviewer_research_direction: buildReviewerDirection(consumerHandoff.context_summary?.reviewer_research_direction),
    },
    research_scope: {
      ...(consumerHandoff.research_summary || {}),
      coverage: consumerHandoff.evidence_coverage || consumerHandoff.research_summary?.coverage || {},
    },
    demand_decision_view: {
      demand_clusters: buildClusterView(consumerHandoff, plannerQuestions),
      representative_entrance_count: consumerHandoff.search_demand_summary?.representative_entrances?.length || 0,
      relationship_view: buildRelationshipView(relationships),
      unclustered_summary: buildUnclusteredSummary(consumerHandoff.search_demand_summary?.unclustered),
      planner_hypothesis_evidence: consumerHandoff.search_demand_summary?.planner_hypothesis_evidence || { status: "REVIEW_REQUIRED", items: [] },
      reviewer_direction_evidence: consumerHandoff.search_demand_summary?.reviewer_direction_evidence || { status: "REVIEW_REQUIRED", items: [] },
      new_demand_candidates: consumerHandoff.search_demand_summary?.new_demand_candidates || [],
      grounded_question_summary: {
        total: consumerHandoff.search_demand_summary?.grounded_questions?.count || 0,
        planner_user_questions: plannerQuestions,
        source_reference: "source_consumer_handoff.search_demand_summary.grounded_questions",
      },
    },
    evidence_limitation_summary: buildEvidenceLimitations(consumerHandoff),
    planner_judgment_required: consumerHandoff.planner_judgment_required || [],
    lineage: {
      ...consumerHandoff.lineage,
      source_consumer_handoff: { path: consumerHandoffPath, version: consumerHandoff.consumer_handoff_version },
      full_handoff_reference: consumerHandoff.lineage?.full_handoff_reference || null,
      context_reference: consumerHandoff.lineage?.context_reference || null,
      integration_reference: consumerHandoff.lineage?.integration_reference || null,
      compression_reference: consumerHandoff.lineage?.compression_reference || null,
      collection_ids: consumerHandoff.lineage?.collection_ids || [],
      status: consumerHandoff.lineage?.status || "SOURCE_REFERENCE_INCOMPLETE",
    },
  };
}

export async function createPlannerDecisionBrief(options = {}) {
  return savePlannerDecisionBrief(buildPlannerDecisionBrief(options));
}
