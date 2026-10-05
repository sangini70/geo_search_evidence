function copyReferences(references = []) {
  return references.map((reference) => ({ ...reference }));
}

function createResearchSessionId() {
  return `research_session_${Date.now()}`;
}

export function createResearchSession({ hubContext = {}, researchTargets = [], researchSessionId = createResearchSessionId(), createdAt = new Date().toISOString() } = {}) {
  return {
    research_session_id: researchSessionId,
    hub_context: { ...hubContext },
    created_at: createdAt,
    research_targets: researchTargets.map((target) => ({
      research_target_id: target.research_target_id,
      keyword: target.keyword,
      decision: target.decision,
      source_types: [...(target.source_types || [])],
      source_references: copyReferences(target.source_references || []),
      reviewer_stages: [...(target.reviewer_stages || [])],
      reason: target.reason || "",
      status: target.collection_status || "READY",
    })),
  };
}

export function projectCollectionRequests(researchSession) {
  const requests = (researchSession?.research_targets || [])
    .filter((target) => target.decision !== "EXCLUDED")
    .map((target) => ({
      research_session_id: researchSession.research_session_id,
      research_target_id: target.research_target_id,
      search_seed: target.keyword,
      source_types: [...(target.source_types || [])],
      source_references: copyReferences(target.source_references || []),
      reviewer_stages: [...(target.reviewer_stages || [])],
      reason: target.reason || "",
      status: "READY",
    }));
  return { status: requests.length > 0 ? "READY" : "NOT_READY", count: requests.length, requests };
}

export function projectConfirmedCollectionRequests(researchSession) {
  const requests = (researchSession?.research_targets || [])
    .filter((target) => target.decision === "CONFIRMED")
    .map((target) => ({
      research_session_id: researchSession.research_session_id,
      research_target_id: target.research_target_id,
      search_seed: target.keyword,
      source_types: [...(target.source_types || [])],
      source_references: copyReferences(target.source_references || []),
      reviewer_stages: [...(target.reviewer_stages || [])],
      reason: target.reason || "",
      status: "READY",
    }));
  return { status: requests.length > 0 ? "READY" : "NOT_READY", count: requests.length, requests };
}
