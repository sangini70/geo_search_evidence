import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const reviewRoot = fileURLToPath(new URL("../../data/reviews/", import.meta.url));

function fileName(version) { return `review-v${version}.json`; }

export async function listReviewVersions(collectionId) {
  const directory = join(reviewRoot, collectionId);
  try {
    const entries = await readdir(directory);
    return entries.filter((entry) => /^review-v\d+\.json$/.test(entry)).map((entry) => Number(entry.match(/^review-v(\d+)\.json$/)[1])).sort((a, b) => a - b);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function readReviewSelection(collectionId, { reviewVersion = null } = {}) {
  const versions = await listReviewVersions(collectionId);
  const version = reviewVersion == null ? versions.at(-1) : Number(reviewVersion);
  if (!version) return null;
  const path = join(reviewRoot, collectionId, fileName(version));
  try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

export async function saveReviewSelection(review, { reviewVersion = null } = {}) {
  const versions = await listReviewVersions(review.collection_id);
  const version = reviewVersion == null ? (versions.at(-1) || 0) + 1 : Number(reviewVersion);
  const directory = join(reviewRoot, review.collection_id);
  const path = join(directory, fileName(version));
  await mkdir(directory, { recursive: true });
  try { await access(path); const error = new Error(`Review already exists: ${fileName(version)}`); error.code = "REVIEW_ALREADY_EXISTS"; throw error; }
  catch (error) { if (error.code === "REVIEW_ALREADY_EXISTS") throw error; if (error.code !== "ENOENT") throw error; }
  const saved = { ...review, review_version: version, updated_at: new Date().toISOString() };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  return { review: saved, relativePath: `data/reviews/${review.collection_id}/${fileName(version)}`, fileName: fileName(version) };
}
