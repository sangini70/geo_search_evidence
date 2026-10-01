function validationError(record, field, message) {
  return { error_type: "VALIDATION_ERROR", message, item_index: record.item_index, field };
}

export function validateNaverNormalizedRecords(normalizationResult) {
  const results = [];
  const errors = [...normalizationResult.errors];
  for (const record of normalizationResult.records) {
    const recordErrors = [];
    const fields = record.fields;
    if (!record.provider || !record.source_id) recordErrors.push(validationError(record, "source", "Provider and Source ID are required."));
    if (!record.provenance?.provider || !record.provenance?.source || !record.provenance?.collected_at || !record.raw_reference) recordErrors.push(validationError(record, "provenance", "Source Provenance and RAW reference are required."));
    if (fields.keyword.status !== "SUCCESS") recordErrors.push(validationError(record, "keyword", "relKeyword is required."));
    for (const fieldName of ["monthly_search_pc", "monthly_search_mobile"]) {
      const field = fields[fieldName];
      if (field.status === "PARSE_FAILED") recordErrors.push(validationError(record, fieldName, "Search volume must be a non-negative number, numeric string, or <10."));
    }
    if (fields.provider_competition.status !== "SUCCESS") recordErrors.push(validationError(record, "provider_competition", "compIdx is required as Provider Competition Evidence."));
    results.push({ ...record, validation_status: recordErrors.length === 0 ? "SUCCESS" : "VALIDATION_FAILED", validation_errors: recordErrors });
    errors.push(...recordErrors);
  }
  const validationSuccess = results.filter((record) => record.validation_status === "SUCCESS").length;
  return { results, errors, total: normalizationResult.total, normalizationSuccess: normalizationResult.success, normalizationFailed: normalizationResult.failed, validationSuccess, validationFailed: results.length - validationSuccess };
}
