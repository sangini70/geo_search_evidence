import { saveFinalPlannerHandoff } from "../repositories/final-planner-handoff-repository.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }

function sourceEvidenceStatus(collectionResult) {
  const availability = collectionResult.evidence_availability || {};
  const sourceStatuses = availability.source_statuses || {};
  const evidenceTypes = availability.evidence_types || [];
  const relatedKeywordStatus = evidenceTypes.includes("RELATED_KEYWORDS")
    ? "AVAILABLE"
    : sourceStatuses.NAVER_SEARCH_ADS === "FAILED"
      ? "SOURCE_FAILED"
      : "NOT_AVAILABLE";
  return {
    search_seed: collectionResult.search_seed,
    normalized_search_seed: collectionResult.normalized_search_seed,
    collection_id: collectionResult.collection_id,
    collection_status: collectionResult.collection_status,
    sources: Object.fromEntries((collectionResult.source_runs || []).map((run) => [run.source_id, {
      status: run.status,
      evidence_types: evidenceTypes,
      evidence_availability: availability,
      source_run_id: run.source_run_id,
      raw_reference: run.raw_reference || null,
    }])),
    related_keyword_evidence: {
      status: relatedKeywordStatus,
      evidence_types: evidenceTypes,
      source_statuses: sourceStatuses,
    },
  };
}

function relationshipProjection(relation, integration) {
  const basis = relation.interpretation_basis;
  const sourceKeywords = integration.session_keywords || [];
  const candidateKeywordIds = unique([relation.left_keyword_id, relation.right_keyword_id]);
  const sourceEvidenceIds = unique(sourceKeywords.filter((keyword) => candidateKeywordIds.some((id) => (keyword.keyword_ids || []).includes(id))).flatMap((keyword) => keyword.source_evidence_ids || []));
  const sourceMetricIds = unique(sourceKeywords.filter((keyword) => candidateKeywordIds.some((id) => (keyword.keyword_ids || []).includes(id))).flatMap((keyword) => keyword.source_metric_ids || []));
  return {
    relationship_id: relation.relation_id,
    source_keyword_id: relation.left_keyword_id,
    source_keyword: relation.left_keyword,
    target_keyword_id: relation.right_keyword_id,
    target_keyword: relation.right_keyword,
    relationship_type: relation.relation_type,
    judgment: relation.status,
    review_required: relation.status === "REVIEW_REQUIRED",
    candidate_keyword_ids: candidateKeywordIds,
    source_keyword_ids: relation.source_keyword_ids || [],
    source_evidence_ids: sourceEvidenceIds,
    source_metric_ids: sourceMetricIds,
    reason: typeof basis === "string" ? basis : basis?.rule || null,
    context_references: typeof basis === "object" ? basis?.shared_reviewer_or_planner_markers || [] : [],
  };
}

function unclusteredProjection({ keywordId, integration, relationships }) {
  const keyword = integration.session_keywords?.find((item) => (item.keyword_ids || []).includes(keywordId));
  const keywordRelationships = relationships.filter((relation) => relation.left_keyword_id === keywordId || relation.right_keyword_id === keywordId);
  const collectionIds = keyword?.collection_ids || [];
  const collectionResults = (integration.collection_results || []).filter((result) => collectionIds.includes(result.collection_id));
  const reviewRequired = keywordRelationships.some((relation) => relation.status === "REVIEW_REQUIRED");
  return {
    keyword_id: keywordId,
    keyword: keyword?.normalized_keyword || null,
    has_relationship_candidate: keywordRelationships.length > 0,
    relationship_candidate_ids: keywordRelationships.map((relation) => relation.relation_id),
    review_required: reviewRequired,
    evidence_availability: collectionResults.map((result) => ({
      collection_id: result.collection_id,
      collection_status: result.collection_status,
      evidence_availability: result.evidence_availability || {},
    })),
    collection_source_references: collectionResults.map((result) => ({
      collection_id: result.collection_id,
      search_seed: result.search_seed,
      source_references: result.source_references || [],
      context_references: result.context_references || [],
    })),
    unclustered_reason_status: reviewRequired
      ? "REVIEW_REQUIRED"
      : keywordRelationships.length > 0
        ? "RELATIONSHIP_EXISTS_NOT_CLUSTERED"
        : "NO_RELATIONSHIP_CANDIDATE",
  };
}

