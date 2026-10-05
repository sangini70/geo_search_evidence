import { saveSearchDemandCompression } from "../repositories/search-demand-compression-repository.mjs";
import { generateResearchSeeds } from "./research-seed-generator.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }

function pairKey(left, right) { return [left, right].sort().join("\u0000"); }

function keywordMap(integration, compression) {
  const map = new Map();
  for (const keyword of integration?.session_keywords || []) map.set(keyword.normalized_keyword, keyword);
  const sourceIds = compression?.lineage?.source_keyword_ids || [];
  for (const candidate of compression?.relationship_candidates || []) {
    const relationMatch = String(candidate.relation_id || "").match(/^relation_(\d+)_(\d+)$/u);
    const fallbackIds = relationMatch ? [sourceIds[Number(relationMatch[1]) - 1], sourceIds[Number(relationMatch[2]) - 1]] : [];
    for (const value of [candidate.left_keyword, candidate.right_keyword]) {
      if (!map.has(value)) {
        const side = value === candidate.left_keyword ? 0 : 1;
        map.set(value, { normalized_keyword: value, keyword_ids: fallbackIds[side] ? [fallbackIds[side]] : [] });
      }
    }
  }
  return map;
}

function relationKeywordId(value, candidate, side, map) {
  const keyword = map.get(value);
  if (keyword?.keyword_ids?.length) return keyword.keyword_ids[0];
  const match = String(candidate.relation_id || "").match(/^relation_(\d+)_(\d+)$/u);
  if (!match) return null;
  const sourceIds = candidate.source_keyword_ids || [];
  return sourceIds[side === "left" ? 0 : 1] || null;
}

function memberMetadata(keyword, fallbackId) {
  const keywordIds = keyword?.keyword_ids?.length ? keyword.keyword_ids : fallbackId ? [fallbackId] : [];
  return {
    keyword_id: keywordIds[0] || null,
    keyword: keyword?.normalized_keyword || null,
    keyword_ids: keywordIds,
    research_target_ids: unique(keyword?.research_target_ids || []),
    collection_ids: unique(keyword?.collection_ids || []),
    source_evidence_ids: unique(keyword?.source_evidence_ids || []),
    source_metric_ids: unique(keyword?.source_metric_ids || []),
  };
}

function coverageForMembers(members) {
  const evidence = unique(members.flatMap((member) => member.source_evidence_ids));
  const metrics = unique(members.flatMap((member) => member.source_metric_ids));
  return {
    search_volume: metrics.length ? "AVAILABLE" : "REVIEW_REQUIRED",
    web: evidence.length ? "AVAILABLE" : "REVIEW_REQUIRED",
    trend: "NOT_COLLECTED",
    provenance: members.some((member) => member.research_target_ids.length || member.collection_ids.length) ? "COMPLETE" : "MISSING",
  };
}

function compact(value) { return String(value || "").normalize("NFC").toLocaleLowerCase("ko-KR").replace(/\s+/gu, ""); }

function buildContextIndex(researchContext) {
  const seeds = generateResearchSeeds(researchContext || {});
  const byKeyword = new Map();
  for (const seed of seeds) {
    const key = compact(seed.normalized_seed_text);
    const current = byKeyword.get(key) || { seed, markers: new Set(), sources: new Set(), references: [] };
    for (const reference of seed.source_references || []) {
      current.markers.add(String(reference.marker || ""));
      current.sources.add(String(reference.source_type || ""));
      current.references.push(reference);
    }
    byKeyword.set(key, current);
  }
  const questions = [];
  for (const [sourceType, field] of [["PLANNER_HYPOTHESIS", researchContext?.planner_hypothesis?.raw_text], ["REVIEWER_RESEARCH_DIRECTION", researchContext?.reviewer_research_direction?.raw_text]]) {
    for (const [index, rawLine] of String(field || "").split(/\r?\n/u).entries()) {
      const text = rawLine.trim().replace(/^[-*]\s*/u, "");
      if (text.length >= 5 && (/[?？]/u.test(text) || /(이유|왜|원리|의미|결정|변동|어떻게|무엇)/u.test(text))) questions.push({ source_type: sourceType, line_number: index + 1, text });
    }
  }
  return { byKeyword, questions };
}

function contextFor(value, index) { return index.byKeyword.get(compact(value)) || null; }

