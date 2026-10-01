import assert from "node:assert/strict";
import { runMultiSourceCollection } from "../src/app/multi-source-collection-orchestrator.mjs";

const codePoints = (value) => [...value].map((character) => character.codePointAt(0));
const cases = ["dollar", "달러", "달러환율2026"];

for (const seedKeyword of cases) {
  const searchAdsCollector = async (query, { collectionId, sourceRunId }) => ({
    status: "SUCCESS",
    collectionId,
    sourceRunId,
    rawReference: { relativePath: `data/raw/${collectionId}/${sourceRunId}.json` },
    rawSnapshot: {
      metadata: { provider: "NAVER", source: "NAVER_SEARCH_ADS", product: "NAVER Search Ads API", query, collected_at: "2026-09-29T00:00:00.000Z" },
      raw_payload: { keywordList: [{ relKeyword: query, monthlyPcQcCnt: 100, monthlyMobileQcCnt: 200, compIdx: "중간" }] },
    },
  });
  const webCollector = async (query, { collectionId, sourceRunId }) => ({ ok: true, collectionId, sourceRunId, query, responseStatus: 200, payload: { total: 1, items: [] } });
  const result = await runMultiSourceCollection(seedKeyword, { collectionId: `col_unicode_${codePoints(seedKeyword).join("_")}`, persist: false, searchAdsCollector, webCollector });
  assert.equal(result.snapshot.seed_keyword, seedKeyword);
  assert.deepEqual(codePoints(result.snapshot.seed_keyword), codePoints(seedKeyword));
  assert.ok(result.snapshot.source_provenance.every((item) => item.query === seedKeyword));
  assert.deepEqual(codePoints(result.snapshot.source_provenance[0].query), codePoints(seedKeyword));
}

assert.deepEqual(codePoints("달러"), [45804, 47084]);
console.log("Unicode query regression tests passed.");
