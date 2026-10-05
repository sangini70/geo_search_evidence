import { projectConfirmedCollectionRequests } from "./research-session.mjs";

function sourceStatus(result, sourceId) {
  const sourceRuns = result?.sourceRuns || result?.snapshot?.source_runs || [];
  return sourceRuns.find((run) => run.source_id === sourceId)?.status || "NOT_AVAILABLE";
}

function countOrUnavailable(value) {
  return Array.isArray(value) ? value.length : null;
}

export async function executeResearchSessionCollections({ researchSession, collectionExecutor } = {}) {
  if (!researchSession?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  if (typeof collectionExecutor !== "function") throw new Error("COLLECTION_EXECUTOR_REQUIRED");

  const projection = projectConfirmedCollectionRequests(researchSession);
  const results = [];
  for (const request of projection.requests) {
    try {
      const collection = await collectionExecutor(request);
      if (!collection?.collectionId) throw new Error("COLLECTION_ID_NOT_RETURNED");
      const collectionStatus = collection.collectionStatus || collection.snapshot?.status || "UNKNOWN";
      results.push({
        research_session_id: request.research_session_id,
        research_target_id: request.research_target_id,
        search_seed: request.search_seed,
        source_types: [...request.source_types],
        source_references: request.source_references.map((reference) => ({ ...reference })),
        reviewer_stages: [...request.reviewer_stages],
        reason: request.reason,
        collection_id: collection.collectionId,
        collection_status: collectionStatus,
        search_ads_status: sourceStatus(collection, "NAVER_SEARCH_ADS"),
        web_status: sourceStatus(collection, "NAVER_API_HUB_WEBKR"),
        candidates: countOrUnavailable(collection.keywords || collection.snapshot?.keywords),
        evidence: countOrUnavailable(collection.evidence || collection.snapshot?.evidence),
        metrics: countOrUnavailable(collection.derivedMetrics || collection.snapshot?.derived_metrics),
      });
    } catch (error) {
      results.push({
        research_session_id: request.research_session_id,
        research_target_id: request.research_target_id,
        search_seed: request.search_seed,
        source_types: [...request.source_types],
        source_references: request.source_references.map((reference) => ({ ...reference })),
        reviewer_stages: [...request.reviewer_stages],
        reason: request.reason,
        collection_id: null,
        collection_status: "FAILED",
        search_ads_status: "NOT_AVAILABLE",
        web_status: "NOT_AVAILABLE",
        candidates: null,
        evidence: null,
        metrics: null,
        error: error?.message || "COLLECTION_FAILED",
      });
    }
  }

  const summary = {
    total_targets: projection.count,
    completed_count: results.length,
    success_count: results.filter((result) => result.collection_status === "SUCCESS").length,
    partial_success_count: results.filter((result) => result.collection_status === "PARTIAL_SUCCESS").length,
    failed_count: results.filter((result) => result.collection_status === "FAILED").length,
  };
  return { research_session_id: researchSession.research_session_id, summary, results };
}