function supportedSameDemand(leftValue, rightValue, contextIndex) {
  const left = contextFor(leftValue, contextIndex);
  const right = contextFor(rightValue, contextIndex);
  if (!left || !right) return null;
  const sharedMarkers = [...left.markers].filter((marker) => right.markers.has(marker));
  const sharedQuestions = contextIndex.questions.filter((question) => compact(question.text).includes(compact(leftValue)) && compact(question.text).includes(compact(rightValue)));
  const explicitMarkers = sharedMarkers.filter((marker) => /(?:DEMAND_ANCHOR|SEARCH_ENTRANCE|INTENT_BRIDGE|EXPLICIT_REVIEW_TARGET|PRIMARY_DEMAND)/u.test(marker));
  if (!explicitMarkers.length && !sharedQuestions.length) return null;
  return { sharedMarkers: explicitMarkers, sharedQuestions };
}

export function interpretRelationshipCandidate(candidate, { leftKeyword, rightKeyword } = {}) {
  const relationType = candidate.relation === "FORMAT_VARIANT_CANDIDATE"
    ? "FORMAT_VARIANT"
    : candidate.relation === "RELATED_CANDIDATE"
      ? "RELATED_DEMAND"
      : candidate.relation === "SAME_DEMAND_CANDIDATE"
        ? "SAME_DEMAND_CANDIDATE"
        : candidate.relation === "DISTINCT_DEMAND"
          ? "DISTINCT_DEMAND"
          : "REVIEW_REQUIRED";
  return {
    ...candidate,
    relation_type: relationType,
    status: relationType === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "REVIEW_REQUIRED",
    left_keyword_id: leftKeyword?.keyword_ids?.[0] || null,
    right_keyword_id: rightKeyword?.keyword_ids?.[0] || null,
    interpretation_basis: candidate.relation === "FORMAT_VARIANT_CANDIDATE"
      ? "Whitespace or display-form difference only; same demand is not automatically confirmed."
      : candidate.relation === "RELATED_CANDIDATE"
        ? "Lexical relationship candidate; semantic demand equivalence requires review."
        : "Insufficient evidence for automatic semantic confirmation.",
  };
}

