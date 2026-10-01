export const validatorContract = Object.freeze({
  checks: ["REQUIRED_FIELD", "VALUE_TYPE", "MISSING", "PROVIDER_SPECIAL_VALUE", "EVIDENCE_STATUS"],
  invalidData: "EXCLUDED_FROM_DERIVED_METRICS",
  rawData: "PRESERVED",
  errorRecord: "CREATED_WHEN_NEEDED",
});
