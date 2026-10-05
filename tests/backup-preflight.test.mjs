import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertBackupPreflight } from "../src/repositories/backup-repository.mjs";
import { runMultiSourceCollection } from "../src/app/multi-source-collection-orchestrator.mjs";

const workspace = process.cwd();
const backupRoot = process.env.GEO_BACKUP_ROOT;
const originalBackupRoot = backupRoot;
let searchCalls = 0;
let webCalls = 0;

async function assertCollectionBlocked(root, reason) {
  process.env.GEO_BACKUP_ROOT = root;
  await assert.rejects(
    () => runMultiSourceCollection("backup-preflight-test", {
      persist: false,
      searchAdsCollector: async () => { searchCalls += 1; throw new Error("COLLECTOR_MUST_NOT_RUN"); },
      webCollector: async () => { webCalls += 1; throw new Error("COLLECTOR_MUST_NOT_RUN"); },
    }),
    (error) => error.code === "BACKUP_PREFLIGHT_FAILED" && error.reason === reason,
  );
}

await assertCollectionBlocked("", "BACKUP_ROOT_REQUIRED");
await assertCollectionBlocked(join(workspace, "backup-does-not-exist"), "BACKUP_ROOT_NOT_FOUND");

const blocker = join(workspace, "backup-preflight-blocker");
await writeFile(blocker, "not a directory\n", "utf8");
await assertCollectionBlocked(blocker, "BACKUP_ROOT_NOT_DIRECTORY");

process.env.GEO_BACKUP_ROOT = originalBackupRoot;
await assertBackupPreflight();
const result = await runMultiSourceCollection("backup-preflight-success", {
  persist: false,
  collectionId: "col_backup_preflight_success",
  searchAdsCollector: async () => { searchCalls += 1; return { status: "FAILED", error: new Error("SYNTHETIC_NO_API") }; },
  webCollector: async () => { webCalls += 1; return { ok: false, error: new Error("SYNTHETIC_NO_API") }; },
});
assert.equal(result.collectionId, "col_backup_preflight_success");
assert.equal(searchCalls, 1);
assert.equal(webCalls, 1);
assert.equal(result.snapshot.status, "FAILED");
assert.equal(process.env.GEO_BACKUP_ROOT, originalBackupRoot);
