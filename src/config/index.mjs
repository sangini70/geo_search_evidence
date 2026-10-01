import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

function loadDotEnv() {
  const filePath = join(projectRoot, ".env");
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(readFileSync(filePath, "utf8").split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return [];
    const separator = trimmed.indexOf("=");
    if (separator < 1) return [];
    return [[trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim()]];
  }));
}

const dotEnv = loadDotEnv();
const env = (name) => process.env[name] ?? dotEnv[name] ?? "";

export const config = Object.freeze({
  port: Number(env("GEO_APP_PORT") || 4173),
  schemaVersion: env("GEO_SCHEMA_VERSION") || "0.1",
  collectorVersion: "0.1.0",
  naver: Object.freeze({
    baseUrl: "https://api.searchad.naver.com",
    sourceId: "NAVER_SEARCH_ADS",
    product: "NAVER Search Ads API",
    operation: "RelKwdStat / KeywordsTool",
    customerId: env("NAVER_ADS_CUSTOMER_ID"),
    accessLicense: env("NAVER_ADS_ACCESS_LICENSE"),
    secretKey: env("NAVER_ADS_SECRET_KEY"),
  }),
  naverWeb: Object.freeze({
    baseUrl: "https://naverapihub.apigw.ntruss.com",
    sourceId: "NAVER_API_HUB_WEBKR",
    provider: "NAVER",
    product: "NAVER API HUB Web Document Search",
    endpoint: "/search/v1/webkr",
    searchVertical: "WEB",
    responseField: "total",
    clientId: env("NAVER_API_HUB_CLIENT_ID"),
    clientSecret: env("NAVER_API_HUB_CLIENT_SECRET"),
  }),
});

export function getNaverPreflight(seedKeyword) {
  const missing = [];
  if (!config.naver.customerId) missing.push("NAVER_ADS_CUSTOMER_ID");
  if (!config.naver.accessLicense) missing.push("NAVER_ADS_ACCESS_LICENSE");
  if (!config.naver.secretKey) missing.push("NAVER_ADS_SECRET_KEY");
  if (!seedKeyword?.trim()) missing.push("seed_keyword");
  return Object.freeze({
    status: missing.length === 0 ? "READY" : "BLOCKED",
    missing,
    credentialsConfigured: missing.filter((item) => item.startsWith("NAVER_")).length === 0,
    seedConfigured: Boolean(seedKeyword?.trim()),
  });
}

export function getNaverWebPreflight(query) {
  const missing = [];
  if (!query?.trim()) missing.push("query");
  if (!config.naverWeb.clientId) missing.push("NAVER_API_HUB_CLIENT_ID");
  if (!config.naverWeb.clientSecret) missing.push("NAVER_API_HUB_CLIENT_SECRET");
  if (config.naverWeb.searchVertical !== "WEB") missing.push("search_vertical");
  if (!config.naverWeb.endpoint) missing.push("endpoint");
  return Object.freeze({
    status: missing.length === 0 ? "READY" : "BLOCKED",
    missing,
    credentialsConfigured: Boolean(config.naverWeb.clientId && config.naverWeb.clientSecret),
    queryConfigured: Boolean(query?.trim()),
    searchVertical: config.naverWeb.searchVertical,
    endpoint: config.naverWeb.endpoint,
  });
}
