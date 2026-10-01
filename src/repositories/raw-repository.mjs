import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const rawDirectory = fileURLToPath(new URL("../../data/raw/", import.meta.url));

export async function saveRawSnapshot(collectionId, snapshot, { sourceRunId = null } = {}) {
  const targetDirectory = sourceRunId ? join(rawDirectory, collectionId) : rawDirectory;
  await mkdir(targetDirectory, { recursive: true });
  const fileName = sourceRunId ? `${sourceRunId}.json` : `${collectionId}.json`;
  const filePath = join(targetDirectory, fileName);
  if (sourceRunId) {
    try {
      await access(filePath);
      const error = new Error(`RAW snapshot already exists: ${fileName}`);
      error.code = "RAW_SNAPSHOT_ALREADY_EXISTS";
      throw error;
    } catch (error) {
      if (error.code === "RAW_SNAPSHOT_ALREADY_EXISTS") throw error;
      if (error.code !== "ENOENT") throw error;
    }
  }
  const relativePath = sourceRunId ? `data/raw/${collectionId}/${fileName}` : `data/raw/${fileName}`;
  await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return { fileName, relativePath };
}
