import { readFile } from "node:fs/promises";
import { normalizeNaverRawSnapshot } from "../normalizers/naver-search-demand-normalizer.mjs";
import { validateNaverNormalizedRecords } from "../validators/naver-search-demand-validator.mjs";
import { calculateTotalSearchVolume } from "../metrics/total-search-volume-calculator.mjs";
import { createCollectionIdGenerator } from "../core/id-generator.mjs";
import { saveCollectionSnapshot } from "../repositories/snapshot-repository.mjs";

function collectionIdFromPath(rawReference) {
  const match = rawReference.match(/col_[^/\\.]+/);
  if (!match) throw new Error("COLLECTION_ID_NOT_FOUND");
  return match[0];
}

function createErrorRecord(idGenerator, collectionId, record, error, occurredAt) {
  return {
    error_id: idGenerator.nextErrorId(),
    collection_id: collectionId,
    collector_id: "NAVER_SEARCH_DEMAND_NORMALIZATION",
    source_id: "NAVER_SEARCH_ADS",
    error_type: "VALIDATION_ERROR",
    message: error.message,
    occurred_at: occurredAt,
    retryable: false,
    keyword_id: record?.keyword_id || null,
    raw_error: { stage: "DERIVED_METRIC" },
  };
}

export async function runTotalSearchVolumeForRawSnapshot(rawReference = "data/raw/col_1790640999226.json", { persist = true } = {}) {
  const rawSnapshot = JSON.parse(await readFile(rawReference, "utf8"));
  const collectionId = collectionIdFromPath(rawReference);
  const idGenerator = createCollectionIdGenerator(collectionId);
  const normalized = normalizeNaverRawSnapshot(rawSnapshot, rawReference, { collectionId, idGenerator });
  const validated = validateNaverNormalizedRecords(normalized);
  const calculatedAt = new Date().toISOString();
  const evidence = validated.results.flatMap((record) => record.evidence || []);
  const derivedMetrics = [];
  const errors = [];

  for (const record of validated.results) {
    if (record.validation_status !== "SUCCESS") {
      for (const validationError of record.validation_errors) {
        errors.push(createErrorRecord(idGenerator, collectionId, record, new Error(validationError.message), calculatedAt));
      }
      continue;
    }
    try {
      derivedMetrics.push(calculateTotalSearchVolume(record, idGenerator, calculatedAt));
    } catch (error) {
      errors.push(createErrorRecord(idGenerator, collectionId, record, error, calculatedAt));
    }
  }

  const snapshot = {
    snapshot_id: collectionId,
    collection_id: collectionId,
    seed_keyword: rawSnapshot.metadata?.query || null,
    captured_at: calculatedAt,
    keyword_count: normalized.total,
    evidence_count: evidence.length,
    source_summary: rawSnapshot.metadata || null,
    status: errors.length ? "PARTIAL_SUCCESS" : "SUCCESS",
    evidence,
    derived_metrics: derivedMetrics,
    errors,
  };
  const saved = persist ? await saveCollectionSnapshot(collectionId, snapshot) : null;
  return { rawReference, collectionId, normalized, validated, snapshot, saved };
}
