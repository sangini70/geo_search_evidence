function sourceReference({ sourceId = null, sourceRunId = null } = {}) {
  return { source_id: sourceId, source_run_id: sourceRunId };
}

export function createCanonicalKeywordRegistry({ collectionId, idGenerator, firstSeenAt = new Date().toISOString() }) {
  const recordsByNormalizedKeyword = new Map();

  function register({ normalizedKeyword, rawKeyword = normalizedKeyword, keywordRole = "RELATED_KEYWORD", discoveredFrom = null, sourceId = null, sourceRunId = null, status = "VALID" }) {
    if (typeof normalizedKeyword !== "string" || !normalizedKeyword) throw new Error("CANONICAL_KEYWORD_REQUIRED");
    const existing = recordsByNormalizedKeyword.get(normalizedKeyword);
    const reference = sourceReference({ sourceId, sourceRunId });
    if (existing) {
      if (keywordRole === "HUB_SEED" && existing.keyword_role !== "HUB_SEED") throw new Error(`CANONICAL_KEYWORD_ROLE_CONFLICT:${normalizedKeyword}`);
      if (!existing.discovery_sources.some((item) => item.source_id === reference.source_id && item.source_run_id === reference.source_run_id)) existing.discovery_sources.push(reference);
      return existing;
    }
    const record = {
      keyword_id: idGenerator.nextKeywordId(),
      collection_id: collectionId,
      raw_keyword: rawKeyword,
      normalized_keyword: normalizedKeyword,
      keyword_role: keywordRole,
      discovered_from: discoveredFrom,
      discovery_sources: sourceId || sourceRunId ? [reference] : [],
      source_run_id: sourceRunId,
      first_seen_at: firstSeenAt,
      status,
    };
    recordsByNormalizedKeyword.set(normalizedKeyword, record);
    return record;
  }

  function find(normalizedKeyword) {
    return recordsByNormalizedKeyword.get(normalizedKeyword) || null;
  }

  function records() {
    return [...recordsByNormalizedKeyword.values()].map((record) => ({ ...record, discovery_sources: record.discovery_sources.map((source) => ({ ...source })) }));
  }

  return Object.freeze({ register, find, records });
}
