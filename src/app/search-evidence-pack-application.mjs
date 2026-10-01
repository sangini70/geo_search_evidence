import { buildSearchEvidencePackFromFiles, validateSearchEvidencePack } from "../pack/search-evidence-pack-builder.mjs";
import { saveSearchEvidencePack } from "../repositories/pack-repository.mjs";

export async function createSearchEvidencePack({ snapshotPath, searchAdsRawPath, persist = true, packVersion = 1 } = {}) {
  const pack = await buildSearchEvidencePackFromFiles(snapshotPath, searchAdsRawPath, { packVersion: String(packVersion) });
  const validation = validateSearchEvidencePack(pack);
  if (!validation.valid) {
    const error = new Error(`SEARCH_EVIDENCE_PACK_INVALID: ${validation.errors.join(", ")}`);
    error.validation = validation;
    throw error;
  }
  const savedPack = persist ? await saveSearchEvidencePack(pack.metadata.collection_id, pack, { packVersion }) : null;
  return { pack, validation, savedPack };
}
