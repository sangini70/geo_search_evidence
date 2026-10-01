export const NAVER_FIELD_MAPPING = Object.freeze({
  relKeyword: Object.freeze({ normalized: "keyword", evidenceType: "RELATED_KEYWORD" }),
  monthlyPcQcCnt: Object.freeze({ normalized: "monthly_search_pc", evidenceType: "MONTHLY_SEARCH_VOLUME_PC" }),
  monthlyMobileQcCnt: Object.freeze({ normalized: "monthly_search_mobile", evidenceType: "MONTHLY_SEARCH_VOLUME_MOBILE" }),
  compIdx: Object.freeze({ normalized: "provider_competition", evidenceType: "PROVIDER_COMPETITION_VALUE" }),
});

function normalizeSearchVolumeValue(rawValue) {
  if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue >= 0) {
    return { value: rawValue, status: "SUCCESS", normalization: "NUMBER" };
  }
  if (typeof rawValue === "string" && /^\d+$/.test(rawValue.trim())) {
    return { value: Number(rawValue), status: "SUCCESS", normalization: "NUMERIC_STRING" };
  }
  if (typeof rawValue === "string" && /^<\s*10$/.test(rawValue.trim())) {
    return { value: null, status: "SUCCESS", normalization: "SPECIAL_VALUE_UNCONVERTED" };
  }
  return { value: null, status: "PARSE_FAILED", normalization: "UNSUPPORTED_VALUE" };
}

function fieldEvidence({ evidenceType, value, rawValue, status, metadata }) {
  return { evidence_type: evidenceType, evidence_layer: "NORMALIZED", value, raw_value: rawValue, status, metadata };
}

export function normalizeNaverRawSnapshot(snapshot, rawReference, options = {}) {
  const rows = snapshot?.raw_payload?.keywordList;
  const metadata = snapshot?.metadata;
  if (!Array.isArray(rows)) {
    return { records: [], errors: [{ error_type: "PARSE_ERROR", message: "RAW keywordList is not an array." }], total: 0, success: 0, failed: 0 };
  }

  const records = [];
  const errors = [];
  const collectionId = options.collectionId || rawReference.match(/col_[^/\\.]+/)?.[0] || null;
  const idGenerator = options.idGenerator;
  const keywordRegistry = options.keywordRegistry;
  const sourceRunId = options.sourceRunId || metadata?.source_run_id || null;
  for (const [index, row] of rows.entries()) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      errors.push({ error_type: "PARSE_ERROR", message: "RAW keywordList item is not an object.", item_index: index });
      continue;
    }
    const pc = normalizeSearchVolumeValue(row.monthlyPcQcCnt);
    const mobile = normalizeSearchVolumeValue(row.monthlyMobileQcCnt);
    const keyword = row.relKeyword;
    const competition = row.compIdx;
    const keywordStatus = typeof keyword === "string" && keyword.trim() ? "SUCCESS" : "PARSE_FAILED";
    const competitionStatus = typeof competition === "string" && competition.trim() ? "SUCCESS" : "PARSE_FAILED";
    const normalizationStatus = [keywordStatus, pc.status, mobile.status, competitionStatus].every((status) => status === "SUCCESS") ? "SUCCESS" : "PARSE_FAILED";
    const keywordRecord = keywordRegistry?.register({
      normalizedKeyword: keyword,
      rawKeyword: keyword,
      keywordRole: keyword === options.hubSeedKeyword ? "HUB_SEED" : "RELATED_KEYWORD",
      discoveredFrom: keyword === options.hubSeedKeyword ? null : options.hubSeedKeyword ? keywordRegistry.find(options.hubSeedKeyword)?.keyword_id || null : null,
      sourceId: metadata?.source || null,
      sourceRunId,
      status: keywordStatus === "SUCCESS" ? "VALID" : "INVALID",
    });
    const keywordId = keywordRecord?.keyword_id || idGenerator?.nextKeywordId() || null;
    const evidence = idGenerator ? [
      { evidence_id: idGenerator.nextEvidenceId(), collection_id: collectionId, keyword_id: keywordId, evidence_type: NAVER_FIELD_MAPPING.monthlyPcQcCnt.evidenceType, evidence_layer: "NORMALIZED", source_id: metadata?.source, source_type: "OFFICIAL_API", provider: metadata?.provider, collection_method: "API", collected_at: metadata?.collected_at, status: pc.status, value: pc.value, raw_value: row.monthlyPcQcCnt ?? null, unit: null, metadata: { provider_field: "monthlyPcQcCnt", raw_reference: rawReference, normalization: pc.normalization } },
      { evidence_id: idGenerator.nextEvidenceId(), collection_id: collectionId, keyword_id: keywordId, evidence_type: NAVER_FIELD_MAPPING.monthlyMobileQcCnt.evidenceType, evidence_layer: "NORMALIZED", source_id: metadata?.source, source_type: "OFFICIAL_API", provider: metadata?.provider, collection_method: "API", collected_at: metadata?.collected_at, status: mobile.status, value: mobile.value, raw_value: row.monthlyMobileQcCnt ?? null, unit: null, metadata: { provider_field: "monthlyMobileQcCnt", raw_reference: rawReference, normalization: mobile.normalization } },
      { evidence_id: idGenerator.nextEvidenceId(), collection_id: collectionId, keyword_id: keywordId, evidence_type: NAVER_FIELD_MAPPING.compIdx.evidenceType, evidence_layer: "NORMALIZED", source_id: metadata?.source, source_type: "OFFICIAL_API", provider: metadata?.provider, collection_method: "API", collected_at: metadata?.collected_at, status: competitionStatus, value: typeof competition === "string" ? competition : competition ?? null, raw_value: competition ?? null, unit: null, metadata: { provider_field: "compIdx", provider_metric_name: "compIdx", raw_reference: rawReference } },
    ] : [];
    records.push({
      item_index: index,
      raw_reference: rawReference,
      provenance: metadata,
      provider: metadata?.provider,
      source_id: metadata?.source,
      collection_id: collectionId,
      keyword_id: keywordId,
      evidence,
      normalization_status: normalizationStatus,
      fields: {
        keyword: fieldEvidence({ evidenceType: NAVER_FIELD_MAPPING.relKeyword.evidenceType, value: typeof keyword === "string" ? keyword : null, rawValue: keyword ?? null, status: keywordStatus, metadata: { provider_field: "relKeyword" } }),
        monthly_search_pc: fieldEvidence({ evidenceType: NAVER_FIELD_MAPPING.monthlyPcQcCnt.evidenceType, value: pc.value, rawValue: row.monthlyPcQcCnt ?? null, status: pc.status, metadata: { provider_field: "monthlyPcQcCnt", normalization: pc.normalization } }),
        monthly_search_mobile: fieldEvidence({ evidenceType: NAVER_FIELD_MAPPING.monthlyMobileQcCnt.evidenceType, value: mobile.value, rawValue: row.monthlyMobileQcCnt ?? null, status: mobile.status, metadata: { provider_field: "monthlyMobileQcCnt", normalization: mobile.normalization } }),
        provider_competition: fieldEvidence({ evidenceType: NAVER_FIELD_MAPPING.compIdx.evidenceType, value: typeof competition === "string" ? competition : competition ?? null, rawValue: competition ?? null, status: competitionStatus, metadata: { provider_field: "compIdx", provider_metric_name: "compIdx" } }),
      },
    });
  }
  const success = records.filter((record) => record.normalization_status === "SUCCESS").length;
  const failed = records.length - success + errors.length;
  return { records, errors, total: rows.length, success, failed };
}

export { normalizeSearchVolumeValue };
