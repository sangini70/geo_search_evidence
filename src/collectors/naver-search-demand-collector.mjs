import { config, getNaverPreflight } from "../config/index.mjs";
import { collectNaverSearchDemand } from "../providers/naver-search-ads.mjs";
import { saveRawSnapshot } from "../repositories/raw-repository.mjs";

function errorRecord(error, collectionId, sourceRunId = null) {
  const messages = { PREFLIGHT_FAILED: "NAVER API credentials or seed keyword are not configured.", AUTH_FAILED: "NAVER API authentication failed.", PROVIDER_REQUEST_FAILED: "NAVER API request failed.", PROVIDER_RESPONSE_INVALID: "NAVER API response shape was invalid." };
  const rawError = { response_status: error.status ?? null };
  if (error.diagnostics && typeof error.diagnostics === "object") Object.assign(rawError, error.diagnostics);
  return { error_id: `err_${collectionId}_${sourceRunId || "legacy"}`, collection_id: collectionId, source_run_id: sourceRunId, collector_id: "NAVER_SEARCH_DEMAND_COLLECTOR", source_id: config.naver.sourceId, error_type: error.type, message: messages[error.type] || "NAVER Source failed.", occurred_at: new Date().toISOString(), retryable: Boolean(error.diagnostics?.retryable ?? error.retryable), raw_error: Object.keys(rawError).length ? rawError : null };
}

export async function collectNaverRaw(seedKeyword, { collectionId, sourceRunId } = {}) {
  if (!collectionId || !sourceRunId) {
    return { status: "COLLECTION_CONTEXT_REQUIRED", collectionId: collectionId || null, sourceRunId: sourceRunId || null, preflight: getNaverPreflight(seedKeyword), error: errorRecord({ type: "COLLECTION_CONTEXT_REQUIRED", retryable: false }, collectionId || "unknown", sourceRunId) };
  }
  const preflight = getNaverPreflight(seedKeyword);
  if (preflight.status === "BLOCKED") {
    const status = preflight.credentialsConfigured ? "PREFLIGHT_FAILED" : "WAITING_FOR_CREDENTIALS";
    return { status, collectionId, sourceRunId, preflight, error: errorRecord({ type: "PREFLIGHT_FAILED", retryable: false }, collectionId, sourceRunId) };
  }
  const result = await collectNaverSearchDemand(seedKeyword);
  if (!result.ok) return { status: result.error.type, collectionId, sourceRunId, preflight, error: errorRecord(result.error, collectionId, sourceRunId) };
  const collectedAt = new Date().toISOString();
  const snapshot = { metadata: { provider: "NAVER", source: config.naver.sourceId, product: config.naver.product, operation: config.naver.operation, query: result.query, collected_at: collectedAt, response_status: result.responseStatus, collector_version: config.collectorVersion, source_run_id: sourceRunId, collection_id: collectionId }, raw_payload: result.payload };
  const rawReference = await saveRawSnapshot(collectionId, snapshot, { sourceRunId });
  return { status: "SUCCESS", collectionId, sourceRunId, preflight, rawReference, rawSnapshot: snapshot, itemCount: result.payload?.keywordList?.length ?? 0 };
}
