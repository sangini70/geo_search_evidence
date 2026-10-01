import { config } from "../config/index.mjs";

function safeProviderError(type, status = null) {
  return { type, status, retryable: type === "PROVIDER_REQUEST_FAILED" && status !== 401 && status !== 403 };
}

export async function collectNaverWebSearch(query) {
  const params = new URLSearchParams({ query: query.trim(), display: "10", start: "1", format: "json" });
  const url = `${config.naverWeb.baseUrl}${config.naverWeb.endpoint}?${params.toString()}`;
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "X-NCP-APIGW-API-KEY-ID": config.naverWeb.clientId,
        "X-NCP-APIGW-API-KEY": config.naverWeb.clientSecret,
      },
    });
  } catch {
    return { ok: false, error: safeProviderError("PROVIDER_REQUEST_FAILED") };
  }
  if (!response.ok) {
    const type = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "PROVIDER_REQUEST_FAILED";
    return { ok: false, error: safeProviderError(type, response.status) };
  }
  let payload;
  try { payload = await response.json(); } catch { return { ok: false, error: safeProviderError("PROVIDER_RESPONSE_INVALID", response.status) }; }
  return { ok: true, responseStatus: response.status, query: query.trim(), payload };
}
