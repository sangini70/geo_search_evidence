export type CollectionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
export type EvidenceLayer = "RAW" | "NORMALIZED" | "DERIVED" | "USER_PROVIDED" | "AI_DERIVED";
export type EvidenceStatus = "VALID" | "INVALID" | "MISSING" | "UNAVAILABLE" | "ERROR" | "PENDING";
export type SourceStatus = "ACTIVE" | "EXPERIMENTAL" | "LEGACY" | "DEPRECATED" | "DISABLED";
export type ErrorType = "AUTH_ERROR" | "RATE_LIMIT" | "TIMEOUT" | "NETWORK_ERROR" | "SOURCE_CHANGED" | "PARSE_ERROR" | "NO_RESULT" | "VALIDATION_ERROR" | "CONFIG_ERROR" | "UNKNOWN_ERROR";

export interface Collection {
  collection_id: string;
  seed_keyword: string;
  started_at: string;
  completed_at: string | null;
  status: CollectionStatus;
  schema_version: string;
  app_version?: string | null;
}

export interface Keyword {
  keyword_id: string;
  raw_keyword: string;
  normalized_keyword: string;
  seed_keyword: string;
  first_seen_at: string;
  discovery_sources: string[];
  collection_id: string;
}

export interface Evidence {
  evidence_id: string;
  collection_id: string;
  keyword_id: string;
  evidence_type: string;
  evidence_layer: EvidenceLayer;
  source_id: string;
  source_type: string;
  provider: string;
  collection_method: string;
  collected_at: string;
  status: EvidenceStatus;
  value?: unknown;
  raw_value?: unknown;
  unit?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Source {
  source_id: string;
  provider: string;
  product: string;
  source_type: string;
  status: SourceStatus;
  collection_method: string;
  collector_version: string;
  official: boolean;
  last_verified_at: string | null;
}

export interface DerivedMetric {
  metric_id: string;
  collection_id: string;
  keyword_id: string;
  metric_type: string;
  value: unknown;
  unit: string | null;
  formula: string;
  formula_version: string;
  input_evidence_ids: string[];
  calculated_at: string;
  status: EvidenceStatus;
}

export interface ErrorRecord {
  error_id: string;
  collection_id: string;
  collector_id: string;
  source_id: string;
  error_type: ErrorType;
  message: string;
  occurred_at: string;
  retryable: boolean;
  keyword_id?: string;
  raw_error?: unknown;
}

export interface SourcePreflightResult {
  source_id: string;
  source_active: boolean;
  credential_configured: boolean;
  collector_available: boolean;
  registry_status: SourceStatus;
  verified_configuration: boolean;
  status: "READY" | "NOT_READY" | "UNVERIFIED";
}
