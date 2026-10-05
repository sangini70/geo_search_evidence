import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvironmentValue } from "../config/index.mjs";

const defaultDataRoot = fileURLToPath(new URL("../../data/", import.meta.url));

export function getDataRoot() {
  const configuredRoot = getEnvironmentValue("GEO_DATA_ROOT").trim();
  return configuredRoot
    ? resolve(configuredRoot)
    : defaultDataRoot;
}

export function dataDirectory(...segments) {
  return join(getDataRoot(), ...segments);
}

export function getBackupRoot() {
  const configuredRoot = getEnvironmentValue("GEO_BACKUP_ROOT").trim();
  return configuredRoot
    ? resolve(configuredRoot)
    : null;
}
