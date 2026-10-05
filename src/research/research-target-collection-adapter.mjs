export async function executeSingleResearchTargetCollection({ collectionRequests, researchTargetId, collectionExecutor } = {}) {
  if (!Array.isArray(collectionRequests) || collectionRequests.length === 0) throw new Error("RESEARCH_TARGET_NOT_READY");
  if (typeof collectionExecutor !== "function") throw new Error("COLLECTION_EXECUTOR_REQUIRED");
  const selected = collectionRequests.filter((request) => request.research_target_id === researchTargetId);
  if (selected.length !== 1) throw new Error("SINGLE_RESEARCH_TARGET_REQUIRED");
  const request = selected[0];
  if (request.status !== "READY") throw new Error("RESEARCH_TARGET_NOT_READY");
  const result = await collectionExecutor(request);
  if (!result?.collectionId) throw new Error("COLLECTION_ID_NOT_RETURNED");
  return {
    research_session_id: request.research_session_id,
    research_target_id: request.research_target_id,
    search_seed: request.search_seed,
    source_types: [...(request.source_types || [])],
    source_references: (request.source_references || []).map((reference) => ({ ...reference })),
    reviewer_stages: [...(request.reviewer_stages || [])],
    reason: request.reason || "",
    collection_id: result.collectionId,
    collection_status: result.collectionStatus || result.snapshot?.status || null,
  };
}