export function buildInterpretedSearchDemandCompression({ compression, integration = null, researchContext = null, now = new Date().toISOString() } = {}) {
  if (!compression?.research_session_id) throw new Error("SEARCH_DEMAND_COMPRESSION_REQUIRED");
  const map = keywordMap(integration, compression);
  const contextIndex = buildContextIndex(researchContext);
  const interpreted = [];
  const seenRelations = new Set();
  const formatPairs = [];
  for (const candidate of compression.relationship_candidates || []) {
    if (!["FORMAT_VARIANT_CANDIDATE", "RELATED_CANDIDATE", "SAME_DEMAND_CANDIDATE", "DISTINCT_DEMAND", "REVIEW_REQUIRED"].includes(candidate.relation)) continue;
    const key = pairKey(candidate.left_keyword, candidate.right_keyword);
    if (seenRelations.has(key)) continue;
    seenRelations.add(key);
    const leftKeyword = map.get(candidate.left_keyword);
    const rightKeyword = map.get(candidate.right_keyword);
    const support = candidate.relation === "RELATED_CANDIDATE" ? supportedSameDemand(candidate.left_keyword, candidate.right_keyword, contextIndex) : null;
    const result = interpretRelationshipCandidate({ ...candidate, source_keyword_ids: compression.lineage?.source_keyword_ids }, { leftKeyword, rightKeyword });
    if (support) {
      result.relation_type = "SAME_DEMAND_CANDIDATE";
      result.status = "SUPPORTED";
      result.interpretation_basis = {
        shared_reviewer_or_planner_markers: support.sharedMarkers,
        grounded_questions: support.sharedQuestions,
        rule: "Both expressions are explicitly connected by the supplied Planner/Reviewer research direction; this is not a Knowledge Node decision.",
      };
    }
    interpreted.push(result);
    if (result.relation_type === "FORMAT_VARIANT" || result.relation_type === "SAME_DEMAND_CANDIDATE") formatPairs.push({ candidate: result, leftKeyword, rightKeyword });
  }

  const clusters = [];
  const entrances = [];
  const clusteredIds = new Set();
  for (const { candidate, leftKeyword, rightKeyword } of formatPairs) {
    const left = memberMetadata(leftKeyword, candidate.left_keyword_id);
    const right = memberMetadata(rightKeyword, candidate.right_keyword_id);
    const members = [left, right].filter((member) => member.keyword_id);
    if (members.length < 2) continue;
    const memberKeywordIds = unique(members.flatMap((member) => member.keyword_ids));
    memberKeywordIds.forEach((id) => clusteredIds.add(id));
    const sourceEvidenceIds = unique(members.flatMap((member) => member.source_evidence_ids));
    const sourceMetricIds = unique(members.flatMap((member) => member.source_metric_ids));
    const researchTargetIds = unique(members.flatMap((member) => member.research_target_ids));
    const clusterId = `demand_cluster_${clusters.length + 1}`;
    clusters.push({
      cluster_id: clusterId,
      status: candidate.status === "SUPPORTED" && (sourceEvidenceIds.length || sourceMetricIds.length) ? "SUPPORTED" : "REVIEW_REQUIRED",
      demand_summary: candidate.relation_type === "SAME_DEMAND_CANDIDATE" ? `${left.keyword} / ${right.keyword} context-supported demand candidate` : `${left.keyword} / ${right.keyword} format-variant candidate`,
      member_keyword_ids: memberKeywordIds,
      representative_search_entrance_candidates: memberKeywordIds,
      research_target_ids: researchTargetIds,
      source_evidence_ids: sourceEvidenceIds,
      source_metric_ids: sourceMetricIds,
      grounded_question_links: [],
      coverage: coverageForMembers(members),
      provenance: { collection_ids: unique(members.flatMap((member) => member.collection_ids)), source_evidence_ids: sourceEvidenceIds, source_metric_ids: sourceMetricIds },
      interpretation_basis: [candidate.relation_id, candidate.interpretation_basis],
    });
    for (const member of members) {
      entrances.push({
        candidate_id: `${clusterId}_${member.keyword_id}`,
        keyword_id: member.keyword_id,
        keyword: member.keyword,
        cluster_id: clusterId,
        status: "REVIEW_REQUIRED",
        selection_basis: "FORMAT_VARIANT_CANDIDATE; no ranking or automatic representative selection",
        source_evidence_ids: member.source_evidence_ids,
        source_metric_ids: member.source_metric_ids,
        provenance: { research_target_ids: member.research_target_ids, collection_ids: member.collection_ids },
      });
    }
  }

  const allKeywordIds = unique(compression.lineage?.source_keyword_ids || []);
  const unclustered = allKeywordIds.filter((id) => !clusteredIds.has(id));
  const sourceIntegration = compression.source_integration || {};
  return {
    compression_id: `${compression.compression_id}_interpreted`,
    compression_version: null,
    source_compression_version: compression.compression_version || 1,
    research_session_id: compression.research_session_id,
    created_at: now,
    source_integration: integration ? {
      integration_version: integration.integration_version || null,
      target_count: integration.target_count,
      collection_count: integration.collection_count,
      unique_keyword_count: integration.unique_keyword_count,
      evidence_count: integration.evidence_count,
      metric_count: integration.metric_count,
    } : sourceIntegration,
    interpreted_relationships: interpreted,
    relationship_summary: {
      total: interpreted.length,
      exact_same: interpreted.filter((item) => item.relation_type === "EXACT_SAME").length,
      format_variant: interpreted.filter((item) => item.relation_type === "FORMAT_VARIANT").length,
      same_demand_candidate: interpreted.filter((item) => item.relation_type === "SAME_DEMAND_CANDIDATE").length,
      related_demand: interpreted.filter((item) => item.relation_type === "RELATED_DEMAND").length,
      distinct_demand: interpreted.filter((item) => item.relation_type === "DISTINCT_DEMAND").length,
      review_required: interpreted.filter((item) => item.status === "REVIEW_REQUIRED").length,
    },
    demand_clusters: clusters,
    representative_entrance_candidates: entrances,
    grounded_question_links: interpreted.flatMap((item) => item.status === "SUPPORTED" && item.interpretation_basis?.grounded_questions ? item.interpretation_basis.grounded_questions.map((question) => ({ relation_id: item.relation_id, status: "SUPPORTED", source_type: question.source_type, line_number: question.line_number, question: question.text })) : []),
    clustered_keyword_ids: [...clusteredIds],
    unclustered_keyword_ids: unclustered,
    coverage_summary: compression.coverage_summary || {},
    lineage: {
      source_keyword_ids: allKeywordIds,
      source_evidence_ids: unique(compression.lineage?.source_evidence_ids || []),
      source_metric_ids: unique(compression.lineage?.source_metric_ids || []),
      raw_references: unique(compression.lineage?.raw_references || []),
      source_compression_id: compression.compression_id,
      context_artifact_reference: integration?.context_artifact_reference || null,
      source_research_session_id: integration?.source_research_session_id || null,
      source_integration_reference: integration?.source_integration_reference || null,
    },
    interpretation_policy: "Context-supported SAME_DEMAND_CANDIDATE remains a Planner/Reviewer-grounded candidate; no Knowledge Node decision is made.",
    interpretation_context: {
      supplied: Boolean(researchContext),
      extracted_seed_count: [...contextIndex.byKeyword.values()].length,
      grounded_question_count: contextIndex.questions.length,
    },
  };
}

export async function createInterpretedSearchDemandCompression({ compression, integration = null, researchContext = null, now } = {}) {
  return saveSearchDemandCompression(buildInterpretedSearchDemandCompression({ compression, integration, researchContext, now }));
}
