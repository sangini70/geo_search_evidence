function sequenceLabel(sequence) {
  return String(sequence).padStart(3, "0");
}

export function createCollectionIdGenerator(collectionId) {
  let evidenceSequence = 0;
  let metricSequence = 0;
  let keywordSequence = 0;
  let errorSequence = 0;
  let sourceRunSequence = 0;

  return Object.freeze({
    nextEvidenceId() { evidenceSequence += 1; return `ev_${collectionId}_${sequenceLabel(evidenceSequence)}`; },
    nextMetricId() { metricSequence += 1; return `metric_${collectionId}_${sequenceLabel(metricSequence)}`; },
    nextKeywordId() { keywordSequence += 1; return `kw_${collectionId}_${sequenceLabel(keywordSequence)}`; },
    nextErrorId() { errorSequence += 1; return `err_${collectionId}_${sequenceLabel(errorSequence)}`; },
    nextSourceRunId() { sourceRunSequence += 1; return `sr_${collectionId}_${sequenceLabel(sourceRunSequence)}`; },
  });
}
