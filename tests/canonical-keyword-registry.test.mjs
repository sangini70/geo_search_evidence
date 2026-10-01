import assert from "node:assert/strict";
import { createCanonicalKeywordRegistry } from "../src/core/canonical-keyword-registry.mjs";
import { createCollectionIdGenerator } from "../src/core/id-generator.mjs";

const firstCollection = "col_registry_one";
const firstGenerator = createCollectionIdGenerator(firstCollection);
const firstRegistry = createCanonicalKeywordRegistry({ collectionId: firstCollection, idGenerator: firstGenerator });

const seed = firstRegistry.register({ normalizedKeyword: "달러", rawKeyword: "달러", keywordRole: "HUB_SEED", sourceId: "NAVER_SEARCH_ADS", sourceRunId: "sr_registry_one_001" });
const sameSeed = firstRegistry.register({ normalizedKeyword: "달러", rawKeyword: "달러", keywordRole: "HUB_SEED", sourceId: "NAVER_API_HUB_WEBKR", sourceRunId: "sr_registry_one_002" });
assert.equal(sameSeed.keyword_id, seed.keyword_id);
assert.equal(firstRegistry.records().length, 1);
assert.equal(firstRegistry.records()[0].discovery_sources.length, 2);

const related = firstRegistry.register({ normalizedKeyword: "달러환율", rawKeyword: "달러환율", keywordRole: "RELATED_KEYWORD", discoveredFrom: seed.keyword_id, sourceId: "NAVER_SEARCH_ADS", sourceRunId: "sr_registry_one_001" });
const duplicateRelated = firstRegistry.register({ normalizedKeyword: "달러환율", rawKeyword: "달러환율", keywordRole: "RELATED_KEYWORD", discoveredFrom: seed.keyword_id, sourceId: "GOOGLE_ADS", sourceRunId: "sr_registry_one_003" });
assert.notEqual(related.keyword_id, seed.keyword_id);
assert.equal(duplicateRelated.keyword_id, related.keyword_id);
assert.equal(firstRegistry.records().length, 2);
assert.equal(firstGenerator.nextKeywordId(), `kw_${firstCollection}_003`);

const secondCollection = "col_registry_two";
const secondRegistry = createCanonicalKeywordRegistry({ collectionId: secondCollection, idGenerator: createCollectionIdGenerator(secondCollection) });
const sameKeywordOtherCollection = secondRegistry.register({ normalizedKeyword: "달러", rawKeyword: "달러", keywordRole: "HUB_SEED" });
assert.notEqual(sameKeywordOtherCollection.keyword_id, seed.keyword_id);
assert.equal(sameKeywordOtherCollection.collection_id, secondCollection);

assert.equal(firstGenerator.nextEvidenceId(), `ev_${firstCollection}_001`);
assert.equal(firstGenerator.nextMetricId(), `metric_${firstCollection}_001`);
assert.equal(firstGenerator.nextSourceRunId(), `sr_${firstCollection}_001`);
console.log("Canonical Keyword Registry tests passed.");
