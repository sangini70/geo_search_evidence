import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const root = dataDirectory("research-sessions");
const pattern = /^planner-decision-brief-v(\d+)\.json$/u;

export async function listPlannerDecisionBriefVersions(researchSessionId) {
  try {
    return (await readdir(join(root, researchSessionId))).filter((name) => pattern.test(name)).map((name) => Number(name.match(pattern)[1])).sort((a, b) => a - b);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function savePlannerDecisionBrief(brief) {
  const versions = await listPlannerDecisionBriefVersions(brief.research_session_id);
  const version = (versions.at(-1) || 0) + 1;
  const directory = join(root, brief.research_session_id);
  const fileName = `planner-decision-brief-v${version}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try { await access(path); throw new Error("PLANNER_DECISION_BRIEF_EXISTS"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const saved = { ...brief, decision_brief_version: version };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${brief.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { brief: saved, relativePath, fileName, backup };
}

export async function readPlannerDecisionBrief(researchSessionId, { briefVersion = null } = {}) {
  const versions = await listPlannerDecisionBriefVersions(researchSessionId);
  const version = briefVersion == null ? versions.at(-1) : Number(briefVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(root, researchSessionId, `planner-decision-brief-v${version}.json`), "utf8"));
}
