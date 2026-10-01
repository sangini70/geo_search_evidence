import { COMPETITION_RATIO, SCHEMA_VERSION } from "../core/constants.mjs";
import { getNaverPreflight } from "../config/index.mjs";
import { collectNaverRaw as collectNaverSearchAdsSource } from "../collectors/naver-search-demand-collector.mjs";
import { createCollectionIdGenerator } from "../core/id-generator.mjs";
import { runMultiSourceCollection } from "./multi-source-collection-orchestrator.mjs";
import { readSearchEvidencePack } from "../repositories/pack-repository.mjs";
import { readReviewSelection, saveReviewSelection, listReviewVersions } from "../repositories/review-selection-repository.mjs";
import { readGeoHandoff, saveGeoHandoff, listGeoHandoffVersions } from "../repositories/geo-handoff-repository.mjs";
import { buildGeoHandoffFromReview } from "../handoff/review-selection-handoff.mjs";

export function getStatus(seedKeyword = "달러") {
  return Object.freeze({
    name: "GEO Search Evidence Collector",
    stage: "Stage 5-1 — RAW Evidence Collection",
    schemaVersion: SCHEMA_VERSION,
    status: "READY_FOR_COLLECTION",
    sourcePreflight: getNaverPreflight(seedKeyword),
    competitionRatio: COMPETITION_RATIO,
  });
}

export function collectNaverRaw(seedKeyword) {
  const collectionId = `col_${Date.now()}`;
  const sourceRunId = createCollectionIdGenerator(collectionId).nextSourceRunId();
  return collectNaverSearchAdsSource(seedKeyword, { collectionId, sourceRunId });
}

export function collectMultiSource(seedKeyword, options = {}) {
  return runMultiSourceCollection(seedKeyword, options);
}

export function getSearchEvidencePack(collectionId, options = {}) {
  return readSearchEvidencePack(collectionId, options);
}

export async function getReviewSelection(collectionId, options = {}) {
  return { review: await readReviewSelection(collectionId, options), versions: await listReviewVersions(collectionId) };
}

export function validateReviewSelection(pack, reviewerSelection) {
  const candidates = new Map(pack.keywords.map((keyword) => [keyword.keyword_id, keyword]));
  const errors = [];
  if (!Array.isArray(reviewerSelection) || reviewerSelection.length !== candidates.size) return ["REVIEW_SELECTION_MUST_COVER_ALL_CANDIDATES"];
  const seen = new Set();
  for (const item of reviewerSelection) {
    if (!item || !candidates.has(item.keyword_id) || seen.has(item.keyword_id)) errors.push("REVIEW_SELECTION_KEYWORD_REFERENCE_INVALID");
    if (!["SELECTED", "EXCLUDED", "UNDECIDED"].includes(item?.decision)) errors.push("REVIEW_SELECTION_DECISION_INVALID");
    if (item?.reviewer_note != null && typeof item.reviewer_note !== "string") errors.push("REVIEWER_NOTE_INVALID");
    if (item?.keyword_id) seen.add(item.keyword_id);
  }
  if (seen.size !== candidates.size) errors.push("REVIEW_SELECTION_KEYWORD_MISSING");
  return [...new Set(errors)];
}

export async function createReviewSelection({ collectionId, packVersion = 1, reviewerSelection, reviewerId = null } = {}) {
  const pack = await readSearchEvidencePack(collectionId, { packVersion });
  const errors = validateReviewSelection(pack, reviewerSelection);
  if (errors.length) throw new Error(errors.join(","));
  const now = new Date().toISOString();
  return saveReviewSelection({
    review_id: `review_${collectionId}`,
    collection_id: collectionId,
    pack_version: String(pack.metadata.pack_version),
    created_at: now,
    updated_at: now,
    reviewer_id: reviewerId,
    reviewer_selection: reviewerSelection.map((item) => ({ keyword_id: item.keyword_id, decision: item.decision, reviewer_note: item.reviewer_note || "" })),
  });
}

export async function createGeoHandoff({ collectionId, reviewVersion = null, packVersion = 1 } = {}) {
  const [pack, review] = await Promise.all([readSearchEvidencePack(collectionId, { packVersion }), readReviewSelection(collectionId, { reviewVersion })]);
  if (!review) { const error = new Error("REVIEW_NOT_FOUND"); error.code = "REVIEW_NOT_FOUND"; throw error; }
  return saveGeoHandoff(buildGeoHandoffFromReview(pack, review));
}

export async function getGeoHandoff(collectionId, options = {}) {
  return { handoff: await readGeoHandoff(collectionId, options), versions: await listGeoHandoffVersions(collectionId) };
}
