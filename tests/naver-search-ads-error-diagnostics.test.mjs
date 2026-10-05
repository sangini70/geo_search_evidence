import assert from "node:assert/strict";
import { collectNaverSearchDemand } from "../src/providers/naver-search-ads.mjs";
import { collectNaverRaw } from "../src/collectors/naver-search-demand-collector.mjs";

const originalFetch = globalThis.fetch;
try {
  for (const error of [
    Object.assign(new Error("getaddrinfo ENOTFOUND api.searchad.naver.com"), { name: "Error", code: "ENOTFOUND" }),
    Object.assign(new Error("connect timeout"), { name: "TimeoutError", code: "UND_ERR_CONNECT_TIMEOUT" }),
  ]) {
    globalThis.fetch = async () => { throw error; };
    const providerResult = await collectNaverSearchDemand("test");
    assert.equal(providerResult.ok, false);
    assert.equal(providerResult.error.type, "PROVIDER_REQUEST_FAILED");
    assert.equal(providerResult.error.status, null);
    assert.equal(typeof providerResult.error.diagnostics.error_name, "string");
    assert.equal(typeof providerResult.error.diagnostics.safe_error_message, "string");
    assert.equal(typeof providerResult.error.diagnostics.failure_stage, "string");
    assert.equal(typeof providerResult.error.diagnostics.retryable, "boolean");
    assert.equal(Object.hasOwn(providerResult.error.diagnostics, "headers"), false);
    assert.equal(Object.hasOwn(providerResult.error.diagnostics, "signature"), false);
  }

  globalThis.fetch = async () => { throw Object.assign(new Error("request failed X-API-KEY=secret-value"), { code: "EUNKNOWN" }); };
  const collected = await collectNaverRaw("test", { collectionId: "col_fake_diagnostics", sourceRunId: "sr_fake_diagnostics_001" });
  assert.equal(collected.error.raw_error.failure_stage, "UNKNOWN");
  assert.equal(collected.error.raw_error.error_code, "EUNKNOWN");
  assert.match(collected.error.raw_error.safe_error_message, /REDACTED/);
  assert.doesNotMatch(collected.error.raw_error.safe_error_message, /secret-value/);

  globalThis.fetch = async () => ({ ok: false, status: 400, async json() { return { code: "INVALID_REQUEST", message: "safe request explanation", secretKey: "must-not-propagate" }; } });
  const responseFailure = await collectNaverSearchDemand("test");
  assert.equal(responseFailure.error.status, 400);
  assert.equal(responseFailure.error.diagnostics.error_code, "INVALID_REQUEST");
  assert.equal(responseFailure.error.diagnostics.safe_error_message, "safe request explanation");
  assert.equal(responseFailure.error.diagnostics.failure_stage, "HTTP");
  assert.equal(responseFailure.error.diagnostics.error_name, "HTTPError");
  assert.equal(responseFailure.error.diagnostics.retryable, false);
  assert.equal(Object.hasOwn(responseFailure.error.diagnostics, "secretKey"), false);

  let requestUrl = "";
  globalThis.fetch = async (url) => {
    requestUrl = String(url);
    return { ok: true, status: 200, async json() { return { keywordList: [] }; } };
  };
  const spacedKeyword = await collectNaverSearchDemand("원달러 환율");
  assert.equal(spacedKeyword.ok, true);
  assert.equal(new URL(requestUrl).searchParams.get("hintKeywords"), "원달러환율");
  assert.equal(new URL(requestUrl).searchParams.get("showDetail"), "1");
} finally {
  globalThis.fetch = originalFetch;
}
console.log("NAVER Search Ads error diagnostics tests passed.");
