import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const researchPlanRoot = dataDirectory("research-sessions");

export async function listResearchPlanVersions(researchSessionId) {
  const directory = join(researchPlanRoot, researchSessionId);
  try {
    return (await readdir(directory))
      .filter((entry) => /^research-plan-v\d+\.json$/u.test(entry))
      .map((entry) => ({ plan_version: Number(entry.match(/^research-plan-v(\d+)\.json$/u)[1]) }))
      .sort((a, b) => a.plan_version - b.plan_version);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveResearchPlan(plan) {
  if (!plan?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  const versions = await listResearchPlanVersions(plan.research_session_id);
  const planVersion = (versions.at(-1)?.plan_version || 0) + 1;
  const directory = join(researchPlanRoot, plan.research_session_id);
  const fileName = `research-plan-v${planVersion}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try {
    await access(path);
    const error = new Error(`Research Plan already exists: ${fileName}`);
    error.code = "RESEARCH_PLAN_ALREADY_EXISTS";
    throw error;
  } catch (error) {
    if (error.code === "RESEARCH_PLAN_ALREADY_EXISTS") throw error;
    if (error.code !== "ENOENT") throw error;
  }
  const saved = { ...plan, plan_version: planVersion };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${plan.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { plan: saved, relativePath, fileName, backup };
}

export async function readResearchPlan(researchSessionId, { planVersion = null } = {}) {
  const versions = await listResearchPlanVersions(researchSessionId);
  const version = planVersion == null ? versions.at(-1)?.plan_version : Number(planVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(researchPlanRoot, researchSessionId, `research-plan-v${version}.json`), "utf8"));
}
