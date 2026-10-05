import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const root = dataDirectory("research-sessions");

export async function listFinalPlannerHandoffVersions(researchSessionId) {
  try {
    return (await readdir(join(root, researchSessionId))).filter((name) => /^final-planner-handoff-v\d+\.json$/u.test(name)).map((name) => Number(name.match(/^final-planner-handoff-v(\d+)\.json$/u)[1])).sort((a, b) => a - b);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveFinalPlannerHandoff(handoff) {
  const versions = await listFinalPlannerHandoffVersions(handoff.research_session_id);
  const version = (versions.at(-1) || 0) + 1;
  const directory = join(root, handoff.research_session_id);
  const fileName = `final-planner-handoff-v${version}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try { await access(path); throw new Error("FINAL_PLANNER_HANDOFF_EXISTS"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const saved = { ...handoff, handoff_version: version };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${handoff.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { handoff: saved, relativePath, fileName, backup };
}

export async function readFinalPlannerHandoff(researchSessionId, { handoffVersion = null } = {}) {
  const versions = await listFinalPlannerHandoffVersions(researchSessionId);
  const version = handoffVersion == null ? versions.at(-1) : Number(handoffVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(root, researchSessionId, `final-planner-handoff-v${version}.json`), "utf8"));
}
