import { readCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { saveResearchSessionIntegration } from "../repositories/research-session-integration-repository.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }
function clone(value) { return value == null ? value : structuredClone(value); }

export async function buildResearchSessionIntegration({ researchSessionId, targetResults = [], snapshotReader = readCollectionSnapshot, researchContextReference = null, now = new Date().toISOString() } = {}) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  const sessionKeywords = new Map();
  const collectionResults = [];
  const rawReferences = [];
  let evidenceCount = 0;
  let metricCount = 0;

  for (const target of targetResults) {
    const collectionId = target.collection_id || null;
    const collectionStatus = target.collection_status || "FAILED";
    const collectionResult = {
      research_target_id: target.research_target_id,
      research_session_id: target.research_session_id || researchSessionId,
      research_plan_id: target.research_plan_id || target.snapshot_research_context?.research_plan_id || null,
      initial_discovery_id: target.initial_discovery_id || target.snapshot_research_context?.initial_discovery_id || null,
      research_plan_item_id: target.research_plan_item_id || target.snapshot_research_context?.research_plan_item_id || null,
      research_plan_item_ids: [...(target.research_plan_item_ids || target.snapshot_research_context?.research_plan_item_ids || [])],
      collection_id: collectionId,
      collection_status: collectionStatus,
      search_seed: target.search_seed || target.snapshot_research_context?.search_seed || null,
      normalized_search_seed: target.normalized_search_seed || target.snapshot_research_context?.normalized_search_seed || null,
      reviewer_stages: [...(target.reviewer_stages || target.snapshot_research_context?.reviewer_stages || [])],
      source_references: clone(target.source_references || target.snapshot_research_context?.source_references || []),
      context_references: clone(target.context_references || target.snapshot_research_context?.context_references || []),
      source_runs: clone(target.source_runs || []),
      evidence_availability: {},
    };
    collectionResults.push(collectionResult);
    if (!collectionId) continue;
    let snapshot;
    try { snapshot = await snapshotReader(collectionId, { snapshotVersion: 1 }); }
    catch { continue; }
    const evidence = snapshot.evidence || [];
    const metrics = snapshot.derived_metrics || [];
    collectionResult.source_runs = clone(snapshot.source_runs || target.source_runs || []);
    rawReferences.push(...(snapshot.raw_references || []), ...(snapshot.source_runs || []).map((run) => run.raw_reference).filter(Boolean));
    collectionResult.evidence_ids = evidence.map((item) => item.evidence_id).filter(Boolean);
    collectionResult.metric_ids = metrics.map((item) => item.metric_id).filter(Boolean);
    collectionResult.evidence_availability = {
      evidence_types: unique(evidence.map((item) => item.evidence_type)),
      metric_types: unique(metrics.map((item) => item.metric_type)),
      source_statuses: Object.fromEntries((snapshot.source_runs || []).map((run) => [run.source_id, run.status])),
      evidence_count: evidence.length,
      metric_count: metrics.length,
    };
    evidenceCount += evidence.length;
    metricCount += metrics.length;
    const evidenceByKeyword = new Map();
    for (const item of evidence) {
      if (!evidenceByKeyword.has(item.keyword_id)) evidenceByKeyword.set(item.keyword_id, []);
      evidenceByKeyword.get(item.keyword_id).push(item.evidence_id);
    }
    const metricsByKeyword = new Map();
    for (const item of metrics) {
      if (!metricsByKeyword.has(item.keyword_id)) metricsByKeyword.set(item.keyword_id, []);
      metricsByKeyword.get(item.keyword_id).push(item.metric_id);
    }
    for (const keyword of snapshot.keywords || []) {
      const normalizedKeyword = keyword.normalized_keyword;
      if (!normalizedKeyword) continue;
      const existing = sessionKeywords.get(normalizedKeyword) || { normalized_keyword: normalizedKeyword, keyword_ids: [], research_target_ids: [], collection_ids: [], source_evidence_ids: [], source_metric_ids: [] };
      existing.keyword_ids = unique([...existing.keyword_ids, keyword.keyword_id]);
      existing.research_target_ids = unique([...existing.research_target_ids, target.research_target_id]);
      existing.collection_ids = unique([...existing.collection_ids, collectionId]);
      existing.source_evidence_ids = unique([...existing.source_evidence_ids, ...(evidenceByKeyword.get(keyword.keyword_id) || [])]);
      existing.source_metric_ids = unique([...existing.source_metric_ids, ...(metricsByKeyword.get(keyword.keyword_id) || [])]);
      sessionKeywords.set(normalizedKeyword, existing);
    }
  }

  return {
    integration_id: `research_session_integration_${researchSessionId}`,
    research_session_id: researchSessionId,
    created_at: now,
    target_count: collectionResults.length,
    collection_count: unique(collectionResults.map((result) => result.collection_id)).length,
    unique_keyword_count: sessionKeywords.size,
    evidence_count: evidenceCount,
    metric_count: metricCount,
    collection_results: collectionResults,
    session_keywords: [...sessionKeywords.values()],
    research_context_reference: researchContextReference,
    context_artifact_reference: researchContextReference,
    lineage: {
      source_keyword_ids: unique([...sessionKeywords.values()].flatMap((keyword) => keyword.keyword_ids)),
      source_evidence_ids: unique([...sessionKeywords.values()].flatMap((keyword) => keyword.source_evidence_ids)),
      source_metric_ids: unique([...sessionKeywords.values()].flatMap((keyword) => keyword.source_metric_ids)),
      raw_references: unique(rawReferences),
    },
  };
}

export async function createResearchSessionIntegration(options = {}) {
  const integration = await buildResearchSessionIntegration(options);
  return saveResearchSessionIntegration(integration);
}
