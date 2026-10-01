import { config } from "../config/index.mjs";

export function normalizeNaverWebSearchResult({ collectionId, keywordId, query, rawReference, responseStatus, payload, collectedAt, collectorVersion }) {
  return {
    evidence_id: null,
    collection_id: collectionId,
    keyword_id: keywordId,
    evidence_type: "SEARCH_RESULT_TOTAL",
    evidence_layer: "NORMALIZED",
    query,
    provider: config.naverWeb.provider,
    product: config.naverWeb.product,
    source_id: config.naverWeb.sourceId,
    source_type: "OFFICIAL_API",
    collection_method: "API",
    search_vertical: config.naverWeb.searchVertical,
    endpoint: config.naverWeb.endpoint,
    response_field: config.naverWeb.responseField,
    collected_at: collectedAt,
    response_status: responseStatus,
    value: payload?.total,
    raw_value: payload?.total,
    status: "SUCCESS",
    metadata: {
      raw_reference: rawReference,
      collector_version: collectorVersion,
      provider_payload_keys: Object.keys(payload || {}),
    },
  };
}
