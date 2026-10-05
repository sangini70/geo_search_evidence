const EXCLUDED = "EXCLUDED";

export function buildCollectionTargets(researchSeeds = []) {
  const targets = researchSeeds
    .filter((seed) => seed.status !== EXCLUDED)
    .map((seed) => ({
      research_target_id: `research_target_${seed.research_seed_id}`,
      keyword: seed.seed_text,
      decision: seed.status,
      source_types: [...(seed.source_types || [])],
      source_references: (seed.source_references || []).map((reference) => ({ ...reference })),
      reviewer_stages: [...(seed.reviewer_stages || [])],
      reason: seed.reason || "",
      collection_status: "READY",
    }));
  return { status: targets.length > 0 ? "READY" : "NOT_READY", count: targets.length, targets };
}
