#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

node --input-type=module <<'NODE'
import fs from "node:fs/promises";
import path from "node:path";
import { getEnvironmentValue } from "./src/config/index.mjs";
import { saveResearchArtifactInvalidation } from "./src/repositories/research-artifact-invalidation-repository.mjs";

const session = "research_session_1791166686608";
const dataRoot = getEnvironmentValue("GEO_DATA_ROOT");
const backupRoot = getEnvironmentValue("GEO_BACKUP_ROOT");

if (!dataRoot || !backupRoot) throw new Error("OPERATING_ROOT_NOT_CONFIGURED");

const sessionDir = path.join(dataRoot, "research-sessions", session);
const files = await fs.readdir(sessionDir);

if (files.some((name) => /^artifact-invalidation-v\d+\.json$/.test(name))) {
  console.log("INVALIDATION_ALREADY_EXISTS: NO_WRITE");
  process.exit(0);
}

const countFiles = async (relativePath) => {
  let count = 0;
  const walk = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else count += 1;
    }
  };

  try {
    await walk(path.join(dataRoot, relativePath));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return count;
};

if ((await countFiles("raw")) !== 0 || (await countFiles("snapshots")) !== 0) {
  throw new Error("COLLECTION_RAW_SNAPSHOT_PRESENT");
}

const targets = [
  ["research-plan-v1.json", "research_plan", 1],
  ["initial-discovery-v1.json", "initial_discovery", 1],
  ["initial-discovery-run-v1.json", "initial_discovery_run", 1],
  ["initial-discovery-evaluation-v1.json", "evaluation", 1],
  ["follow-up-research-projection-v1.json", "follow_up", 1],
  ["integration-v1.json", "integration", 1],
  ["compression-v1.json", "compression", 1],
  ["compression-v2.json", "compression", 2],
  ["final-planner-handoff-v1.json", "full_planner_handoff", 1],
  ["planner-consumer-handoff-v1.json", "planner_consumer_handoff", 1],
  ["planner-decision-brief-v1.json", "planner_decision_brief", 1],
];

await fs.access(path.join(sessionDir, "context-v1.json"));

for (const [fileName] of targets) {
  await fs.access(path.join(sessionDir, fileName));
}

const result = await saveResearchArtifactInvalidation({
  researchSessionId: session,
  invalidatedArtifacts: targets.map(([fileName, artifactType, version]) => ({
    artifact_type: artifactType,
    version,
    relative_path: `data/research-sessions/${session}/${fileName}`,
  })),
  reasonCode: "INVALID_E2E_CONTEXT_INPUT",
  reason: "Initial E2E generated research-plan-v1 and downstream artifacts from empty context input; context-v1 remains valid.",
  replacementStartStage: "RESEARCH_PLAN",
  createdAt: new Date().toISOString(),
});

console.log(JSON.stringify({
  INVALIDATION_RECORD: "CREATED",
  INVALIDATION_VERSION: result.invalidation.invalidation_version,
  INVALIDATED_ARTIFACT_COUNT: result.invalidation.invalidated_artifacts.length,
  CONTEXT_V1: "PRESERVED",
  COLLECTION: "EXCLUDED",
  RAW_SNAPSHOT: "EXCLUDED",
  NEXT_RESEARCH_PLAN_VERSION: 2,
  API_CALL: 0,
  COLLECTION_RUN: 0,
}, null, 2));
NODE
