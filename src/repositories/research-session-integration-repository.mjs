import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const integrationRoot = dataDirectory("research-sessions");

export async function listResearchSessionIntegrationVersions(researchSessionId) {
  const directory = join(integrationRoot, researchSessionId);
  try {
    const entries = await readdir(directory);
    return entries.filter((entry) => /^integration-v\d+\.json$/.test(entry)).map((entry) => ({ integration_version: Number(entry.match(/^integration-v(\d+)\.json$/)[1]) })).sort((a, b) => a.integration_version - b.integration_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveResearchSessionIntegration(integration) {
  const versions = await listResearchSessionIntegrationVersions(integration.research_session_id);
  const integrationVersion = (versions.at(-1)?.integration_version || 0) + 1;
  const directory = join(integrationRoot, integration.research_session_id);
  const fileName = `integration-v${integrationVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Research Session Integration already exists: ${fileName}`);
    error.code = "RESEARCH_SESSION_INTEGRATION_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "RESEARCH_SESSION_INTEGRATION_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const saved = { ...integration, integration_version: integrationVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${integration.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { integration: saved, relativePath, fileName, backup };
}

export async function readResearchSessionIntegration(researchSessionId, { integrationVersion = null } = {}) {
  const versions = await listResearchSessionIntegrationVersions(researchSessionId);
  const version = integrationVersion == null ? versions.at(-1)?.integration_version : Number(integrationVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(integrationRoot, researchSessionId, `integration-v${version}.json`), "utf8"));
}
