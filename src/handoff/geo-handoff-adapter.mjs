import { validateSearchEvidencePack } from "../pack/search-evidence-pack-builder.mjs";

export class GeoHandoffContractError extends Error {
  constructor(violations) {
    super(`GEO_HANDOFF_CONTRACT_INVALID: ${violations.join(", ")}`);
    this.name = "GeoHandoffContractError";
    this.code = "GEO_HANDOFF_CONTRACT_INVALID";
    this.violations = violations;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function indexBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

function validateHandoffInput(pack) {
  const violations = [];
  if (!pack || typeof pack !== "object") return ["PACK_REQUIRED"];
  for (const field of ["metadata", "collection", "hub_seed", "keywords", "source_runs", "evidence", "derived_metrics", "coverage", "errors", "source_provenance", "raw_references", "competition_ratio"]) {
    if (pack[field] == null) violations.push(`REQUIRED_FIELD_MISSING:${field}`);
  }
  if (violations.length) return violations;
  const packValidation = validateSearchEvidencePack(pack);
  if (!packValidation.valid) violations.push(...packValidation.errors);
  if (!pack.metadata.schema_version) violations.push("SCHEMA_VERSION_MISSING");
  if (!pack.metadata.pack_version) violations.push("PACK_VERSION_MISSING");
  if (!pack.collection.collection_id) violations.push("COLLECTION_ID_MISSING");
  if (!pack.hub_seed.keyword_id) violations.push("HUB_SEED_ID_MISSING");
  if (pack.keywords.filter((keyword) => keyword.keyword_role === "HUB_SEED").length !== 1) violations.push("HUB_SEED_COUNT_INVALID");
  return violations;
}

function createKeywordDelivery(keyword, evidence, metric, coverage) {
  const byType = indexBy(evidence, "evidence_type");
  return {
    ...clone(keyword),
    search_demand_evidence: {
      monthly_search_volume_pc: byType.get("MONTHLY_SEARCH_VOLUME_PC") ? clone(byType.get("MONTHLY_SEARCH_VOLUME_PC")) : null,
      monthly_search_volume_mobile: byType.get("MONTHLY_SEARCH_VOLUME_MOBILE") ? clone(byType.get("MONTHLY_SEARCH_VOLUME_MOBILE")) : null,
      provider_competition_evidence: byType.get("PROVIDER_COMPETITION_VALUE") ? clone(byType.get("PROVIDER_COMPETITION_VALUE")) : null,
    },
    monthly_search_volume_total: metric ? clone(metric) : null,
    total_search_volume_status: metric?.status || coverage?.total_search_volume || "NOT_AVAILABLE",
    web_search_result_total: byType.get("SEARCH_RESULT_TOTAL") ? clone(byType.get("SEARCH_RESULT_TOTAL")) : null,
    coverage: clone(coverage || {}),
  };
}

export function adaptSearchEvidencePack(pack) {
  const violations = validateHandoffInput(pack);
  if (violations.length) throw new GeoHandoffContractError(violations);

  const evidenceByKeyword = new Map();
  for (const evidence of pack.evidence) {
    const canonicalKeywordId = pack.keyword_id_aliases?.[evidence.keyword_id] || evidence.keyword_id;
    if (!evidenceByKeyword.has(canonicalKeywordId)) evidenceByKeyword.set(canonicalKeywordId, []);
    evidenceByKeyword.get(canonicalKeywordId).push(evidence);
  }
  const metricsByKeyword = new Map(pack.derived_metrics.map((metric) => [metric.keyword_id, metric]));
  const keywordDeliveries = pack.keywords.map((keyword) => createKeywordDelivery(keyword, evidenceByKeyword.get(keyword.keyword_id) || [], metricsByKeyword.get(keyword.keyword_id) || null, pack.coverage[keyword.keyword_id]));

  return {
    handoff_version: "1.0",
    schema_version: pack.metadata.schema_version,
    pack_version: pack.metadata.pack_version,
    collection: clone(pack.collection),
    collection_id: pack.collection.collection_id,
    hub_seed: clone(pack.hub_seed),
    canonical_keywords: clone(pack.keywords),
    keyword_deliveries: keywordDeliveries,
    source_runs: clone(pack.source_runs),
    evidence: clone(pack.evidence),
    derived_metrics: clone(pack.derived_metrics),
    coverage: clone(pack.coverage),
    errors: clone(pack.errors),
    source_provenance: clone(pack.source_provenance),
    raw_references: clone(pack.raw_references),
    competition_ratio: clone(pack.competition_ratio),
  };
}
