import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./storage-paths.mjs";
import { backupRuntimeArtifact } from "./backup-repository.mjs";

const evaluationRoot = dataDirectory("research-sessions");

export async function listInitialDiscoveryEvaluationVersions(researchSessionId) {
  try {
    return (await readdir(join(evaluationRoot, researchSessionId))).filter((entry) => /^initial-discovery-evaluation-v\d+\.json$/u.test(entry)).map((entry) => ({ evaluation_version: Number(entry.match(/^initial-discovery-evaluation-v(\d+)\.json$/u)[1]) })).sort((a, b) => a.evaluation_version - b.evaluation_version);
  } catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

export async function saveInitialDiscoveryEvaluation(evaluation) {
  if (!evaluation?.research_session_id) throw new Error("RESEARCH_SESSION_REQUIRED");
  const version = (await listInitialDiscoveryEvaluationVersions(evaluation.research_session_id)).at(-1)?.evaluation_version + 1 || 1;
  const directory = join(evaluationRoot, evaluation.research_session_id);
  const fileName = `initial-discovery-evaluation-v${version}.json`;
  const path = join(directory, fileName);
  await mkdir(directory, { recursive: true });
  try { await access(path); const error = new Error("INITIAL_DISCOVERY_EVALUATION_ALREADY_EXISTS"); error.code = "INITIAL_DISCOVERY_EVALUATION_ALREADY_EXISTS"; throw error; } catch (error) { if (error.code === "INITIAL_DISCOVERY_EVALUATION_ALREADY_EXISTS") throw error; if (error.code !== "ENOENT") throw error; }
  const saved = { ...evaluation, evaluation_version: version };
  await writeFile(path, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const relativePath = `data/research-sessions/${evaluation.research_session_id}/${fileName}`;
  const backup = await backupRuntimeArtifact(path, relativePath);
  return { evaluation: saved, relativePath, fileName, backup };
}

export async function readInitialDiscoveryEvaluation(researchSessionId, { evaluationVersion = null } = {}) {
  const versions = await listInitialDiscoveryEvaluationVersions(researchSessionId);
  const version = evaluationVersion == null ? versions.at(-1)?.evaluation_version : Number(evaluationVersion);
  if (!version) return null;
  return JSON.parse(await readFile(join(evaluationRoot, researchSessionId, `initial-discovery-evaluation-v${version}.json`), "utf8"));
}
