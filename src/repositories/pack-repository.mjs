import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const snapshotDirectory = fileURLToPath(new URL("../../data/snapshots/", import.meta.url));

export async function saveSearchEvidencePack(collectionId, pack, { packVersion = 1 } = {}) {
  const directory = join(snapshotDirectory, collectionId);
  const fileName = `pack-v${packVersion}.json`;
  const filePath = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(filePath);
    const error = new Error(`Pack already exists: ${fileName}`);
    error.code = "PACK_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "PACK_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(filePath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { relativePath: `data/snapshots/${collectionId}/${fileName}`, fileName };
}

export async function readSearchEvidencePack(collectionId, { packVersion = 1 } = {}) {
  const fileName = `pack-v${packVersion}.json`;
  const filePath = join(snapshotDirectory, collectionId, fileName);
  return JSON.parse(await readFile(filePath, "utf8"));
}
