import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { backupRuntimeArtifact, BACKUP_STATUS } from "../src/repositories/backup-repository.mjs";
import { saveRawSnapshot } from "../src/repositories/raw-repository.mjs";
import { saveCollectionSnapshot } from "../src/repositories/snapshot-repository.mjs";
import { saveResearchSessionContext } from "../src/repositories/research-session-context-repository.mjs";

const workspace = process.cwd();
const dataRoot = join(workspace, "data");
const backupRoot = join(workspace, "backup");

const raw = await saveRawSnapshot("col_backup_test", { kind: "raw" }, { sourceRunId: "sr_backup_test_001" });
assert.equal(raw.backup.status, BACKUP_STATUS.BACKED_UP);
assert.deepEqual(JSON.parse(await readFile(join(backupRoot, raw.relativePath), "utf8")), { kind: "raw" });
await saveRawSnapshot("col_backup_legacy", { kind: "legacy-raw" });
await assert.rejects(() => saveRawSnapshot("col_backup_legacy", { kind: "legacy-raw" }), /RAW snapshot already exists/);

const snapshot = await saveCollectionSnapshot("col_backup_test", { kind: "snapshot" }, { snapshotVersion: 1 });
assert.equal(snapshot.backup.status, BACKUP_STATUS.BACKED_UP);
assert.deepEqual(JSON.parse(await readFile(join(backupRoot, snapshot.relativePath), "utf8")), { kind: "snapshot" });

const session = await saveResearchSessionContext({ researchSessionId: "research_session_backup_test", context: { kind: "research" }, now: "2026-10-05T00:00:00.000Z" });
assert.equal(session.backup.status, BACKUP_STATUS.BACKED_UP);
assert.deepEqual(JSON.parse(await readFile(join(backupRoot, session.relativePath), "utf8")).context, { kind: "research" });

const existingSource = join(dataRoot, "raw", "overwrite-source.json");
await writeFile(existingSource, "first\n", "utf8");
const firstCopy = await backupRuntimeArtifact(existingSource, "data/raw/overwrite-target.json");
assert.equal(firstCopy.status, BACKUP_STATUS.BACKED_UP);
await writeFile(existingSource, "second\n", "utf8");
const secondCopy = await backupRuntimeArtifact(existingSource, "data/raw/overwrite-target.json");
assert.equal(secondCopy.status, BACKUP_STATUS.ALREADY_EXISTS);
assert.equal(await readFile(join(backupRoot, "data/raw/overwrite-target.json"), "utf8"), "first\n");

const disabledRoot = process.env.GEO_BACKUP_ROOT;
process.env.GEO_BACKUP_ROOT = "";
assert.equal((await backupRuntimeArtifact(existingSource, "data/raw/disabled.json")).status, BACKUP_STATUS.BACKUP_DISABLED);
process.env.GEO_BACKUP_ROOT = disabledRoot;

const blocker = join(workspace, "backup-blocker");
await writeFile(blocker, "not a directory\n", "utf8");
process.env.GEO_BACKUP_ROOT = blocker;
const failed = await backupRuntimeArtifact(existingSource, "data/raw/failed.json");
assert.equal(failed.status, BACKUP_STATUS.BACKUP_FAILED);
process.env.GEO_BACKUP_ROOT = disabledRoot;
await access(existingSource);

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
for (const productionPath of ["data/raw", "data/snapshots", "data/research-sessions"]) {
  await assert.rejects(access(join(projectRoot, productionPath)));
}
