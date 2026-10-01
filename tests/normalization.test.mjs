import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { normalizeAndValidateRawSnapshot } from "../src/app/raw-normalization-validation.mjs";
import { normalizeSearchVolumeValue } from "../src/normalizers/naver-search-demand-normalizer.mjs";
import { COMPETITION_RATIO } from "../src/core/constants.mjs";

const rawPath = "data/raw/col_1790640999226.json";
const before = createHash("sha256").update(await readFile(rawPath)).digest("hex");
const result = await normalizeAndValidateRawSnapshot(rawPath);
const after = createHash("sha256").update(await readFile(rawPath)).digest("hex");

assert.ok(result.normalized.total > 0);
assert.equal(result.normalized.failed, 0);
assert.equal(result.validated.validationFailed, 0);
assert.equal(result.normalized.records[0].fields.provider_competition.evidence_type, "PROVIDER_COMPETITION_VALUE");
assert.equal(result.normalized.records[0].raw_reference, rawPath);
assert.equal(result.normalized.records[0].provenance.source, "NAVER_SEARCH_ADS");
assert.deepEqual(normalizeSearchVolumeValue("<10"), { value: null, status: "SUCCESS", normalization: "SPECIAL_VALUE_UNCONVERTED" });
assert.deepEqual(normalizeSearchVolumeValue("< 10"), { value: null, status: "SUCCESS", normalization: "SPECIAL_VALUE_UNCONVERTED" });
assert.equal(before, after);
assert.equal(COMPETITION_RATIO.formula, "NOT_CONFIGURED");
assert.equal(COMPETITION_RATIO.formulaVersion, "NOT_CONFIGURED");
console.log(JSON.stringify({ rawCount: result.normalized.total, normalizationSuccess: result.normalized.success, normalizationFailed: result.normalized.failed, validationSuccess: result.validated.validationSuccess, validationFailed: result.validated.validationFailed, rawUnchanged: before === after, competitionRatio: COMPETITION_RATIO }));
