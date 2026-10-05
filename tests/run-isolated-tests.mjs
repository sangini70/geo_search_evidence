import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSearchEvidencePack } from "../src/pack/search-evidence-pack-builder.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), "geo-search-evidence-test-"));
const collectionIds = ["col_1790686493058", "col_1790688323936", "col_1790695616409"];
const keywordCount = 509;
const exactMetricCount = 347;

function fixtureKeyword(seedKeyword, index) {
  if (seedKeyword === "\uB2EC\uB7EC" && index === 1) return "\uB2EC\uB7EC\uD658\uC728";
  if (seedKeyword === "\uB2EC\uB7EC" && index === 347) return "\uD654\uD3D0\uACBD\uB9E4";
  return index === 0 ? seedKeyword : seedKeyword + "-related-" + index;
}

function keywordList(seedKeyword) {
  return Array.from({ length: keywordCount }, (_, index) => ({
    relKeyword: fixtureKeyword(seedKeyword, index),
    monthlyPcQcCnt: index < exactMetricCount ? 100 : "<10",
    monthlyMobileQcCnt: index < exactMetricCount ? 200 : "<10",
    compIdx: "LOW",
  }));
}

function rawSnapshot(collectionId, seedKeyword = "달러") {
  return {
    metadata: { provider: "NAVER", source: "NAVER_SEARCH_ADS", source_run_id: "sr_" + collectionId + "_001", product: "synthetic test fixture", collected_at: "2026-09-29T00:00:00.000Z" },
    raw_payload: { keywordList: keywordList(seedKeyword) },
  };
}

function snapshotFixture(collectionId, { aliasWebKeyword = false, seedKeyword = "달러" } = {}) {
  const rawPath = "data/raw/" + collectionId + "/sr_" + collectionId + "_001.json";
  const webPath = "data/raw/" + collectionId + "/sr_" + collectionId + "_002.json";
  const keywordSuffix = (index) => String(index + 1).padStart(3, "0");
  const keywords = Array.from({ length: keywordCount }, (_, index) => ({
    keyword_id: "kw_" + collectionId + "_" + keywordSuffix(index),
    collection_id: collectionId,
    raw_keyword: fixtureKeyword(seedKeyword, index),
    normalized_keyword: fixtureKeyword(seedKeyword, index),
    keyword_role: index === 0 ? "HUB_SEED" : "RELATED_KEYWORD",
    discovered_from: index === 0 ? null : "kw_" + collectionId + "_001",
    discovery_sources: ["sr_" + collectionId + "_001"],
    source_run_id: "sr_" + collectionId + "_001",
    status: "VALID",
  }));
  const evidence = [];
  const derivedMetrics = [];
  for (let index = 0; index < keywordCount; index += 1) {
    const keywordId = keywords[index].keyword_id;
    const exact = index < exactMetricCount;
    const lowRawValue = seedKeyword === "\uB2EC\uB7EC" && index === 347 ? "< 10" : "<10";
    const fields = [
      ["MONTHLY_SEARCH_VOLUME_PC", "monthlyPcQcCnt", exact ? 100 : null, exact ? 100 : lowRawValue],
      ["MONTHLY_SEARCH_VOLUME_MOBILE", "monthlyMobileQcCnt", exact ? 200 : null, exact ? 200 : lowRawValue],
      ["PROVIDER_COMPETITION_VALUE", "compIdx", "LOW", "LOW"],
    ];
    for (const [evidenceType, providerField, value, rawValue] of fields) {
      evidence.push({
        evidence_id: "ev_" + collectionId + "_" + keywordSuffix(index) + "_" + providerField,
        collection_id: collectionId,
        keyword_id: keywordId,
        evidence_type: evidenceType,
        evidence_layer: "NORMALIZED",
        source_id: "NAVER_SEARCH_ADS",
        source_type: "OFFICIAL_API",
        status: "SUCCESS",
        value,
        raw_value: rawValue,
        metadata: { provider_field: providerField, raw_reference: rawPath },
      });
    }
    derivedMetrics.push({
      metric_id: "metric_" + collectionId + "_" + keywordSuffix(index),
      collection_id: collectionId,
      keyword_id: keywordId,
      metric_type: "MONTHLY_SEARCH_VOLUME_TOTAL",
      formula_version: "total_search_volume_v1",
      status: exact ? "EXACT" : "NOT_CALCULABLE",
      value: exact ? 300 : null,
      input_evidence_ids: evidence.slice(-3, -1).map((item) => item.evidence_id),
    });
  }
  const webKeywordId = aliasWebKeyword ? "kw_" + collectionId + "_510" : keywords[0].keyword_id;
  evidence.push({
    evidence_id: "ev_" + collectionId + "_web_001",
    collection_id: collectionId,
    keyword_id: webKeywordId,
    evidence_type: "SEARCH_RESULT_TOTAL",
    evidence_layer: "NORMALIZED",
    source_id: "NAVER_API_HUB_WEBKR",
    source_type: "OFFICIAL_API",
    search_vertical: "WEB",
    status: "SUCCESS",
    value: 123,
    raw_value: 123,
    metadata: { raw_reference: webPath },
  });
  return {
    snapshot_id: collectionId + "_v1",
    snapshot_version: 1,
    collection_id: collectionId,
    seed_keyword: seedKeyword,
    status: "SUCCESS",
    started_at: "2026-09-29T00:00:00.000Z",
    captured_at: "2026-09-29T00:00:01.000Z",
    keywords,
    source_runs: [
      { source_run_id: "sr_" + collectionId + "_001", collection_id: collectionId, source_id: "NAVER_SEARCH_ADS", provider: "NAVER", product: "synthetic test fixture", status: "SUCCESS" },
      { source_run_id: "sr_" + collectionId + "_002", collection_id: collectionId, source_id: "NAVER_API_HUB_WEBKR", provider: "NAVER", product: "synthetic test fixture", search_vertical: "WEB", status: "SUCCESS" },
    ],
    evidence,
    derived_metrics: derivedMetrics,
    errors: [],
    raw_references: [rawPath, webPath],
    source_provenance: [{ source_id: "NAVER_SEARCH_ADS", provider: "NAVER" }, { source_id: "NAVER_API_HUB_WEBKR", provider: "NAVER" }],
  };
}

