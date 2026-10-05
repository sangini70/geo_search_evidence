import { access, copyFile, mkdir, stat } from "node:fs/promises";
import { W_OK } from "node:constants";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { getBackupRoot } from "./storage-paths.mjs";

export const BACKUP_STATUS = Object.freeze({
  BACKED_UP: "BACKED_UP",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  BACKUP_DISABLED: "BACKUP_DISABLED",
  BACKUP_FAILED: "BACKUP_FAILED",
});

export async function assertBackupPreflight() {
  const backupRoot = getBackupRoot();
  const fail = (reason) => {
    const error = new Error(reason);
    error.code = "BACKUP_PREFLIGHT_FAILED";
    error.reason = reason;
    throw error;
  };
  if (!backupRoot) fail("BACKUP_ROOT_REQUIRED");
  try {
    const details = await stat(backupRoot);
    if (!details.isDirectory()) fail("BACKUP_ROOT_NOT_DIRECTORY");
    await access(backupRoot, W_OK);
  } catch (error) {
    if (error.code === "BACKUP_PREFLIGHT_FAILED") throw error;
    fail(error.code === "ENOENT" ? "BACKUP_ROOT_NOT_FOUND" : "BACKUP_ROOT_NOT_WRITABLE");
  }
  return { status: "BACKUP_PREFLIGHT_OK", backupRoot };
}

function safeRelativePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim() || isAbsolute(relativePath)) {
    throw new Error("BACKUP_RELATIVE_PATH_REQUIRED");
  }
  const normalized = relativePath.replaceAll("\\", "/");
  if (normalized.split("/").includes("..")) throw new Error("BACKUP_RELATIVE_PATH_INVALID");
  return normalized;
}

export async function backupRuntimeArtifact(sourcePath, relativePath) {
  const backupRoot = getBackupRoot();
  if (!backupRoot) return { status: BACKUP_STATUS.BACKUP_DISABLED, relativePath };

  let normalizedRelativePath;
  try {
    normalizedRelativePath = safeRelativePath(relativePath);
  } catch (error) {
    return { status: BACKUP_STATUS.BACKUP_FAILED, relativePath, error: error.message };
  }

  const destinationPath = resolve(backupRoot, normalizedRelativePath);
  const backupRootWithSeparator = backupRoot.endsWith(sep) ? backupRoot : `${backupRoot}${sep}`;
  if (!destinationPath.startsWith(backupRootWithSeparator) && destinationPath !== backupRoot) {
    return { status: BACKUP_STATUS.BACKUP_FAILED, relativePath: normalizedRelativePath, error: "BACKUP_DESTINATION_OUTSIDE_ROOT" };
  }
  if (resolve(sourcePath) === destinationPath) {
    return { status: BACKUP_STATUS.BACKUP_FAILED, relativePath: normalizedRelativePath, error: "BACKUP_SOURCE_EQUALS_DESTINATION" };
  }

  try {
    await mkdir(dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath, 1);
    return { status: BACKUP_STATUS.BACKED_UP, relativePath: normalizedRelativePath };
  } catch (error) {
    if (error.code === "EEXIST") return { status: BACKUP_STATUS.ALREADY_EXISTS, relativePath: normalizedRelativePath };
    return { status: BACKUP_STATUS.BACKUP_FAILED, relativePath: normalizedRelativePath, error: error.message };
  }
}
