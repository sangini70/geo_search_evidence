import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const root = dataDirectory("research-sessions");
const pattern = /^artifact-invalidation-v(\d+)\.json$/u;

export async function listResearchArtifactInvalidationVersions(researchSessionId) {
  try {
    return (await readdir(join(root, researchSessionId)))
      .filter((name) => pattern.test(name))
      .map((name) => Number(name.match(pattern)[1]))
      .sort((left, right) => left - right)
      .map((invalidationVersion) => ({ invalidation_version: invalidationVersion }));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export function buildResearchArtifactInvalidation({
  researchSessionId,
  invalidatedArtifacts = [],
  reasonCode,
  reason,
  replacementStartStage,
  createdAt = new Date().toISOString(),
  invalidationVersion = 1,
} = {}) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  if (!reasonCode) throw new Error("INVALIDATION_REASON_CODE_REQUIRED");
  if (!replacementStartStage) throw new Error("INVALIDATION_REPLACEMENT_STAGE_REQUIRED");
  return {
    artifact_invalidation_id: `artifact_invalidation_${researchSessionId}_${invalidationVersion}`,
    research_session_id: researchSessionId,
    invalidation_version: invalidationVersion,
    invalidated_artifacts: invalidatedArtifacts.map((artifact) => ({
      artifact_type: artifact.artifact_type,
      version: Number(artifact.version),
      relative_path: artifact.relative_path || null,
    })),
    reason_code: reasonCode,
    reason: reason || null,
    created_at: createdAt,
    replacement_start_stage: replacementStartStage,
  };
}

export async function saveResearchArtifactInvalidation({
  researchSessionId,
  invalidatedArtifacts = [],
  reasonCode,
  reason,
  replacementStartStage,
  createdAt,
} = {}) {
  const versions = await listResearchArtifactInvalidationVersions(researchSessionId);
  const invalidationVersion = (versions.at(-1)?.invalidation_version || 0) + 1;
  const directory = join(root, researchSessionId);
  const fileName = `artifact-invalidation-v${invalidationVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Artifact invalidation already exists: ${fileName}`);
    error.code = "ARTIFACT_INVALIDATION_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "ARTIFACT_INVALIDATION_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const invalidation = buildResearchArtifactInvalidation({ researchSessionId, invalidatedArtifacts, reasonCode, reason, replacementStartStage, createdAt, invalidationVersion });
  await writeFile(path, `${JSON.stringify(invalidation, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${researchSessionId}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { invalidation, relativePath, fileName, backup };
}

export async function readResearchArtifactInvalidation(researchSessionId, { invalidationVersion = null } = {}) {
  const versions = await listResearchArtifactInvalidationVersions(researchSessionId);
  const version = invalidationVersion == null ? versions.at(-1)?.invalidation_version : Number(invalidationVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(root, researchSessionId, `artifact-invalidation-v${version}.json`), "utf8"));
}