export function buildFinalPlannerHandoff({ context, integration, compression, sourceCompression, now = new Date().toISOString() } = {}) {
  if (!context?.research_session_id || !integration?.research_session_id || !compression?.research_session_id) throw new Error("FINAL_PLANNER_HANDOFF_INPUT_REQUIRED");
  const reviewRequiredRelations = compression.interpreted_relationships?.filter((item) => item.status === "REVIEW_REQUIRED") || [];
  const reviewRequiredClusters = compression.demand_clusters?.filter((cluster) => cluster.status === "REVIEW_REQUIRED") || [];
  const relationships = compression.interpreted_relationships || [];
  const relationshipCandidates = relationships.map((relation) => relationshipProjection(relation, integration));
  const unclusteredKeywordIds = compression.unclustered_keyword_ids || [];
  const collectionIds = unique(integration.source_collection_ids || integration.collection_results?.map((item) => item.collection_id) || []);
  const contextReference = integration.context_artifact_reference || compression.lineage?.context_artifact_reference || null;
  return {
    handoff_id: `final_planner_handoff_${context.research_session_id}`,
    handoff_version: null,
    research_session_id: context.research_session_id,
    created_at: now,
    hub_context: context.hub_context,
    planner_hypothesis_summary: {
      raw_text: context.planner_hypothesis?.raw_text || "",
      confirmed: context.planner_hypothesis?.confirmed ?? null,
      source: "PLANNER_HYPOTHESIS",
    },
    reviewer_research_direction_summary: {
      raw_text: context.reviewer_research_direction?.raw_text || "",
      confirmed: context.reviewer_research_direction?.confirmed ?? null,
      source: "REVIEWER_RESEARCH_DIRECTION",
    },
    research_summary: {
      source_research_session_id: integration.source_research_session_id || null,
      collection_ids: collectionIds,
      keyword_count: compression.source_integration?.unique_keyword_count ?? integration.unique_keyword_count,
      evidence_count: compression.source_integration?.evidence_count ?? integration.evidence_count,
      metric_count: compression.source_integration?.metric_count ?? integration.metric_count,
      coverage: compression.coverage_summary || {},
    },
    search_demand_findings: {
      demand_clusters: compression.demand_clusters || [],
      representative_entrances: compression.representative_entrance_candidates || [],
      grounded_questions: compression.grounded_question_links || [],
      unclustered_summary: {
        count: unclusteredKeywordIds.length,
        keyword_ids: unclusteredKeywordIds,
        details: unclusteredKeywordIds.map((keywordId) => unclusteredProjection({ keywordId, integration, relationships })),
      },
      relationship_candidates: relationshipCandidates,
      planner_hypothesis_evidence: compression.planner_hypothesis_evidence || { status: "REVIEW_REQUIRED", items: [] },
      reviewer_direction_evidence: compression.reviewer_direction_evidence || { status: "REVIEW_REQUIRED", items: [] },
      new_demand_candidates: compression.new_demand_candidates || [],
      source_evidence_status: (integration.collection_results || []).map(sourceEvidenceStatus),
    },
    evidence_coverage: {
      ...(compression.coverage_summary || {}),
      provider_competition: compression.coverage_summary?.provider_competition || "NOT_AVAILABLE",
    },
    planner_judgment_required: [
      "SAME_DEMAND_CANDIDATE final equivalence",
      ...reviewRequiredClusters.map((cluster) => `Cluster adoption: ${cluster.cluster_id}`),
      ...reviewRequiredRelations.slice(0, 50).map((relation) => `Relationship review: ${relation.relation_id}`),
      "Hub inclusion of discovered Search Demand",
      "Knowledge Node creation, merge, or exclusion",
      "Hub Architecture",
      "Learning Flow",
      "Knowledge Relationship",
      "Existing Knowledge Network overlap",
    ],
    lineage: {
      context_reference: contextReference,
      integration_reference: { research_session_id: integration.research_session_id, integration_version: integration.integration_version || null, source_research_session_id: integration.source_research_session_id || null },
      compression_reference: { research_session_id: compression.research_session_id, compression_version: compression.compression_version || compression.source_compression_version || null, source_compression_id: compression.lineage?.source_compression_id || null },
      source_research_session_id: integration.source_research_session_id || null,
      source_collection_ids: collectionIds,
      source_evidence_ids: unique(integration.lineage?.source_evidence_ids || compression.lineage?.source_evidence_ids || sourceCompression?.lineage?.source_evidence_ids || []),
      source_metric_ids: unique(integration.lineage?.source_metric_ids || compression.lineage?.source_metric_ids || sourceCompression?.lineage?.source_metric_ids || []),
      raw_references: unique(integration.lineage?.raw_references || compression.lineage?.raw_references || sourceCompression?.lineage?.raw_references || []),
    },
  };
}

export async function createFinalPlannerHandoff(options = {}) {
  return saveFinalPlannerHandoff(buildFinalPlannerHandoff(options));
}
