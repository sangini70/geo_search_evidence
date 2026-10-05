import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const rawDirectory = dataDirectory("raw");

export async function saveRawSnapshot(collectionId, snapshot, { sourceRunId = null } = {}) {
  const targetDirectory = sourceRunId ? join(rawDirectory, collectionId) : rawDirectory;
  await mkdir(targetDirectory, { recursive: true });
  const fileName = sourceRunId ? `${sourceRunId}.json` : `${collectionId}.json`;
  const filePath = join(targetDirectory, fileName);
  try {
    await access(filePath);
    const error = new Error(`RAW snapshot already exists: ${fileName}`);
    error.code = "RAW_SNAPSHOT_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "RAW_SNAPSHOT_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const relativePath = sourceRunId ? `data/raw/${collectionId}/${fileName}` : `data/raw/${fileName}`;
  await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  const backup = await backupRuntimeArtifact(filePath, relativePath);
  return { fileName, relativePath, backup };
}
