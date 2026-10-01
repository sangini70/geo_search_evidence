import { config, getNaverWebPreflight } from "../config/index.mjs";
import { collectNaverWebSearch } from "../providers/naver-web-search.mjs";

export async function collectNaverWebRaw(query, { collectionId = null, sourceRunId = null } = {}) {
  const preflight = getNaverWebPreflight(query);
  if (preflight.status === "BLOCKED") {
    return { ok: false, status: "WAITING_FOR_CREDENTIALS", collectionId, sourceRunId, preflight, error: { type: "PREFLIGHT_FAILED", status: null, retryable: false } };
  }
  const result = await collectNaverWebSearch(query);
  return result.ok ? { ...result, collectionId, sourceRunId, preflight, source: config.naverWeb } : { ...result, collectionId, sourceRunId, preflight, source: config.naverWeb };
}
