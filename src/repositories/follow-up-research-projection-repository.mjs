import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const root = dataDirectory("research-sessions");
const pattern = /^follow-up-research-projection-v(\d+)\.json$/u;

export async function listFollowUpResearchProjectionVersions(researchSessionId) {
  try {
    return (await readdir(join(root, researchSessionId))).flatMap((entry) => { const match = entry.match(pattern); return match ? [{ projection_version: Number(match[1]) }] : []; }).sort((a, b) => a.projection_version - b.projection_version);
  } catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

export async function saveFollowUpResearchProjection(projection) {
  if (!projection?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  const version = (await listFollowUpResearchProjectionVersions(projection.research_session_id)).at(-1)?.projection_version + 1 || 1;
  const directory = join(root, projection.research_session_id);
  const fileName = `follow-up-research-projection-v${version}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try { await access(path); const error = new Error("FOLLOW_UP_PROJECTION_ALREADY_EXISTS"); error.code = error.message; throw error; }
  catch (error) { if (error.code === "FOLLOW_UP_PROJECTION_ALREADY_EXISTS") throw error; if (error.code !== "ENOENT") throw error; }
  const saved = { ...projection, projection_version: version };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${projection.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { projection: saved, relativePath, fileName, backup };
}

export async function readFollowUpResearchProjection(researchSessionId, { projectionVersion = null } = {}) {
  const versions = await listFollowUpResearchProjectionVersions(researchSessionId);
  const version = projectionVersion == null ? versions.at(-1)?.projection_version : Number(projectionVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(root, researchSessionId, `follow-up-research-projection-v${version}.json`), "utf8"));
}
