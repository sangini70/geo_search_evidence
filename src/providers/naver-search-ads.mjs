import { config } from "../config/index.mjs";
import { createNaverHeaders } from "./naver-signature.mjs";

const endpoint = "/keywordstool";

function safeProviderError(type, status = null) {
  return { type, status, retryable: type === "PROVIDER_REQUEST_FAILED" && status !== 401 && status !== 403 };
}

export async function collectNaverSearchDemand(seedKeyword) {
  const query = new URLSearchParams({ hintKeywords: seedKeyword.trim(), showDetail: "1" });
  const url = `${config.naver.baseUrl}${endpoint}?${query.toString()}`;
  const timestamp = String(Date.now());
  const headers = createNaverHeaders({ timestamp, method: "GET", uri: endpoint, accessLicense: config.naver.accessLicense, customerId: config.naver.customerId, secretKey: config.naver.secretKey });
  let response;
  try { response = await fetch(url, { method: "GET", headers }); } catch { return { ok: false, error: safeProviderError("PROVIDER_REQUEST_FAILED") }; }
  if (!response.ok) {
    const type = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "PROVIDER_REQUEST_FAILED";
    return { ok: false, error: safeProviderError(type, response.status) };
  }
  let payload;
  try { payload = await response.json(); } catch { return { ok: false, error: safeProviderError("PROVIDER_RESPONSE_INVALID", response.status) }; }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray(payload.keywordList) || payload.keywordList.some((item) => item === null || typeof item !== "object" || Array.isArray(item))) return { ok: false, error: safeProviderError("PROVIDER_RESPONSE_INVALID", response.status) };
  return { ok: true, responseStatus: response.status, query: seedKeyword.trim(), payload };
}
