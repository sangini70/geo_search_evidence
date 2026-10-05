function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalizeSearchSeed(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

function requestLineage(request) {
  return {
    research_session_id: request.research_session_id,
    research_plan_id: request.research_plan_id,
    initial_discovery_id: request.initial_discovery_id,
    research_plan_item_id: request.research_plan_item_id,
    research_plan_item_ids: [...(request.research_plan_item_ids || [request.research_plan_item_id])],
    search_seed: request.search_seed,
    normalized_search_seed: request.normalized_search_seed || normalizeSearchSeed(request.search_seed),
    evidence_to_collect: clone(request.evidence_to_collect || []),
    selection_reason: [...(request.selection_reason || [])],
    context_references: clone(request.context_references || []),
    related_planner_hypotheses: clone(request.related_planner_hypotheses || []),
    related_reviewer_direction: clone(request.related_reviewer_direction || []),
    reviewer_stages: [...(request.reviewer_stages || [])],
    source_references: clone(request.source_references || []),
  };
}

function existingCollectionMatch(collection, request) {
  if (collection.research_session_id && collection.research_session_id !== request.research_session_id) return false;
  const collectionSeed = collection.normalized_search_seed || normalizeSearchSeed(collection.search_seed || collection.keyword);
  return collectionSeed === request.normalized_search_seed;
}

function statusOfCollection(collection) {
  return collection.collection_status || collection.collectionStatus || collection.snapshot?.status || collection.status || "UNKNOWN";
}

function resultStatus(results) {
  if (results.length === 0 || results.some((result) => result.request_status === "REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  if (results.every((result) => ["SUCCESS", "REUSED"].includes(result.request_status))) return "SUCCESS";
  if (results.every((result) => result.request_status === "FAILED")) return "FAILED";
  return "PARTIAL_SUCCESS";
}

async function findExisting({ request, existingCollections, findExistingCollection }) {
  if (typeof findExistingCollection === "function") return findExistingCollection(request);
  return existingCollections.find((collection) => existingCollectionMatch(collection, request)) || null;
}

function buildResult(request, patch = {}) {
  const result = { ...requestLineage(request), ...patch };
  result.status = result.request_status || "READY";
  return result;
}

export async function runInitialDiscovery({ collectionRequestProjection, collectionExecutor, existingCollections = [], findExistingCollection = null, runId = `initial_discovery_run_${Date.now()}`, now = new Date().toISOString() } = {}) {
  if (!collectionRequestProjection?.collection_request_projection_id) throw new Error("COLLECTION_REQUEST_PROJECTION_REQUIRED");
  const requests = collectionRequestProjection.requests || [];
  if (requests.some((request) => request.status !== "READY")) throw new Error("INITIAL_DISCOVERY_REQUEST_NOT_READY");
  if (requests.length > 0 && typeof collectionExecutor !== "function") throw new Error("COLLECTION_EXECUTOR_REQUIRED");

  const startedAt = now;
  const requestResults = [];
  for (const request of requests) {
    const existing = await findExisting({ request, existingCollections, findExistingCollection });
    if (existing) {
      const existingStatus = statusOfCollection(existing);
      if (existingStatus === "SUCCESS") {
        requestResults.push(buildResult(request, {
          request_status: "REUSED",
          collection_id: existing.collection_id || existing.collectionId,
          collection_status: "SUCCESS",
          reused: true,
          source_runs: clone(existing.source_runs || existing.snapshot?.source_runs || []),
          snapshot_research_context: clone(existing.snapshot?.research_context),
        }));
      } else if (["FAILED", "PARTIAL_SUCCESS"].includes(existingStatus)) {
        requestResults.push(buildResult(request, {
          request_status: "REVIEW_REQUIRED",
          collection_id: existing.collection_id || existing.collectionId || null,
          collection_status: existingStatus,
          reused: false,
          error: "EXISTING_COLLECTION_REQUIRES_REVIEW",
          source_runs: clone(existing.source_runs || existing.snapshot?.source_runs || []),
          snapshot_research_context: clone(existing.snapshot?.research_context),
        }));
      }
      continue;
    }

    try {
      const collection = await collectionExecutor(request);
      if (!collection?.collectionId) throw new Error("COLLECTION_ID_NOT_RETURNED");
      const collectionStatus = statusOfCollection(collection);
      requestResults.push(buildResult(request, {
        request_status: collectionStatus,
        collection_id: collection.collectionId,
        collection_status: collectionStatus,
        reused: false,
        source_runs: clone(collection.sourceRuns || collection.source_runs || collection.snapshot?.source_runs || []),
        snapshot_research_context: clone(collection.snapshot?.research_context),
      }));
    } catch (error) {
      requestResults.push(buildResult(request, {
        request_status: "FAILED",
        collection_id: null,
        collection_status: "FAILED",
        reused: false,
        error: error?.message || "COLLECTION_FAILED",
      }));
    }
  }

  const completedAt = new Date().toISOString();
  const collectionIds = requestResults.map((result) => result.collection_id).filter(Boolean);
  const reusedCollectionIds = requestResults.filter((result) => result.reused).map((result) => result.collection_id).filter(Boolean);
  return {
    run_id: runId,
    research_session_id: collectionRequestProjection.research_session_id,
    research_plan_id: collectionRequestProjection.research_plan_id,
    initial_discovery_id: collectionRequestProjection.initial_discovery_id,
    started_at: startedAt,
    completed_at: completedAt,
    request_results: requestResults,
    collection_ids: [...new Set(collectionIds)],
    reused_collection_ids: [...new Set(reusedCollectionIds)],
    status: resultStatus(requestResults),
  };
}
