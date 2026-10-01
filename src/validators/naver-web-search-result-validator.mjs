export function validateNaverWebSearchEvidence(evidence) {
  const errors = [];
  if (!Number.isInteger(evidence.value) || evidence.value < 0) errors.push("total must be a non-negative integer.");
  if (!evidence.query) errors.push("query is required.");
  if (!evidence.provider) errors.push("provider is required.");
  if (evidence.search_vertical !== "WEB") errors.push("search_vertical must be WEB.");
  if (!evidence.metadata?.raw_reference) errors.push("RAW_REFERENCE is required.");
  if (!evidence.collection_id) errors.push("collection_id is required.");
  if (!evidence.evidence_id) errors.push("evidence_id is required.");
  return { valid: errors.length === 0, errors };
}
