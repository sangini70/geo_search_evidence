import { readFile } from "node:fs/promises";
import { SCHEMA_VERSION, COMPETITION_RATIO } from "../core/constants.mjs";

const SEARCH_ADS_SOURCE_ID = "NAVER_SEARCH_ADS";
const WEB_SOURCE_ID = "NAVER_API_HUB_WEBKR";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function evidenceByKeyword(evidence) {
  const map = new Map();
  for (const item of evidence) {
    if (!map.has(item.keyword_id)) map.set(item.keyword_id, []);
    map.get(item.keyword_id).push(item);
  }
  return map;
}

function sourceRunFor(snapshot, sourceId) {
  return snapshot.source_runs.find((run) => run.source_id === sourceId) || null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function evidenceForKeyword(snapshot, keywordId) {
  return snapshot.evidence.filter((item) => item.keyword_id === keywordId);
}

function projectCandidate(snapshot, keyword, evidence, metric, coverage) {
  const pc = evidence.find((item) => item.evidence_type === "MONTHLY_SEARCH_VOLUME_PC");
  const mobile = evidence.find((item) => item.evidence_type === "MONTHLY_SEARCH_VOLUME_MOBILE");
  const competition = evidence.find((item) => item.evidence_type === "PROVIDER_COMPETITION_VALUE");
  const sourceRunIds = unique(evidence.map((item) => sourceRunFor(snapshot, item.source_id)?.source_run_id));
  const rawReferences = unique(evidence.map((item) => item.metadata?.raw_reference));
  return {
    ...clone(keyword),
    monthly_search_volume_pc: pc?.value ?? null,
    monthly_search_volume_mobile: mobile?.value ?? null,
    total_search_volume: metric?.value ?? null,
    total_search_volume_status: metric?.status || "NOT_AVAILABLE",
    provider_competition_value: competition?.value ?? null,
    provider_competition_source: competition?.source_id || null,
    evidence_ids: evidence.map((item) => item.evidence_id),
    metric_ids: metric ? [metric.metric_id] : [],
    source_run_ids: unique([
      ...sourceRunIds,
      keyword.source_run_id,
    ]),
    raw_references: rawReferences,
    coverage: clone(coverage),
  };
}

function createKeywordRecords(snapshot, rawSnapshot) {
  const searchEvidence = snapshot.evidence.filter((item) => item.source_id === SEARCH_ADS_SOURCE_ID);
  const groups = evidenceByKeyword(searchEvidence);
  const seed = snapshot.seed_keyword;
  if (Array.isArray(snapshot.keywords) && snapshot.keywords.length > 1) {
    const seedRecord = snapshot.keywords.find((record) => record.keyword_role === "HUB_SEED");
    if (!seedRecord) throw new Error("HUB_SEED_RECORD_NOT_FOUND");
    const keywordRecords = snapshot.keywords.map((record) => ({
      ...clone(record),
      discovery_sources: clone(record.discovery_sources || []),
    }));
    for (const record of keywordRecords) {
      const records = groups.get(record.keyword_id) || [];
      const fields = new Set(records.map((item) => item.metadata?.provider_field));
      if (!fields.has("monthlyPcQcCnt") || !fields.has("monthlyMobileQcCnt") || !fields.has("compIdx")) {
        throw new Error(`KEYWORD_EVIDENCE_FIELDS_INVALID:${record.keyword_id}`);
      }
    }
    return { keywordRecords, seedRecord };
  }
  const keywordList = rawSnapshot.raw_payload?.keywordList;
  if (!Array.isArray(keywordList)) throw new Error("SEARCH_ADS_KEYWORD_LIST_INVALID");
  const orderedKeywordIds = [...groups.keys()];
  if (orderedKeywordIds.length !== keywordList.length) throw new Error("KEYWORD_EVIDENCE_COUNT_MISMATCH");

  const keywordRecords = [];
  const seen = new Set();
  const keywordIdByRawKeyword = new Map();
  for (const [index, item] of keywordList.entries()) {
    const relatedKeyword = item.relKeyword;
    const keywordId = orderedKeywordIds[index];
    const records = groups.get(keywordId) || [];
    const fields = new Set(records.map((record) => record.metadata?.provider_field));
    if (!fields.has("monthlyPcQcCnt") || !fields.has("monthlyMobileQcCnt") || !fields.has("compIdx")) throw new Error(`KEYWORD_EVIDENCE_FIELDS_INVALID:${keywordId}`);
    if (!keywordId) throw new Error(`KEYWORD_EVIDENCE_NOT_FOUND:${relatedKeyword}`);
    if (seen.has(keywordId)) throw new Error(`DUPLICATE_KEYWORD_EVIDENCE:${keywordId}`);
    seen.add(keywordId);
    const isSeed = relatedKeyword === seed;
    if (isSeed && keywordIdByRawKeyword.has(seed)) throw new Error("DUPLICATE_HUB_SEED_KEYWORD");
    keywordIdByRawKeyword.set(relatedKeyword, keywordId);
    keywordRecords.push({
      keyword_id: keywordId,
      collection_id: snapshot.collection_id,
      raw_keyword: relatedKeyword,
      normalized_keyword: relatedKeyword,
      keyword_role: isSeed ? "HUB_SEED" : "RELATED_KEYWORD",
      discovered_from: isSeed ? null : keywordIdByRawKeyword.get(seed) || null,
      discovery_sources: [rawSnapshot.metadata?.source_run_id || SEARCH_ADS_SOURCE_ID],
      source_run_id: rawSnapshot.metadata?.source_run_id || null,
      status: "VALID",
    });
  }
  const seedRecord = keywordRecords.find((record) => record.keyword_role === "HUB_SEED");
  if (!seedRecord) throw new Error("HUB_SEED_RECORD_NOT_FOUND");
  for (const record of keywordRecords) {
    if (record.keyword_role === "RELATED_KEYWORD") record.discovered_from = seedRecord.keyword_id;
  }
  return { keywordRecords, seedRecord };
}

function createCoverage(snapshot, keywordRecords, seedRecord) {
  const searchEvidence = evidenceByKeyword(snapshot.evidence.filter((item) => item.source_id === SEARCH_ADS_SOURCE_ID));
  const metrics = new Map(snapshot.derived_metrics.map((metric) => [metric.keyword_id, metric]));
  const webEvidence = snapshot.evidence.find((item) => item.evidence_type === "SEARCH_RESULT_TOTAL" && item.search_vertical === "WEB");
  const coverage = {};
  for (const keyword of keywordRecords) {
    const records = searchEvidence.get(keyword.keyword_id) || [];
    const metric = metrics.get(keyword.keyword_id) || null;
    const hasPc = records.some((record) => record.evidence_type === "MONTHLY_SEARCH_VOLUME_PC");
    const hasMobile = records.some((record) => record.evidence_type === "MONTHLY_SEARCH_VOLUME_MOBILE");
    const hasCompetition = records.some((record) => record.evidence_type === "PROVIDER_COMPETITION_VALUE");
    coverage[keyword.keyword_id] = {
      keyword_id: keyword.keyword_id,
      search_demand: hasPc && hasMobile ? "AVAILABLE" : "FAILED",
      provider_competition: hasCompetition ? "AVAILABLE" : "FAILED",
      total_search_volume: metric?.status === "NOT_CALCULABLE" ? "NOT_CALCULABLE" : metric ? "AVAILABLE" : "NOT_AVAILABLE",
      total_search_volume_status: metric?.status || "NOT_AVAILABLE",
      web_search_result_total: keyword.keyword_id === seedRecord.keyword_id && webEvidence ? "AVAILABLE" : "NOT_COLLECTED",
      trend: "NOT_COLLECTED",
    };
  }
  return coverage;
}

export function buildSearchEvidencePack(snapshot, searchAdsRawSnapshot, { generatedAt = new Date().toISOString(), packVersion = "1.0" } = {}) {
  if (!snapshot || !searchAdsRawSnapshot) throw new Error("PACK_INPUT_REQUIRED");
  if (snapshot.status !== "SUCCESS") throw new Error("PACK_REQUIRES_SUCCESSFUL_COLLECTION");
  const { keywordRecords, seedRecord } = createKeywordRecords(snapshot, searchAdsRawSnapshot);
  const webEvidence = snapshot.evidence.find((item) => item.evidence_type === "SEARCH_RESULT_TOTAL" && item.search_vertical === "WEB");
  const coverage = createCoverage(snapshot, keywordRecords, seedRecord);
  const metrics = new Map(snapshot.derived_metrics.map((metric) => [metric.keyword_id, metric]));
  const candidates = keywordRecords.map((keyword) => projectCandidate(snapshot, keyword, evidenceForKeyword(snapshot, keyword.keyword_id), metrics.get(keyword.keyword_id), coverage[keyword.keyword_id]));
  const seedCandidate = candidates.find((keyword) => keyword.keyword_id === seedRecord.keyword_id);
  if (seedCandidate && webEvidence && !seedCandidate.evidence_ids.includes(webEvidence.evidence_id)) {
    seedCandidate.evidence_ids.push(webEvidence.evidence_id);
    const webSourceRun = sourceRunFor(snapshot, webEvidence.source_id);
    if (webSourceRun?.source_run_id && !seedCandidate.source_run_ids.includes(webSourceRun.source_run_id)) seedCandidate.source_run_ids.push(webSourceRun.source_run_id);
    const webRawReference = webEvidence.metadata?.raw_reference;
    if (webRawReference && !seedCandidate.raw_references.includes(webRawReference)) seedCandidate.raw_references.push(webRawReference);
  }
  const keywordIds = new Set(keywordRecords.map((record) => record.keyword_id));
  const aliases = {};
  if (webEvidence && !keywordIds.has(webEvidence.keyword_id)) aliases[webEvidence.keyword_id] = seedRecord.keyword_id;

  return {
    metadata: {
      pack_version: packVersion,
      collection_id: snapshot.collection_id,
      generated_at: generatedAt,
      schema_version: SCHEMA_VERSION,
      snapshot_version: snapshot.snapshot_version,
      hub_seed: snapshot.seed_keyword,
      collection_status: snapshot.status,
      keyword_count: keywordRecords.length,
      evidence_count: snapshot.evidence.length,
      derived_metric_count: snapshot.derived_metrics.length,
    },
    collection: {
      collection_id: snapshot.collection_id,
      seed_keyword: snapshot.seed_keyword,
      started_at: snapshot.started_at,
      captured_at: snapshot.captured_at,
      status: snapshot.status,
      snapshot_id: snapshot.snapshot_id,
      snapshot_version: snapshot.snapshot_version,
    },
    hub_seed: {
      ...clone(seedRecord),
      web_search_result_total: webEvidence ? { evidence_id: webEvidence.evidence_id, keyword_id: seedRecord.keyword_id, source_keyword_id: webEvidence.keyword_id } : null,
    },
    keywords: candidates,
    source_runs: clone(snapshot.source_runs),
    evidence: clone(snapshot.evidence),
    derived_metrics: clone(snapshot.derived_metrics),
    coverage,
    errors: clone(snapshot.errors),
    source_provenance: clone(snapshot.source_provenance),
    raw_references: clone(snapshot.raw_references),
    source_summary: createSourceSummary(snapshot),
    ...(Object.keys(aliases).length > 0 ? { keyword_id_aliases: aliases } : {}),
    competition_ratio: { formula: COMPETITION_RATIO.formula, formula_version: COMPETITION_RATIO.formulaVersion, status: "NOT_CONFIGURED" },
  };
}

function createSourceSummary(snapshot) {
  const summary = {};
  for (const run of snapshot.source_runs) {
    summary[run.source_id] = {
      provider: run.provider,
      product: run.product,
      search_vertical: run.search_vertical || null,
      status: run.status,
      source_run_id: run.source_run_id,
    };
  }
  summary.NAVER_API_HUB_SEARCH_TREND = {
    provider: "NAVER",
    product: "NAVER API HUB Data Lab Search Trend",
    status: "NOT_COLLECTED",
  };
  return summary;
}

export function validateSearchEvidencePack(pack) {
  const keywordIds = new Set(pack.keywords.map((keyword) => keyword.keyword_id));
  const evidenceIds = new Set();
  const metricIds = new Set();
  const errors = [];
  const usesCandidateReferences = pack.keywords.some((keyword) => Object.hasOwn(keyword, "evidence_ids") || Object.hasOwn(keyword, "metric_ids") || Object.hasOwn(keyword, "source_run_ids") || Object.hasOwn(keyword, "raw_references"));
  if (pack.keywords.filter((keyword) => keyword.keyword_role === "HUB_SEED").length !== 1) errors.push("HUB_SEED_RECORD_COUNT");
  if (keywordIds.size !== pack.keywords.length) errors.push("DUPLICATE_KEYWORD_ID");
  if (new Set(pack.keywords.map((keyword) => keyword.normalized_keyword)).size !== pack.keywords.length) errors.push("DUPLICATE_NORMALIZED_KEYWORD");
  for (const keyword of pack.keywords) {
    if (usesCandidateReferences && (!Array.isArray(keyword.evidence_ids) || !Array.isArray(keyword.metric_ids) || !Array.isArray(keyword.source_run_ids) || !Array.isArray(keyword.raw_references))) errors.push(`CANDIDATE_REFERENCES_INVALID:${keyword.keyword_id}`);
  }
  for (const keyword of pack.keywords) if (keyword.collection_id !== pack.collection.collection_id) errors.push(`KEYWORD_COLLECTION_MISMATCH:${keyword.keyword_id}`);
  for (const evidence of pack.evidence) {
    if (evidenceIds.has(evidence.evidence_id)) errors.push(`DUPLICATE_EVIDENCE_ID:${evidence.evidence_id}`);
    evidenceIds.add(evidence.evidence_id);
    const resolved = keywordIds.has(evidence.keyword_id) ? evidence.keyword_id : pack.keyword_id_aliases?.[evidence.keyword_id];
    if (!resolved) errors.push(`ORPHAN_EVIDENCE:${evidence.evidence_id}`);
    if (evidence.collection_id !== pack.collection.collection_id) errors.push(`EVIDENCE_COLLECTION_MISMATCH:${evidence.evidence_id}`);
    const candidate = pack.keywords.find((keyword) => keyword.keyword_id === resolved);
    if (candidate && Array.isArray(candidate.evidence_ids) && !candidate.evidence_ids.includes(evidence.evidence_id)) errors.push(`CANDIDATE_EVIDENCE_REFERENCE_MISSING:${evidence.evidence_id}`);
  }
  for (const metric of pack.derived_metrics) {
    if (metricIds.has(metric.metric_id)) errors.push(`DUPLICATE_METRIC_ID:${metric.metric_id}`);
    metricIds.add(metric.metric_id);
    if (!keywordIds.has(metric.keyword_id)) errors.push(`ORPHAN_METRIC:${metric.metric_id}`);
    if (metric.collection_id !== pack.collection.collection_id) errors.push(`METRIC_COLLECTION_MISMATCH:${metric.metric_id}`);
    const candidate = pack.keywords.find((keyword) => keyword.keyword_id === metric.keyword_id);
    if (candidate && Array.isArray(candidate.metric_ids) && !candidate.metric_ids.includes(metric.metric_id)) errors.push(`CANDIDATE_METRIC_REFERENCE_MISSING:${metric.metric_id}`);
    for (const evidenceId of metric.input_evidence_ids || []) if (!evidenceIds.has(evidenceId)) errors.push(`ORPHAN_INPUT_EVIDENCE:${metric.metric_id}:${evidenceId}`);
  }
  if (pack.hub_seed.web_search_result_total && pack.coverage[pack.hub_seed.keyword_id]?.web_search_result_total !== "AVAILABLE") errors.push("HUB_SEED_WEB_COVERAGE");
  for (const keyword of pack.keywords.filter((item) => item.keyword_role === "RELATED_KEYWORD")) {
    if (pack.coverage[keyword.keyword_id]?.web_search_result_total !== "NOT_COLLECTED") errors.push(`RELATED_WEB_COVERAGE:${keyword.keyword_id}`);
  }
  for (const keyword of pack.keywords) {
    for (const rawReference of Array.isArray(keyword.raw_references) ? keyword.raw_references : []) if (!pack.raw_references.includes(rawReference)) errors.push(`INVALID_RAW_REFERENCE:${keyword.keyword_id}:${rawReference}`);
    const metric = pack.derived_metrics.find((item) => item.keyword_id === keyword.keyword_id);
    if (metric?.status === "EXACT" && typeof metric.value !== "number") errors.push(`EXACT_VALUE_INVALID:${metric.metric_id}`);
    if (metric?.status === "NOT_CALCULABLE" && metric.value !== null) errors.push(`NOT_CALCULABLE_VALUE_INVALID:${metric.metric_id}`);
  }
  if (pack.competition_ratio.formula !== "NOT_CONFIGURED" || pack.competition_ratio.formula_version !== "NOT_CONFIGURED" || pack.competition_ratio.status !== "NOT_CONFIGURED") errors.push("COMPETITION_RATIO_CONFIGURED");
  return { valid: errors.length === 0, errors, counts: { keywords: pack.keywords.length, hubSeed: pack.keywords.filter((item) => item.keyword_role === "HUB_SEED").length, related: pack.keywords.filter((item) => item.keyword_role === "RELATED_KEYWORD").length, evidence: pack.evidence.length, metrics: pack.derived_metrics.length, orphanEvidence: errors.filter((error) => error.startsWith("ORPHAN_EVIDENCE")).length, orphanMetrics: errors.filter((error) => error.startsWith("ORPHAN_METRIC")).length } };
}

export async function buildSearchEvidencePackFromFiles(snapshotPath, searchAdsRawPath, options = {}) {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const rawSnapshot = JSON.parse(await readFile(searchAdsRawPath, "utf8"));
  return buildSearchEvidencePack(snapshot, rawSnapshot, options);
}
