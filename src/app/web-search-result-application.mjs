import { config, getNaverWebPreflight } from "../config/index.mjs";
import { collectNaverWebRaw } from "../collectors/naver-web-search-collector.mjs";
import { saveRawSnapshot } from "../repositories/raw-repository.mjs";
import { saveCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { createCollectionIdGenerator } from "../core/id-generator.mjs";
import { normalizeNaverWebSearchResult } from "../normalizers/naver-web-search-result-normalizer.mjs";
import { validateNaverWebSearchEvidence } from "../validators/naver-web-search-result-validator.mjs";

function errorRecord(collectionId, type, message, status = null) {
  return { error_id: `err_${collectionId}`, collection_id: collectionId, collector_id: "NAVER_WEB_SEARCH_COLLECTOR", source_id: config.naverWeb.sourceId, error_type: type, message, occurred_at: new Date().toISOString(), retryable: false, raw_error: status == null ? null : { response_status: status } };
}

export async function collectNaverWebSearchEvidence(query, { persist = true } = {}) {
  const collectionId = `col_${Date.now()}`;
  const preflight = getNaverWebPreflight(query);
  if (preflight.status === "BLOCKED") {
    return { status: preflight.credentialsConfigured ? "PREFLIGHT_FAILED" : "WAITING_FOR_CREDENTIALS", collectionId, preflight, errors: [errorRecord(collectionId, "PREFLIGHT_FAILED", "NAVER API HUB credentials or query are not configured.")] };
  }
  const result = await collectNaverWebRaw(query);
  if (!result.ok) {
    const message = result.error.type === "AUTH_FAILED" ? "NAVER API HUB authentication failed." : "NAVER Web Document Search request failed.";
    return { status: result.error.type, collectionId, preflight, errors: [errorRecord(collectionId, result.error.type, message, result.error.status)] };
  }
  const collectedAt = new Date().toISOString();
  const rawSnapshot = {
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
    },
    raw_payload: result.payload,
  };
  const rawReference = persist ? await saveRawSnapshot(collectionId, rawSnapshot) : { relativePath: `data/raw/${collectionId}.json` };
  const idGenerator = createCollectionIdGenerator(collectionId);
  const keywordId = idGenerator.nextKeywordId();
  const evidence = normalizeNaverWebSearchResult({ collectionId, keywordId, query: result.query, rawReference: rawReference.relativePath, responseStatus: result.responseStatus, payload: result.payload, collectedAt, collectorVersion: config.collectorVersion });
  evidence.evidence_id = idGenerator.nextEvidenceId();
  const validation = validateNaverWebSearchEvidence(evidence);
  if (!validation.valid) {
    return { status: "PROVIDER_RESPONSE_INVALID", collectionId, preflight, rawReference, evidence, validation, errors: [errorRecord(collectionId, "PROVIDER_RESPONSE_INVALID", validation.errors.join(" "), result.responseStatus)] };
  }
  const snapshot = { snapshot_id: collectionId, collection_id: collectionId, seed_keyword: result.query, captured_at: collectedAt, keyword_count: 1, evidence_count: 1, source_summary: rawSnapshot.metadata, status: "SUCCESS", evidence: [evidence], derived_metrics: [], errors: [] };
  const savedSnapshot = persist ? await saveCollectionSnapshot(collectionId, snapshot) : null;
  return { status: "SUCCESS", collectionId, preflight, rawReference, savedSnapshot, evidence, snapshot };
}
