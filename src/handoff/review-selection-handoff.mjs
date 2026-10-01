import { validateSearchEvidencePack } from "../pack/search-evidence-pack-builder.mjs";

export class ReviewHandoffContractError extends Error {
  constructor(violations) { super(`REVIEW_HANDOFF_CONTRACT_INVALID: ${violations.join(", ")}`); this.code = "REVIEW_HANDOFF_CONTRACT_INVALID"; this.violations = violations; }
}

const clone = (value) => JSON.parse(JSON.stringify(value));

function createSelectedCandidate(candidate, selection, pack) {
  const evidenceById = new Map(pack.evidence.map((item) => [item.evidence_id, item]));
  const metricById = new Map(pack.derived_metrics.map((item) => [item.metric_id, item]));
  const runsById = new Map(pack.source_runs.map((item) => [item.source_run_id, item]));
  const evidence = candidate.evidence_ids.map((id) => evidenceById.get(id)).filter(Boolean);
  const metric = candidate.metric_ids.map((id) => metricById.get(id)).find(Boolean) || null;
  const webEvidence = evidence.find((item) => item.evidence_type === "SEARCH_RESULT_TOTAL") || null;
  return {
    keyword_id: candidate.keyword_id,
    keyword: candidate.raw_keyword,
    role: candidate.keyword_role,
    monthly_search_volume_pc: candidate.monthly_search_volume_pc,
    monthly_search_volume_mobile: candidate.monthly_search_volume_mobile,
    total_search_volume: metric?.value ?? candidate.total_search_volume ?? null,
    total_search_volume_status: metric?.status || candidate.total_search_volume_status,
    provider_competition_value: candidate.provider_competition_value,
    provider_competition_source: candidate.provider_competition_source,
    web_search_result_total: webEvidence ? { value: webEvidence.value, status: webEvidence.status, evidence_id: webEvidence.evidence_id } : null,
    web_status: candidate.coverage?.web_search_result_total || "NOT_AVAILABLE",
    source_providers: [...new Set(candidate.source_run_ids.map((id) => runsById.get(id)?.provider).filter(Boolean))],
    source_ids: [...new Set(candidate.source_run_ids.map((id) => runsById.get(id)?.source_id).filter(Boolean))],
    decision: selection.decision,
    reviewer_note: selection.reviewer_note || "",
    evidence_ids: clone(candidate.evidence_ids),
    metric_ids: clone(candidate.metric_ids),
    source_run_ids: clone(candidate.source_run_ids),
    raw_references: clone(candidate.raw_references),
  };
}

export function buildGeoHandoffFromReview(pack, review, { createdAt = new Date().toISOString() } = {}) {
  const violations = [];
  if (!pack || !review) violations.push("PACK_AND_REVIEW_REQUIRED");
  if (pack && !validateSearchEvidencePack(pack).valid) violations.push("PACK_INVALID");
  if (review && review.collection_id !== pack?.metadata?.collection_id) violations.push("COLLECTION_ID_MISMATCH");
  if (review && !Number.isInteger(Number(review.review_version))) violations.push("REVIEW_VERSION_INVALID");
  if (violations.length) throw new ReviewHandoffContractError(violations);
  const selections = new Map(review.reviewer_selection.map((item) => [item.keyword_id, item]));
  const candidates = pack.keywords.filter((candidate) => selections.get(candidate.keyword_id)?.decision === "SELECTED");
  return {
    handoff_version: null,
    collection_id: pack.metadata.collection_id,
    pack_version: pack.metadata.pack_version,
    review_version: Number(review.review_version),
    created_at: createdAt,
    hub_seed: clone(pack.hub_seed),
    selected_candidates: candidates.map((candidate) => createSelectedCandidate(candidate, selections.get(candidate.keyword_id), pack)),
  };
}
