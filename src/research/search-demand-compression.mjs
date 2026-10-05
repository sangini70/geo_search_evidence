import { readCollectionSnapshot } from "../repositories/snapshot-repository.mjs";
import { saveSearchDemandCompression } from "../repositories/search-demand-compression-repository.mjs";

function unique(values) { return [...new Set(values.filter((value) => value != null))]; }
function comparable(value) { return String(value || "").normalize("NFC").toLocaleLowerCase("ko-KR").replace(/\s+/gu, ""); }

export function classifyKeywordRelation(left, right) {
  if (left.normalized_keyword === right.normalized_keyword) return "EXACT_SAME";
  const leftComparable = comparable(left.normalized_keyword);
  const rightComparable = comparable(right.normalized_keyword);
  if (leftComparable === rightComparable) return "FORMAT_VARIANT_CANDIDATE";
  if (leftComparable && rightComparable && (leftComparable.includes(rightComparable) || rightComparable.includes(leftComparable))) return "RELATED_CANDIDATE";
  return "REVIEW_REQUIRED";
}

function coverageState(values, availableState = "AVAILABLE") {
  if (values.some((value) => value === "FAILED")) return "FAILED";
  if (values.some((value) => value === "NOT_AVAILABLE")) return "NOT_AVAILABLE";
  return values.length && values.every((value) => value === availableState) ? availableState : "NOT_COLLECTED";
}

export async function buildSearchDemandCompression({ integration, snapshotReader = readCollectionSnapshot, now = new Date().toISOString() } = {}) {
  if (!integration?.research_session_id) throw new Error("RESEARCH_SESSION_INTEGRATION_REQUIRED");
  const snapshots = [];
  for (const collection of integration.collection_results || []) {
    if (!collection.collection_id) continue;
    try { snapshots.push({ collection, snapshot: await snapshotReader(collection.collection_id, { snapshotVersion: 1 }) }); } catch { /* Preserve failed collection relation without inventing evidence. */ }
  }

  const sourceEvidenceIds = [];
  const sourceMetricIds = [];
  const rawReferences = [];
  const searchVolumeStates = [];
  const webStates = [];
  const trendStates = [];
  let evidenceCount = 0;
  let metricCount = 0;
  for (const { snapshot } of snapshots) {
    const evidence = snapshot.evidence || [];
    const metrics = snapshot.derived_metrics || [];
    evidenceCount += evidence.length;
    metricCount += metrics.length;
    sourceEvidenceIds.push(...evidence.map((item) => item.evidence_id));
    sourceMetricIds.push(...metrics.map((item) => item.metric_id));
    rawReferences.push(...(snapshot.raw_references || []));
    searchVolumeStates.push(evidence.some((item) => ["MONTHLY_SEARCH_VOLUME_PC", "MONTHLY_SEARCH_VOLUME_MOBILE"].includes(item.evidence_type)) ? "AVAILABLE" : "NOT_AVAILABLE");
    webStates.push(evidence.some((item) => item.evidence_type === "SEARCH_RESULT_TOTAL") ? "AVAILABLE" : "NOT_AVAILABLE");
    trendStates.push(evidence.some((item) => item.evidence_type === "SEARCH_TREND") ? "AVAILABLE" : "NOT_COLLECTED");
  }

  const relationCandidates = [];
  const keywords = integration.session_keywords || [];
  for (let index = 0; index < keywords.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < keywords.length; otherIndex += 1) {
      const relation = classifyKeywordRelation(keywords[index], keywords[otherIndex]);
      if (["FORMAT_VARIANT_CANDIDATE", "RELATED_CANDIDATE"].includes(relation)) relationCandidates.push({ relation_id: `relation_${index + 1}_${otherIndex + 1}`, relation, left_keyword: keywords[index].normalized_keyword, right_keyword: keywords[otherIndex].normalized_keyword, status: "NOT_CONFIRMED" });
    }
  }

  const coverage = {
    search_volume: coverageState(searchVolumeStates),
    web: coverageState(webStates),
    trend: coverageState(trendStates),
    provenance: rawReferences.length === snapshots.length * 2 && snapshots.length > 0 ? "COMPLETE" : snapshots.length ? "PARTIAL" : "MISSING",
  };
  coverage.overall = Object.values(coverage).every((value) => ["AVAILABLE", "COMPLETE"].includes(value)) ? "AVAILABLE" : "PARTIAL";

  return {
    compression_id: `research_session_compression_${integration.research_session_id}`,
    research_session_id: integration.research_session_id,
    created_at: now,
    source_integration: {
      integration_version: integration.integration_version || 1,
      target_count: integration.target_count,
      collection_count: integration.collection_count,
      unique_keyword_count: integration.unique_keyword_count,
      evidence_count: integration.evidence_count,
      metric_count: integration.metric_count,
    },
    demand_clusters: [],
    relationship_candidates: relationCandidates,
    representative_entrance_candidates: [],
    grounded_question_links: [],
    unclustered_keyword_ids: keywords.flatMap((keyword) => keyword.keyword_ids || [keyword.normalized_keyword]),
    coverage_summary: coverage,
    lineage: {
      source_keyword_ids: keywords.flatMap((keyword) => keyword.keyword_ids || [keyword.normalized_keyword]),
      source_evidence_ids: unique(sourceEvidenceIds),
      source_metric_ids: unique(sourceMetricIds),
      raw_references: unique(rawReferences),
    },
    evidence_count: evidenceCount,
    metric_count: metricCount,
  };
}

export async function createSearchDemandCompression(options = {}) {
  const compression = await buildSearchDemandCompression(options);
  return saveSearchDemandCompression(compression);
}
