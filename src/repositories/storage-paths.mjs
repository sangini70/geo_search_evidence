import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultDataRoot = fileURLToPath(new URL("../../data/", import.meta.url));

export function getDataRoot() {
  return process.env.GEO_DATA_ROOT?.trim()
    ? resolve(process.env.GEO_DATA_ROOT)
    : defaultDataRoot;
}

export function dataDirectory(...segments) {
  return join(getDataRoot(), ...segments);
}

export function getBackupRoot() {
  return process.env.GEO_BACKUP_ROOT?.trim()
    ? resolve(process.env.GEO_BACKUP_ROOT)
    : null;
}
