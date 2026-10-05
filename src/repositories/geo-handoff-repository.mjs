import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const handoffRoot = dataDirectory("handoffs");

function fileName(handoffVersion, reviewVersion) { return `handoff-v${handoffVersion}-r${reviewVersion}.json`; }

export async function listGeoHandoffVersions(collectionId) {
  const directory = join(handoffRoot, collectionId);
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => /^handoff-v\d+-r\d+\.json$/.test(entry))
      .map((entry) => { const match = entry.match(/^handoff-v(\d+)-r(\d+)\.json$/); return { handoff_version: Number(match[1]), review_version: Number(match[2]) }; })
      .sort((a, b) => a.handoff_version - b.handoff_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveGeoHandoff(handoff) {
  const versions = await listGeoHandoffVersions(handoff.collection_id);
  const handoffVersion = (versions.at(-1)?.handoff_version || 0) + 1;
  const directory = join(handoffRoot, handoff.collection_id);
  const file = fileName(handoffVersion, handoff.review_version);
  const path = join(directory, file);
  await mkdir(directory, { recursive: true });
  try { await access(path); const error = new Error(`Handoff already exists: ${file}`); error.code = "HANDOFF_ALREADY_EXISTS"; throw error; }
  catch (error) { if (error.code === "HANDOFF_ALREADY_EXISTS") throw error; if (error.code !== "ENOENT") throw error; }
  const saved = { ...handoff, handoff_version: handoffVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/handoffs/${handoff.collection_id}/${file}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { handoff: saved, relativePath, fileName: file, backup };
}

export async function readGeoHandoff(collectionId, { handoffVersion = null } = {}) {
  const versions = await listGeoHandoffVersions(collectionId);
  const version = handoffVersion == null ? versions.at(-1)?.handoff_version : Number(handoffVersion);
  if (!version) return null;
  const match = versions.find((item) => item.handoff_version === version);
  if (!match) return null;
  const path = join(handoffRoot, collectionId, fileName(match.handoff_version, match.review_version));
  return JSON.parse(await readFile(path, "utf8"));
}
