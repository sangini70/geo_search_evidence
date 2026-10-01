const TOTAL_SEARCH_VOLUME_FORMULA = "monthly_search_volume_total = monthly_search_volume_pc + monthly_search_volume_mobile";
const TOTAL_SEARCH_VOLUME_FORMULA_VERSION = "total_search_volume_v1";
const TOTAL_SEARCH_VOLUME_TYPE = "MONTHLY_SEARCH_VOLUME_TOTAL";

function isSpecialSearchVolume(value) {
  return typeof value === "string" && /^<\s*10$/.test(value.trim());
}

function findEvidence(record, evidenceType) {
  return record.evidence?.find((evidence) => evidence.evidence_type === evidenceType) || null;
}

export function calculateTotalSearchVolume(record, idGenerator, calculatedAt = new Date().toISOString()) {
  const pcEvidence = findEvidence(record, "MONTHLY_SEARCH_VOLUME_PC");
  const mobileEvidence = findEvidence(record, "MONTHLY_SEARCH_VOLUME_MOBILE");
  if (!pcEvidence || !mobileEvidence) {
    throw new Error("TOTAL_SEARCH_VOLUME_INPUT_EVIDENCE_MISSING");
  }

  const inputEvidenceIds = [pcEvidence.evidence_id, mobileEvidence.evidence_id];
  const base = {
    metric_id: idGenerator.nextMetricId(),
    collection_id: record.collection_id,
    keyword_id: record.keyword_id,
    metric_type: TOTAL_SEARCH_VOLUME_TYPE,
    unit: null,
    formula: TOTAL_SEARCH_VOLUME_FORMULA,
    formula_version: TOTAL_SEARCH_VOLUME_FORMULA_VERSION,
    input_evidence_ids: inputEvidenceIds,
    calculated_at: calculatedAt,
  };

  if (isSpecialSearchVolume(pcEvidence.raw_value) || isSpecialSearchVolume(mobileEvidence.raw_value)) {
    return { ...base, value: null, status: "NOT_CALCULABLE" };
  }

  if (pcEvidence.status === "MISSING" || pcEvidence.status === "UNAVAILABLE" || mobileEvidence.status === "MISSING" || mobileEvidence.status === "UNAVAILABLE") {
    return { ...base, value: null, status: "NOT_AVAILABLE" };
  }

  if (pcEvidence.status !== "SUCCESS" || mobileEvidence.status !== "SUCCESS" || !Number.isFinite(pcEvidence.value) || !Number.isFinite(mobileEvidence.value)) {
    throw new Error("TOTAL_SEARCH_VOLUME_INPUT_VALIDATION_FAILED");
  }

  return { ...base, value: pcEvidence.value + mobileEvidence.value, status: "EXACT" };
}

export const totalSearchVolumeContract = Object.freeze({
  metric_type: TOTAL_SEARCH_VOLUME_TYPE,
  formula: TOTAL_SEARCH_VOLUME_FORMULA,
  formula_version: TOTAL_SEARCH_VOLUME_FORMULA_VERSION,
});
