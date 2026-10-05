import { readFile } from "node:fs/promises";
import { readResearchSessionContext } from "../repositories/research-session-context-repository.mjs";
import { readSearchDemandCompression } from "../repositories/search-demand-compression-repository.mjs";
import { saveResearchSessionIntegration } from "../repositories/research-session-integration-repository.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }

function keywordNames(compression) {
  const names = new Map();
  for (const candidate of compression.relationship_candidates || []) {
    const match = String(candidate.relation_id || "").match(/^relation_(\d+)_(\d+)$/u);
    if (match) {
      names.set(Number(match[1]), candidate.left_keyword);
      names.set(Number(match[2]), candidate.right_keyword);
    }
  }
  return names;
}

export async function buildContextAwareEvidenceReuseIntegration({ contextSessionId, sourceSessionId, sourceCompressionVersion = 1, now = new Date().toISOString() } = {}) {
  const contextArtifact = await readResearchSessionContext(contextSessionId);
  if (!contextArtifact) throw new Error("RESEARCH_SESSION_CONTEXT_NOT_FOUND");
  const sourceCompression = await readSearchDemandCompression(sourceSessionId, { compressionVersion: sourceCompressionVersion });
  if (!sourceCompression) throw new Error("SOURCE_COMPRESSION_NOT_FOUND");
  const keywordNamesByIndex = keywordNames(sourceCompression);
  const sourceKeywordIds = sourceCompression.lineage?.source_keyword_ids || [];
  const sourceReferences = unique(sourceCompression.lineage?.raw_references || []);
  const collectionIds = unique(sourceReferences.map((value) => String(value).match(/data\/raw\/(col_[^/]+)\//u)?.[1]).filter(Boolean));
  const integration = {
    integration_id: `research_session_integration_${contextSessionId}_from_${sourceSessionId}`,
    research_session_id: contextSessionId,
    created_at: now,
    target_count: sourceCompression.source_integration?.target_count || 0,
    collection_count: sourceCompression.source_integration?.collection_count || collectionIds.length,
    unique_keyword_count: sourceCompression.source_integration?.unique_keyword_count || sourceKeywordIds.length,
    evidence_count: sourceCompression.source_integration?.evidence_count || sourceCompression.lineage?.source_evidence_ids?.length || 0,
    metric_count: sourceCompression.source_integration?.metric_count || sourceCompression.lineage?.source_metric_ids?.length || 0,
    collection_results: collectionIds.map((collectionId) => ({ collection_id: collectionId, collection_status: "SOURCE_ARTIFACT_REFERENCE" })),
    session_keywords: sourceKeywordIds.map((keywordId, index) => ({ keyword_ids: [keywordId], normalized_keyword: keywordNamesByIndex.get(index + 1) || null, research_target_ids: [], collection_ids: [], source_evidence_ids: [], source_metric_ids: [] })),
    context_artifact_reference: { context_id: contextArtifact.context_id, context_version: contextArtifact.context_version, relative_path: `data/research-sessions/${contextSessionId}/context-v${contextArtifact.context_version}.json` },
    source_research_session_id: sourceSessionId,
    source_integration_reference: { artifact_type: "SEARCH_DEMAND_COMPRESSION", compression_version: sourceCompressionVersion, relative_path: `data/research-sessions/${sourceSessionId}/compression-v${sourceCompressionVersion}.json` },
    source_collection_ids: collectionIds,
    lineage: { source_keyword_ids: sourceKeywordIds, source_evidence_ids: unique(sourceCompression.lineage?.source_evidence_ids || []), source_metric_ids: unique(sourceCompression.lineage?.source_metric_ids || []), raw_references: sourceReferences },
  };
  return integration;
}

export async function createContextAwareEvidenceReuseIntegration(options = {}) {
  return saveResearchSessionIntegration(await buildContextAwareEvidenceReuseIntegration(options));
}
