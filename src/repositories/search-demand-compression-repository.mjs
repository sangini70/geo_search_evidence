import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const compressionRoot = dataDirectory("research-sessions");

export async function listSearchDemandCompressionVersions(researchSessionId) {
  const directory = join(compressionRoot, researchSessionId);
  try {
    const entries = await readdir(directory);
    return entries.filter((entry) => /^compression-v\d+\.json$/.test(entry)).map((entry) => ({ compression_version: Number(entry.match(/^compression-v(\d+)\.json$/)[1]) })).sort((a, b) => a.compression_version - b.compression_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveSearchDemandCompression(compression) {
  const versions = await listSearchDemandCompressionVersions(compression.research_session_id);
  const compressionVersion = (versions.at(-1)?.compression_version || 0) + 1;
  const directory = join(compressionRoot, compression.research_session_id);
  const fileName = `compression-v${compressionVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Search Demand Compression already exists: ${fileName}`);
    error.code = "SEARCH_DEMAND_COMPRESSION_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "SEARCH_DEMAND_COMPRESSION_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const saved = { ...compression, compression_version: compressionVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${compression.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { compression: saved, relativePath, fileName, backup };
}

export async function readSearchDemandCompression(researchSessionId, { compressionVersion = null } = {}) {
  const versions = await listSearchDemandCompressionVersions(researchSessionId);
  const version = compressionVersion == null ? versions.at(-1)?.compression_version : Number(compressionVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(compressionRoot, researchSessionId, `compression-v${version}.json`), "utf8"));
}
