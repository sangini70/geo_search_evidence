import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const snapshotDirectory = fileURLToPath(new URL("../../data/snapshots/", import.meta.url));

export async function saveCollectionSnapshot(collectionId, snapshot, { snapshotVersion = null } = {}) {
  const targetDirectory = snapshotVersion == null ? snapshotDirectory : join(snapshotDirectory, collectionId);
  await mkdir(targetDirectory, { recursive: true });
  const fileName = snapshotVersion == null ? `${collectionId}.json` : `v${snapshotVersion}.json`;
  const relativePath = snapshotVersion == null ? `data/snapshots/${fileName}` : `data/snapshots/${collectionId}/${fileName}`;
  const filePath = join(targetDirectory, fileName);
  try {
    await access(filePath);
    const error = new Error(`Snapshot already exists: ${fileName}`);
    error.code = "SNAPSHOT_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "SNAPSHOT_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return { fileName, relativePath };
}
