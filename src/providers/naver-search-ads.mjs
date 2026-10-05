import { config } from "../config/index.mjs";
import { createNaverHeaders } from "./naver-signature.mjs";

const endpoint = "/keywordstool";

function safeProviderError(type, status = null) {
  return { type, status, retryable: type === "PROVIDER_REQUEST_FAILED" && status !== 401 && status !== 403 };
}

function safeErrorMessage(error) {
  const message = typeof error?.message === "string" && error.message ? error.message : "Fetch request failed.";
  return message
    .replace(/(?:x-api-key|x-signature|x-customer|authorization|access[-_ ]?license|secret[-_ ]?key)\s*[:=]\s*[^\s,;]+/giu, "$1=[REDACTED]")
    .slice(0, 256);
}

function classifyFetchFailure(error) {
  const errorName = typeof error?.name === "string" && error.name ? error.name : "Error";
  const errorCode = typeof error?.code === "string" || typeof error?.code === "number" ? String(error.code) : null;
  const code = errorCode?.toUpperCase();
  let failureStage = "UNKNOWN";
  if (["EAI_AGAIN", "ENOTFOUND", "ENODATA"].includes(code)) failureStage = "DNS";
  else if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "EPIPE"].includes(code)) failureStage = "CONNECTION";
  else if (code?.startsWith("ERR_TLS")) failureStage = "TLS";
  else if (["ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(code) || errorName === "TimeoutError") failureStage = "TIMEOUT";
  else if (errorName === "TypeError") failureStage = "FETCH";
  const retryable = failureStage === "TIMEOUT" || code === "EAI_AGAIN" || code === "ECONNRESET";
  return { error_name: errorName, ...(errorCode ? { error_code: errorCode } : {}), safe_error_message: safeErrorMessage(error), failure_stage: failureStage, retryable };
}

function redactResponseText(value) {
  return String(value)
    .replace(/(?:x-api-key|x-signature|x-customer|authorization|access[-_ ]?license|secret[-_ ]?key)\s*[:=]\s*[^\s,;"'}]+/giu, "$1=[REDACTED]")
    .slice(0, 512);
}

function safeResponseDiagnostics(body, responseStatus) {
  const diagnostics = { error_name: "HTTPError", failure_stage: "HTTP", retryable: false };
  if (body && typeof body === "object" && !Array.isArray(body)) {
    for (const key of ["code", "errorCode", "error_code"]) {
      if (body[key] != null) { diagnostics.error_code = redactResponseText(body[key]); break; }
    }
    for (const key of ["message", "error", "errorMessage", "error_message", "title", "detail"]) {
      if (body[key] != null) { diagnostics.safe_error_message = redactResponseText(body[key]); break; }
    }
    return diagnostics;
  }
  if (body != null) diagnostics.safe_error_message = redactResponseText(body);
  else diagnostics.safe_error_message = `HTTP ${responseStatus ?? "unknown"} response`;
  return diagnostics;
}

export async function collectNaverSearchDemand(seedKeyword) {
  const hintKeywords = seedKeyword.trim().replace(/\s+/gu, "");
  const query = new URLSearchParams({ hintKeywords, showDetail: "1" });
  const url = `${config.naver.baseUrl}${endpoint}?${query.toString()}`;
  const timestamp = String(Date.now());
  const headers = createNaverHeaders({ timestamp, method: "GET", uri: endpoint, accessLicense: config.naver.accessLicense, customerId: config.naver.customerId, secretKey: config.naver.secretKey });
  let response;
  try { response = await fetch(url, { method: "GET", headers }); } catch (error) {
    return { ok: false, error: { ...safeProviderError("PROVIDER_REQUEST_FAILED"), diagnostics: classifyFetchFailure(error) } };
  }
  if (!response.ok) {
    const type = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "PROVIDER_REQUEST_FAILED";
    let responseBody = null;
    try { responseBody = await response.json(); } catch { try { responseBody = await response.text(); } catch { responseBody = null; } }
    return { ok: false, error: { ...safeProviderError(type, response.status), diagnostics: safeResponseDiagnostics(responseBody, response.status) } };
  }
  let payload;
  try { payload = await response.json(); } catch { return { ok: false, error: safeProviderError("PROVIDER_RESPONSE_INVALID", response.status) }; }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray(payload.keywordList) || payload.keywordList.some((item) => item === null || typeof item !== "object" || Array.isArray(item))) return { ok: false, error: safeProviderError("PROVIDER_RESPONSE_INVALID", response.status) };
  return { ok: true, responseStatus: response.status, query: seedKeyword.trim(), payload };
}
