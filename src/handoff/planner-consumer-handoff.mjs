import { savePlannerConsumerHandoff } from "../repositories/planner-consumer-handoff-repository.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }

function countBy(values) {
  return Object.fromEntries(Object.entries(values.reduce((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {})).sort(([left], [right]) => left.localeCompare(right)));
}

function compactContext(rawText, markers) {
  const lines = String(rawText || "").split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  return Object.fromEntries(markers.map((marker) => [marker, unique(lines.filter((line) => line.includes(`${marker}:`)).map((line) => line.replace(/^[-*]\s*/u, "")))]));
}

function compactPlannerHypothesis(summary) {
  const extracted = compactContext(summary.raw_text, ["TITLE", "HUB", "INTENT", "MAIN KEYWORD", "SECONDARY KEYWORDS", "USER QUESTION", "DIRECT ANSWER GOAL", "UNDERSTANDING GOAL"]);
  return { ...extracted, confirmed: summary.confirmed, source: summary.source };
}

function compactReviewerDirection(summary) {
  const lines = String(summary.raw_text || "").split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  const stageMarkers = unique(lines.filter((line) => /[123]차\s+(핵심|추가|선택)\s+조회/u.test(line)).map((line) => line.replace(/^[-*]\s*/u, "")));
  const directionMarkers = unique(lines.filter((line) => /(Demand Anchor|Search Entrance|Intent Bridge|Relation|Long-tail|조회 목록)/iu.test(line)).map((line) => line.replace(/^[-*]\s*/u, "")).slice(0, 30));
  return { stage_markers: stageMarkers, direction_markers: directionMarkers, confirmed: summary.confirmed, source: summary.source };
}

function keywordMap(fullHandoff) {
  const result = new Map();
  for (const item of fullHandoff.search_demand_findings?.representative_entrances || []) result.set(item.keyword_id, item.keyword);
  for (const item of fullHandoff.search_demand_findings?.unclustered_summary?.details || []) result.set(item.keyword_id, item.keyword);
  return result;
}

function compactClusters(fullHandoff, keywords) {
  return (fullHandoff.search_demand_findings?.demand_clusters || []).map((cluster) => ({
    cluster_id: cluster.cluster_id,
    status: cluster.status,
    review_required: cluster.status === "REVIEW_REQUIRED",
    demand_summary: cluster.demand_summary,
    member_count: cluster.member_keyword_ids?.length || 0,
    member_keywords: (cluster.member_keyword_ids || []).map((keywordId) => ({ keyword_id: keywordId, keyword: keywords.get(keywordId) || null })),
    representative_entrance_ids: cluster.representative_search_entrance_candidates || [],
    research_target_ids: cluster.research_target_ids || [],
    evidence_coverage: cluster.coverage || {},
    evidence_reference: {
      source_evidence_ids: cluster.source_evidence_ids || [],
      source_metric_ids: cluster.source_metric_ids || [],
      collection_ids: cluster.provenance?.collection_ids || [],
    },
    interpretation_reference: cluster.interpretation_basis?.[0] || null,
  }));
}

function compactEntrances(fullHandoff) {
  return (fullHandoff.search_demand_findings?.representative_entrances || []).map((item) => ({
    candidate_id: item.candidate_id,
    keyword_id: item.keyword_id,
    keyword: item.keyword,
    cluster_id: item.cluster_id,
    status: item.status,
    selection_basis: item.selection_basis,
    evidence_reference: {
      source_evidence_ids: item.source_evidence_ids || [],
      source_metric_ids: item.source_metric_ids || [],
      collection_ids: item.provenance?.collection_ids || [],
      research_target_ids: item.provenance?.research_target_ids || [],
    },
  }));
}

function compactRelationships(fullHandoff) {
  const relationships = fullHandoff.search_demand_findings?.relationship_candidates || [];
  return relationships.map((item) => ({
    relationship_id: item.relationship_id,
    source: { keyword_id: item.source_keyword_id, keyword: item.source_keyword },
    target: { keyword_id: item.target_keyword_id, keyword: item.target_keyword },
    relationship_type: item.relationship_type,
    judgment: item.judgment,
    review_required: item.review_required,
    reason: item.reason,
    evidence_reference: {
      source_evidence_ids: item.source_evidence_ids || [],
      source_metric_ids: item.source_metric_ids || [],
    },
  }));
}

function compactQuestions(fullHandoff) {
  const grouped = new Map();
  for (const item of fullHandoff.search_demand_findings?.grounded_questions || []) {
    const key = `${item.question || ""}\u0000${item.status || ""}`;
    const existing = grouped.get(key) || { question: item.question, status: item.status, relation_ids: [], source_references: [] };
    if (item.relation_id) existing.relation_ids = unique([...existing.relation_ids, item.relation_id]);
    if (item.source_type || item.line_number) existing.source_references.push({ source_type: item.source_type || null, line_number: item.line_number || null });
    grouped.set(key, existing);
  }
  return [...grouped.values()].map((item) => ({ ...item, relation_ids: unique(item.relation_ids), source_references: item.source_references.slice(0, 3) }));
}

function compactUnclustered(fullHandoff) {
  const details = fullHandoff.search_demand_findings?.unclustered_summary?.details || [];
  const statusCounts = countBy(details.map((item) => item.unclustered_reason_status || "UNKNOWN"));
  const relationshipCounts = countBy(details.map((item) => item.has_relationship_candidate ? "HAS_RELATIONSHIP_CANDIDATE" : "NO_RELATIONSHIP_CANDIDATE"));
  const examples = [];
  const seen = new Set();
  for (const item of details) {
    const key = `${item.unclustered_reason_status || "UNKNOWN"}:${item.has_relationship_candidate ? "RELATIONSHIP" : "NO_RELATIONSHIP"}`;
    if (!seen.has(key)) { examples.push({ keyword_id: item.keyword_id, keyword: item.keyword, status: item.unclustered_reason_status || "UNKNOWN", has_relationship_candidate: item.has_relationship_candidate, relationship_candidate_ids: (item.relationship_candidate_ids || []).slice(0, 3), collection_source_references: item.collection_source_references || [] }); seen.add(key); }
  }
  return { count: details.length, status_counts: statusCounts, relationship_counts: relationshipCounts, representative_items: examples, full_handoff_reference: true };
}

function compactSourceEvidence(fullHandoff) {
  const entries = fullHandoff.search_demand_findings?.source_evidence_status || [];
  return {
    collection_count: entries.length,
    collection_status_counts: countBy(entries.map((item) => item.collection_status || "UNKNOWN")),
    collections: entries.map((item) => ({
      search_seed: item.search_seed,
      normalized_search_seed: item.normalized_search_seed,
      collection_id: item.collection_id,
      collection_status: item.collection_status,
      sources: Object.fromEntries(Object.entries(item.sources || {}).map(([source, value]) => [source, { status: value.status, evidence_types: value.evidence_types || [], source_run_id: value.source_run_id || null }])),
      related_keyword_evidence: item.related_keyword_evidence || {},
    })),
    evidence_types: unique(entries.flatMap((item) => Object.values(item.sources || {}).flatMap((source) => source.evidence_types || []))),
  };
}

export function buildPlannerConsumerHandoff({ fullHandoff, fullHandoffPath = null, now = new Date().toISOString() } = {}) {
  if (!fullHandoff?.research_session_id || !fullHandoff?.handoff_version) throw new Error("PLANNER_CONSUMER_HANDOFF_INPUT_REQUIRED");
  const findings = fullHandoff.search_demand_findings || {};
  const keywords = keywordMap(fullHandoff);
  const sourceLineage = fullHandoff.lineage || {};
  const sourceCollectionIds = sourceLineage.source_collection_ids || fullHandoff.research_summary?.collection_ids || [];
  const sourceEvidenceIds = sourceLineage.source_evidence_ids || [];
  const sourceMetricIds = sourceLineage.source_metric_ids || [];
  const rawReferences = sourceLineage.raw_references || [];
  const lineageIncomplete = sourceCollectionIds.length === 0
    || (sourceEvidenceIds.length === 0 && sourceMetricIds.length === 0 && rawReferences.length === 0);
  return {
    consumer_handoff_id: `planner_consumer_handoff_${fullHandoff.research_session_id}`,
    consumer_handoff_version: null,
    research_session_id: fullHandoff.research_session_id,
    created_at: now,
    projection_status: lineageIncomplete ? "PARTIAL" : "READY",
    source_full_handoff: { path: fullHandoffPath, handoff_version: fullHandoff.handoff_version },
    context_summary: {
      hub_context: fullHandoff.hub_context || {},
      planner_hypothesis: compactPlannerHypothesis(fullHandoff.planner_hypothesis_summary || {}),
      reviewer_research_direction: compactReviewerDirection(fullHandoff.reviewer_research_direction_summary || {}),
    },
    research_summary: {
      collection_count: fullHandoff.research_summary?.collection_ids?.length || 0,
      keyword_count: fullHandoff.research_summary?.keyword_count ?? null,
      evidence_count: fullHandoff.research_summary?.evidence_count ?? null,
      metric_count: fullHandoff.research_summary?.metric_count ?? null,
      collection_ids: fullHandoff.research_summary?.collection_ids || [],
      coverage: fullHandoff.research_summary?.coverage || {},
    },
    evidence_coverage: {
      ...(fullHandoff.evidence_coverage || {}),
      competition_ratio: {
        formula: fullHandoff.evidence_coverage?.competition_ratio?.formula || "NOT_CONFIGURED",
        formula_version: fullHandoff.evidence_coverage?.competition_ratio?.formula_version || "NOT_CONFIGURED",
        status: fullHandoff.evidence_coverage?.competition_ratio?.status || "NOT_CONFIGURED",
      },
    },
    search_demand_summary: {
      demand_clusters: compactClusters(fullHandoff, keywords),
      representative_entrances: compactEntrances(fullHandoff),
      grounded_questions: { count: findings.grounded_questions?.length || 0, items: compactQuestions(fullHandoff) },
      relationships: {
        total: findings.relationship_candidates?.length || 0,
        same_demand_candidate: findings.relationship_candidates?.filter((item) => item.relationship_type === "SAME_DEMAND_CANDIDATE").length || 0,
        related_demand: findings.relationship_candidates?.filter((item) => item.relationship_type === "RELATED_DEMAND").length || 0,
        review_required: findings.relationship_candidates?.filter((item) => item.review_required).length || 0,
        items: compactRelationships(fullHandoff),
      },
      unclustered: compactUnclustered(fullHandoff),
      planner_hypothesis_evidence: fullHandoff.search_demand_findings?.planner_hypothesis_evidence || { status: "REVIEW_REQUIRED", items: [] },
      reviewer_direction_evidence: fullHandoff.search_demand_findings?.reviewer_direction_evidence || { status: "REVIEW_REQUIRED", items: [] },
      new_demand_candidates: fullHandoff.search_demand_findings?.new_demand_candidates || [],
    },
    source_evidence_summary: compactSourceEvidence(fullHandoff),
    planner_judgment_required: fullHandoff.planner_judgment_required || [],
    lineage: {
      full_handoff_reference: { path: fullHandoffPath, handoff_version: fullHandoff.handoff_version },
      context_reference: fullHandoff.lineage?.context_reference || null,
      integration_reference: fullHandoff.lineage?.integration_reference || null,
      compression_reference: fullHandoff.lineage?.compression_reference || null,
      collection_ids: sourceCollectionIds,
      source_evidence_ids: sourceEvidenceIds,
      source_metric_ids: sourceMetricIds,
      raw_references: rawReferences,
      source_evidence_count: sourceEvidenceIds.length,
      source_metric_count: sourceMetricIds.length,
      raw_reference_count: rawReferences.length,
      status: lineageIncomplete ? "SOURCE_REFERENCE_INCOMPLETE" : "COMPLETE",
    },
  };
}

export async function createPlannerConsumerHandoff(options = {}) {
  return savePlannerConsumerHandoff(buildPlannerConsumerHandoff(options));
}
