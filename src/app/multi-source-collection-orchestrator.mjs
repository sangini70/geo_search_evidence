import { config } from "../config/index.mjs";
import { createCollectionIdGenerator } from "../core/id-generator.mjs";
import { collectNaverRaw } from "../collectors/naver-search-demand-collector.mjs";
import { collectNaverWebRaw } from "../collectors/naver-web-search-collector.mjs";
import { normalizeNaverRawSnapshot } from "../normalizers/naver-search-demand-normalizer.mjs";
import { normalizeNaverWebSearchResult } from "../normalizers/naver-web-search-result-normalizer.mjs";
import { validateNaverNormalizedRecords } from "../validators/naver-search-demand-validator.mjs";
import { validateNaverWebSearchEvidence } from "../validators/naver-web-search-result-validator.mjs";
import { calculateTotalSearchVolume } from "../metrics/total-search-volume-calculator.mjs";
import { saveRawSnapshot } from "../repositories/raw-repository.mjs";
import { saveCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { createCanonicalKeywordRegistry } from "../core/canonical-keyword-registry.mjs";

function createCollectionId() {
  return `col_${Date.now()}`;
}

function createError(idGenerator, collectionId, sourceRunId, sourceId, type, message, status = null, stage = "COLLECTION") {
  return {
    error_id: idGenerator.nextErrorId(),
    collection_id: collectionId,
    source_run_id: sourceRunId,
    collector_id: sourceId,
    source_id: sourceId,
    error_type: type,
    message,
    occurred_at: new Date().toISOString(),
    retryable: false,
    raw_error: { stage, response_status: status },
  };
}

function sourceRun({ sourceRunId, collectionId, sourceId, provider, product, searchVertical, startedAt }) {
  return {
    source_run_id: sourceRunId,
    collection_id: collectionId,
    source_id: sourceId,
    provider,
    product,
    search_vertical: searchVertical || null,
    started_at: startedAt,
    collected_at: null,
    status: "PENDING",
    raw_reference: null,
    error_reference: null,
  };
}

function finalizeSourceRun(run, result, rawReference = null, errorReference = null) {
  return {
    ...run,
    collected_at: new Date().toISOString(),
    status: result ? "SUCCESS" : "FAILED",
    raw_reference: rawReference,
    error_reference: errorReference,
  };
}

function collectionStatus(sourceRuns) {
  const successes = sourceRuns.filter((run) => run.status === "SUCCESS").length;
  if (successes === sourceRuns.length) return "SUCCESS";
  if (successes > 0) return "PARTIAL_SUCCESS";
  return "FAILED";
}

function webRawSnapshot(result, collectionId, sourceRunId, collectedAt) {
  return {
    metadata: {
      provider: config.naverWeb.provider,
      source: config.naverWeb.sourceId,
      product: config.naverWeb.product,
      operation: "GET /search/v1/webkr",
      query: result.query,
      search_vertical: config.naverWeb.searchVertical,
      endpoint: config.naverWeb.endpoint,
      response_field: config.naverWeb.responseField,
      collected_at: collectedAt,
      response_status: result.responseStatus,
      collector_version: config.collectorVersion,
      collection_id: collectionId,
      source_run_id: sourceRunId,
    },
    raw_payload: result.payload,
  };
}

export async function runMultiSourceCollection(seedKeyword = "달러", {
  persist = true,
  searchAdsCollector = collectNaverRaw,
  webCollector = collectNaverWebRaw,
  collectionId = createCollectionId(),
  snapshotVersion = 1,
} = {}) {
  const startedAt = new Date().toISOString();
  const idGenerator = createCollectionIdGenerator(collectionId);
  const keywordRegistry = createCanonicalKeywordRegistry({ collectionId, idGenerator, firstSeenAt: startedAt });
  const hubSeedRecord = keywordRegistry.register({ normalizedKeyword: seedKeyword, rawKeyword: seedKeyword, keywordRole: "HUB_SEED", sourceId: null, sourceRunId: null });
  const evidence = [];
  const derivedMetrics = [];
  const errors = [];
  const rawReferences = [];
  const sourceProvenance = [];
  const sourceRuns = [];

  const searchRunId = idGenerator.nextSourceRunId();
  const searchRun = sourceRun({ sourceRunId: searchRunId, collectionId, sourceId: config.naver.sourceId, provider: "NAVER", product: config.naver.product, startedAt });
  sourceRuns.push(searchRun);
  let searchResult;
  try {
    searchResult = await searchAdsCollector(seedKeyword, { collectionId, sourceRunId: searchRunId });
    if (searchResult.status !== "SUCCESS") throw searchResult.error || new Error(searchResult.status || "SEARCH_ADS_COLLECTION_FAILED");
    rawReferences.push(searchResult.rawReference.relativePath);
    sourceProvenance.push(searchResult.rawSnapshot.metadata);
    const normalized = normalizeNaverRawSnapshot(searchResult.rawSnapshot, searchResult.rawReference.relativePath, { collectionId, idGenerator, keywordRegistry, hubSeedKeyword: seedKeyword, sourceRunId: searchRunId });
    const validated = validateNaverNormalizedRecords(normalized);
    evidence.push(...validated.results.flatMap((record) => record.evidence || []));
    for (const record of validated.results) {
      if (record.validation_status !== "SUCCESS") {
        for (const validationError of record.validation_errors) errors.push(createError(idGenerator, collectionId, searchRunId, config.naver.sourceId, "VALIDATION_ERROR", validationError.message, null, "SEARCH_DEMAND_VALIDATION"));
        continue;
      }
      try {
        derivedMetrics.push(calculateTotalSearchVolume(record, idGenerator));
      } catch (error) {
        errors.push(createError(idGenerator, collectionId, searchRunId, config.naver.sourceId, "VALIDATION_ERROR", error.message, null, "DERIVED_METRIC"));
      }
    }
    sourceRuns[sourceRuns.length - 1] = finalizeSourceRun(searchRun, true, searchResult.rawReference.relativePath, null);
  } catch (error) {
    const safeError = error?.message || "NAVER Search Ads collection failed.";
    const errorRecord = createError(idGenerator, collectionId, searchRunId, config.naver.sourceId, searchResult?.error?.type || "PROVIDER_REQUEST_FAILED", safeError, searchResult?.error?.status || null, "SEARCH_DEMAND");
    errors.push(errorRecord);
    sourceRuns[sourceRuns.length - 1] = finalizeSourceRun(searchRun, false, searchResult?.rawReference?.relativePath || null, errorRecord.error_id);
  }

  const webRunId = idGenerator.nextSourceRunId();
  const webRun = sourceRun({ sourceRunId: webRunId, collectionId, sourceId: config.naverWeb.sourceId, provider: config.naverWeb.provider, product: config.naverWeb.product, searchVertical: config.naverWeb.searchVertical, startedAt });
  sourceRuns.push(webRun);
  let webResult;
  try {
    webResult = await webCollector(seedKeyword, { collectionId, sourceRunId: webRunId });
    if (!webResult.ok) throw webResult.error || new Error(webResult.status || "WEB_COLLECTION_FAILED");
    const collectedAt = new Date().toISOString();
    const rawSnapshot = webRawSnapshot(webResult, collectionId, webRunId, collectedAt);
    const rawReference = persist ? await saveRawSnapshot(collectionId, rawSnapshot, { sourceRunId: webRunId }) : { relativePath: `data/raw/${collectionId}/${webRunId}.json` };
    rawReferences.push(rawReference.relativePath);
    sourceProvenance.push(rawSnapshot.metadata);
    const webKeywordRecord = keywordRegistry.register({ normalizedKeyword: seedKeyword, rawKeyword: seedKeyword, keywordRole: "HUB_SEED", sourceId: config.naverWeb.sourceId, sourceRunId: webRunId });
    const keywordId = webKeywordRecord.keyword_id || hubSeedRecord.keyword_id;
    const webEvidence = normalizeNaverWebSearchResult({ collectionId, keywordId, query: webResult.query, rawReference: rawReference.relativePath, responseStatus: webResult.responseStatus, payload: webResult.payload, collectedAt, collectorVersion: config.collectorVersion });
    webEvidence.evidence_id = idGenerator.nextEvidenceId();
    const validation = validateNaverWebSearchEvidence(webEvidence);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    evidence.push(webEvidence);
    sourceRuns[sourceRuns.length - 1] = finalizeSourceRun(webRun, true, rawReference.relativePath, null);
  } catch (error) {
    const errorRecord = createError(idGenerator, collectionId, webRunId, config.naverWeb.sourceId, webResult?.error?.type || "PROVIDER_REQUEST_FAILED", error?.message || "NAVER WEB collection failed.", webResult?.error?.status || null, "WEB_SEARCH");
    errors.push(errorRecord);
    sourceRuns[sourceRuns.length - 1] = finalizeSourceRun(webRun, false, null, errorRecord.error_id);
  }

  const snapshot = {
    snapshot_id: `${collectionId}_v${snapshotVersion}`,
    snapshot_version: snapshotVersion,
    collection_id: collectionId,
    seed_keyword: seedKeyword,
    started_at: startedAt,
    captured_at: new Date().toISOString(),
    keyword_count: null,
    keywords: keywordRegistry.records(),
    evidence_count: evidence.length,
    source_runs: sourceRuns,
    raw_references: rawReferences,
    source_provenance: sourceProvenance,
    status: collectionStatus(sourceRuns),
    evidence,
    derived_metrics: derivedMetrics,
    errors,
  };
  const savedSnapshot = persist ? await saveCollectionSnapshot(collectionId, snapshot, { snapshotVersion }) : null;
  snapshot.keyword_count = snapshot.keywords.length;
  return { collectionId, sourceRuns, snapshot, savedSnapshot, rawReferences, evidence, derivedMetrics, errors, keywords: snapshot.keywords };
}