async function writeFixture(relativePath, value) {
  const target = join(workspace, relativePath);
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, JSON.stringify(value, null, 2) + "\n", "utf8");
}

try {
  process.env.GEO_DATA_ROOT = join(workspace, "data");
  process.env.GEO_BACKUP_ROOT = join(workspace, "backup");
  await mkdir(process.env.GEO_BACKUP_ROOT, { recursive: true });
  process.env.NAVER_ADS_CUSTOMER_ID = "synthetic-test-customer";
  process.env.NAVER_ADS_ACCESS_LICENSE = "synthetic-test-license";
  process.env.NAVER_ADS_SECRET_KEY = "synthetic-test-secret";
  process.chdir(workspace);
  const normalizationFixture = rawSnapshot("col_1790640999226");
  await writeFixture("data/raw/col_1790640999226.json", normalizationFixture);
  for (const collectionId of collectionIds) {
    const options = { aliasWebKeyword: collectionId === "col_1790686493058", seedKeyword: "달러" };
    const raw = rawSnapshot(collectionId, options.seedKeyword);
    const snapshot = snapshotFixture(collectionId, options);
    await writeFixture("data/raw/" + collectionId + "/sr_" + collectionId + "_001.json", raw);
    await writeFixture("data/raw/" + collectionId + "/sr_" + collectionId + "_002.json", { metadata: { source: "NAVER_API_HUB_WEBKR" }, raw_payload: {} });
    await writeFixture("data/snapshots/" + collectionId + "/v1.json", snapshot);
    await writeFixture("data/snapshots/" + collectionId + "/pack-v1.json", buildSearchEvidencePack(snapshot, raw, { generatedAt: "2026-09-29T00:00:00.000Z" }));
  }
  const reviewCollectionId = "col_1790695616409";
const reviewPack = buildSearchEvidencePack(
  snapshotFixture(reviewCollectionId),
  rawSnapshot(reviewCollectionId),
  { generatedAt: "2026-09-29T00:00:00.000Z" },
);
  await writeFixture("data/snapshots/" + reviewCollectionId + "/pack-v1.json", reviewPack);
  await writeFixture("data/reviews/" + reviewCollectionId + "/review-v5.json", {
    review_id: "review_" + reviewCollectionId,
    collection_id: reviewCollectionId,
    review_version: 5,
    reviewer_selection: reviewPack.keywords.map((keyword) => ({ keyword_id: keyword.keyword_id, decision: "SELECTED", reviewer_note: "" })),
  });

  const testNames = (await readdir(new URL("./", import.meta.url))).filter((name) => name.endsWith(".test.mjs")).sort();
  for (const name of testNames) await import(pathToFileURL(join(projectRoot, "tests", name)).href);
} finally {
  process.chdir(projectRoot);
  await rm(workspace, { recursive: true, force: true });
}
