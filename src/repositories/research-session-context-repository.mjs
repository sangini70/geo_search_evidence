import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const root = dataDirectory("research-sessions");

export function buildResearchSessionContextArtifact({ researchSessionId, context, now = new Date().toISOString(), version = 1 } = {}) {
  if (!researchSessionId) throw new Error("RESEARCH_SESSION_REQUIRED");
  return {
    context_id: `research_context_${researchSessionId}`,
    context_version: version,
    research_session_id: researchSessionId,
    created_at: now,
    hub_context: { ...(context?.hub_context || {}) },
    planner_hypothesis: { ...(context?.planner_hypothesis || {}) },
    reviewer_research_direction: { ...(context?.reviewer_research_direction || {}) },
    context: { ...context },
  };
}

async function versions(researchSessionId) {
  try {
    return (await readdir(join(root, researchSessionId))).filter((name) => /^context-v\d+\.json$/u.test(name)).map((name) => Number(name.match(/^context-v(\d+)\.json$/u)[1])).sort((a, b) => a - b);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveResearchSessionContext({ researchSessionId, context, now } = {}) {
  const current = await versions(researchSessionId);
  const version = (current.at(-1) || 0) + 1;
  const directory = join(root, researchSessionId);
  await mkdir(directory, { recursive: true });
  const fileName = `context-v${version}.json`;
  const path = join(directory, fileName);
  try { await access(path); throw new Error("RESEARCH_SESSION_CONTEXT_EXISTS"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const artifact = buildResearchSessionContextArtifact({ researchSessionId, context, now, version });
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${researchSessionId}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { artifact, relativePath, fileName, backup };
}

export async function readResearchSessionContext(researchSessionId, { contextVersion = null } = {}) {
  const available = await versions(researchSessionId);
  const version = contextVersion == null ? available.at(-1) : Number(contextVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(root, researchSessionId, `context-v${version}.json`), "utf8"));
}
