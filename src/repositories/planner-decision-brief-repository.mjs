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

export async function readLatestPlannerDecisionBriefFile(researchSessionId) {
  if (!/^research_session_[A-Za-z0-9_-]+$/u.test(researchSessionId || "")) throw new Error("INVALID_RESEARCH_SESSION_REFERENCE");
  const version = (await listPlannerDecisionBriefVersions(researchSessionId)).at(-1);
  if (!version) return null;
  const fileName = `planner-decision-brief-v${version}.json`;
  return { version, fileName, bytes: await readFile(join(root, researchSessionId, fileName)) };
}

export async function listCompletedResearchSessions() {
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const candidates = [];
  for (const entry of entries.filter((item) => item.isDirectory() && /^research_session_[A-Za-z0-9_-]+$/u.test(item.name))) {
    const version = (await listPlannerDecisionBriefVersions(entry.name)).at(-1);
    if (!version) continue;
    try {
      const brief = await readPlannerDecisionBrief(entry.name, { briefVersion: version });
      if (brief?.research_session_id !== entry.name) continue;
      candidates.push({
        research_session_id: entry.name,
        decision_brief_version: version,
        file_name: `planner-decision-brief-v${version}.json`,
        created_at: brief.created_at || null,
        session_timestamp: Number(entry.name.match(/^research_session_(\d+)$/u)?.[1] || 0),
      });
    } catch { /* Ignore malformed or unreadable candidate artifacts. */ }
  }
  return candidates.sort((left, right) => {
    const leftTime = Date.parse(left.created_at || "");
    const rightTime = Date.parse(right.created_at || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return rightTime - leftTime;
    if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) return Number.isFinite(rightTime) - Number.isFinite(leftTime);
    if (left.session_timestamp !== right.session_timestamp) return right.session_timestamp - left.session_timestamp;
    if (left.decision_brief_version !== right.decision_brief_version) return right.decision_brief_version - left.decision_brief_version;
    return right.research_session_id.localeCompare(left.research_session_id);
  });
}
