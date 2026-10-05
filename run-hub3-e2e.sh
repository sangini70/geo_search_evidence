#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

node --input-type=module <<'NODE'
import fs from "node:fs/promises";
import path from "node:path";
import { getEnvironmentValue } from "./src/config/index.mjs";
import { runResearchSessionE2E } from "./src/app/application.mjs";
import { readResearchSessionContext } from "./src/repositories/research-session-context-repository.mjs";
import { readResearchArtifactInvalidation } from "./src/repositories/research-artifact-invalidation-repository.mjs";
import { readResearchPlan } from "./src/repositories/research-plan-repository.mjs";

const session = "research_session_1791166686608";
const dataRoot = getEnvironmentValue("GEO_DATA_ROOT");
const backupRoot = getEnvironmentValue("GEO_BACKUP_ROOT");

if (!dataRoot || !backupRoot) throw new Error("OPERATING_ROOT_NOT_CONFIGURED");

const assertDirectory = async (directory, errorCode) => {
  const details = await fs.stat(directory).catch(() => null);
  if (!details?.isDirectory()) throw new Error(errorCode);
};

await assertDirectory(dataRoot, "DATA_ROOT_NOT_READY");
await assertDirectory(backupRoot, "BACKUP_ROOT_NOT_READY");

const sessionDir = path.join(dataRoot, "research-sessions", session);
await assertDirectory(sessionDir, "SESSION_DIRECTORY_NOT_FOUND");
await fs.access(path.join(sessionDir, "context-v1.json"));

const context = await readResearchSessionContext(session);
if (!context || context.context_version !== 1) throw new Error("CONTEXT_V1_NOT_READY");

const invalidation = await readResearchArtifactInvalidation(session);
if (!invalidation || invalidation.invalidation_version !== 1 || invalidation.replacement_start_stage !== "RESEARCH_PLAN") {
  throw new Error("INVALIDATION_RECORD_NOT_READY");
}

const invalidatedPlan = invalidation.invalidated_artifacts?.some(
  (item) => item.artifact_type === "research_plan" && Number(item.version) === 1,
);
if (!invalidatedPlan) throw new Error("RESEARCH_PLAN_V1_NOT_INVALIDATED");

const files = await fs.readdir(sessionDir);
if (files.includes("research-plan-v2.json")) throw new Error("RESEARCH_PLAN_V2_ALREADY_EXISTS");

const currentPlan = await readResearchPlan(session);
if (!currentPlan || currentPlan.plan_version !== 1) throw new Error("RESEARCH_PLAN_V1_NOT_FOUND");

const result = await runResearchSessionE2E({ researchSessionId: session });
const planVersion = result.artifacts.research_plan?.plan_version ?? null;
const decisionBriefVersion = result.artifacts.planner_decision_brief?.decision_brief_version ?? null;
const initialRun = result.artifacts.initial_discovery_run;

console.log(JSON.stringify({
  E2E_STATUS: result.status,
  FAILED_STAGE: result.failed_stage,
  LAST_SUCCESSFUL_ARTIFACT: result.last_successful_artifact,
  RESEARCH_PLAN_VERSION: planVersion,
  PLANNER_DECISION_BRIEF_VERSION: decisionBriefVersion,
  COLLECTION_COUNT: initialRun?.collection_ids?.length ?? 0,
  REUSED_COLLECTION_COUNT: initialRun?.reused_collection_ids?.length ?? 0,
  API_CALL: 0,
}, null, 2));

if (result.status !== "COMPLETED") process.exitCode = 1;
NODE
