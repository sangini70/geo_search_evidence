import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const initialDiscoveryRunRoot = dataDirectory("research-sessions");

export async function listInitialDiscoveryRunVersions(researchSessionId) {
  const directory = join(initialDiscoveryRunRoot, researchSessionId);
  try {
    return (await readdir(directory))
      .filter((entry) => /^initial-discovery-run-v\d+\.json$/u.test(entry))
      .map((entry) => ({ run_version: Number(entry.match(/^initial-discovery-run-v(\d+)\.json$/u)[1]) }))
      .sort((a, b) => a.run_version - b.run_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveInitialDiscoveryRun(run) {
  if (!run?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  const versions = await listInitialDiscoveryRunVersions(run.research_session_id);
  const runVersion = (versions.at(-1)?.run_version || 0) + 1;
  const directory = join(initialDiscoveryRunRoot, run.research_session_id);
  const fileName = `initial-discovery-run-v${runVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Initial Discovery Run already exists: ${fileName}`);
    error.code = "INITIAL_DISCOVERY_RUN_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "INITIAL_DISCOVERY_RUN_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const saved = { ...run, run_version: runVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${run.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { run: saved, relativePath, fileName, backup };
}

export async function readInitialDiscoveryRun(researchSessionId, { runVersion = null } = {}) {
  const versions = await listInitialDiscoveryRunVersions(researchSessionId);
  const version = runVersion == null ? versions.at(-1)?.run_version : Number(runVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(initialDiscoveryRunRoot, researchSessionId, `initial-discovery-run-v${version}.json`), "utf8"));
}
