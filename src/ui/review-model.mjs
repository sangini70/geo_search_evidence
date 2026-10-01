const PC_TYPE = "MONTHLY_SEARCH_VOLUME_PC";
const MOBILE_TYPE = "MONTHLY_SEARCH_VOLUME_MOBILE";

function evidenceIndex(pack) {
  return new Map(pack.evidence.map((evidence) => [evidence.evidence_id, evidence]));
}

function metricIndex(pack) {
  return new Map(pack.derived_metrics.map((metric) => [metric.metric_id, metric]));
}

function evidenceForType(candidate, evidenceMap, type) {
  return candidate.evidence_ids
    .map((evidenceId) => evidenceMap.get(evidenceId))
    .find((evidence) => evidence?.evidence_type === type) || null;
}

export function createReviewRows(pack) {
  const evidenceMap = evidenceIndex(pack);
  const metrics = metricIndex(pack);
  const sourceRuns = new Map(pack.source_runs.map((run) => [run.source_run_id, run]));
  return pack.keywords.map((candidate) => {
    const pc = evidenceForType(candidate, evidenceMap, PC_TYPE);
    const mobile = evidenceForType(candidate, evidenceMap, MOBILE_TYPE);
    const metric = candidate.metric_ids.map((metricId) => metrics.get(metricId)).find(Boolean) || null;
    const providers = [...new Set(candidate.source_run_ids.map((id) => sourceRuns.get(id)?.provider).filter(Boolean))];
    return {
      candidate,
      keyword: candidate.raw_keyword,
      normalizedKeyword: candidate.normalized_keyword,
      role: candidate.keyword_role,
      pcValue: pc?.value ?? null,
      pcRawValue: pc?.raw_value ?? null,
      mobileValue: mobile?.value ?? null,
      mobileRawValue: mobile?.raw_value ?? null,
      totalValue: metric?.value ?? null,
      totalStatus: candidate.total_search_volume_status,
      competition: candidate.provider_competition_value,
      webStatus: candidate.coverage?.web_search_result_total || "NOT_AVAILABLE",
      trendStatus: candidate.coverage?.trend || "NOT_COLLECTED",
      providers,
      collectedAt: pc?.collected_at || mobile?.collected_at || null,
      sourceRunIds: candidate.source_run_ids,
      evidenceIds: candidate.evidence_ids,
      metricIds: candidate.metric_ids,
      rawReferences: candidate.raw_references,
    };
  });
}

export function filterReviewRows(rows, { search = "", role = "ALL", totalStatus = "ALL", competition = "ALL", webStatus = "ALL" } = {}) {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (query && !row.keyword.toLocaleLowerCase().includes(query) && !row.normalizedKeyword.toLocaleLowerCase().includes(query)) return false;
    if (role !== "ALL" && row.role !== role) return false;
    if (totalStatus !== "ALL" && row.totalStatus !== totalStatus) return false;
    if (competition !== "ALL" && row.competition !== competition) return false;
    if (webStatus !== "ALL" && row.webStatus !== webStatus) return false;
    return true;
  });
}

export function sortReviewRows(rows, key = "keyword", direction = "asc") {
  const sign = direction === "desc" ? -1 : 1;
  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * sign;
    return String(a).localeCompare(String(b), "ko") * sign;
  });
}
