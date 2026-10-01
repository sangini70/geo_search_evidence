import { readFile } from "node:fs/promises";
import { normalizeNaverRawSnapshot } from "../normalizers/naver-search-demand-normalizer.mjs";
import { validateNaverNormalizedRecords } from "../validators/naver-search-demand-validator.mjs";

export async function normalizeAndValidateRawSnapshot(rawReference = "data/raw/col_1790640999226.json") {
  const snapshot = JSON.parse(await readFile(rawReference, "utf8"));
  const normalized = normalizeNaverRawSnapshot(snapshot, rawReference);
  const validated = validateNaverNormalizedRecords(normalized);
  return { rawReference, normalized, validated };
}
