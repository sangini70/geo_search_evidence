import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const initialDiscoveryRoot = dataDirectory("research-sessions");

export async function listInitialDiscoveryVersions(researchSessionId) {
  const directory = join(initialDiscoveryRoot, researchSessionId);
  try {
    return (await readdir(directory))
      .filter((entry) => /^initial-discovery-v\d+\.json$/u.test(entry))
      .map((entry) => ({ projection_version: Number(entry.match(/^initial-discovery-v(\d+)\.json$/u)[1]) }))
      .sort((a, b) => a.projection_version - b.projection_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveInitialDiscoveryProjection(projection) {
  if (!projection?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  const versions = await listInitialDiscoveryVersions(projection.research_session_id);
  const projectionVersion = (versions.at(-1)?.projection_version || 0) + 1;
  const directory = join(initialDiscoveryRoot, projection.research_session_id);
  const fileName = `initial-discovery-v${projectionVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Initial Discovery Projection already exists: ${fileName}`);
    error.code = "INITIAL_DISCOVERY_PROJECTION_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "INITIAL_DISCOVERY_PROJECTION_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const saved = { ...projection, projection_version: projectionVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${projection.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { projection: saved, relativePath, fileName, backup };
}

export async function readInitialDiscoveryProjection(researchSessionId, { projectionVersion = null } = {}) {
  const versions = await listInitialDiscoveryVersions(researchSessionId);
  const version = projectionVersion == null ? versions.at(-1)?.projection_version : Number(projectionVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(initialDiscoveryRoot, researchSessionId, `initial-discovery-v${version}.json`), "utf8"));
}
