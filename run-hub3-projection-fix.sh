#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

node --input-type=module <<'NODE'
import fs from "node:fs/promises";
import path from "node:path";
import { getEnvironmentValue } from "./src/config/index.mjs";
import { assertBackupPreflight } from "./src/repositories/backup-repository.mjs";
import { readFinalPlannerHandoff } from "./src/repositories/final-planner-handoff-repository.mjs";
import { buildPlannerConsumerHandoff } from "./src/handoff/planner-consumer-handoff.mjs";
import { buildPlannerDecisionBrief } from "./src/handoff/planner-decision-brief.mjs";
import { readPlannerConsumerHandoff, savePlannerConsumerHandoff } from "./src/repositories/planner-consumer-handoff-repository.mjs";
import { readPlannerDecisionBrief, savePlannerDecisionBrief } from "./src/repositories/planner-decision-brief-repository.mjs";

const session = "research_session_1791166686608";
const dataRoot = getEnvironmentValue("GEO_DATA_ROOT").trim();
const backupRoot = getEnvironmentValue("GEO_BACKUP_ROOT").trim();

if (!dataRoot || !backupRoot) throw new Error("OPERATING_ROOT_NOT_CONFIGURED");
const directory = async (value, code) => {
  const details = await fs.stat(value).catch(() => null);
  if (!details?.isDirectory()) throw new Error(code);
};

await directory(dataRoot, "DATA_ROOT_NOT_READY");
await directory(backupRoot, "BACKUP_ROOT_NOT_READY");
await assertBackupPreflight();

const sessionDirectory = path.join(dataRoot, "research-sessions", session);
await directory(sessionDirectory, "SESSION_DIRECTORY_NOT_FOUND");
await fs.access(path.join(sessionDirectory, "context-v1.json"));

const fullHandoff = await readFinalPlannerHandoff(session);
if (!fullHandoff) throw new Error("FULL_PLANNER_HANDOFF_NOT_FOUND");
const fullHandoffPath = `data/research-sessions/${session}/final-planner-handoff-v${fullHandoff.handoff_version}.json`;

const hasSourceReferences = (lineage) => Boolean(
  lineage?.collection_ids?.length
  && (lineage.source_evidence_ids?.length || lineage.source_metric_ids?.length || lineage.raw_references?.length),
);
const consumerIsReady = (consumer) => Boolean(
  consumer?.projection_status === "READY"
  && consumer.lineage?.status === "COMPLETE"
  && consumer.lineage?.full_handoff_reference?.path
  && hasSourceReferences(consumer.lineage),
);
const briefIsReady = (brief, consumer) => Boolean(
  brief?.projection_status === "READY"
  && brief.lineage?.status === "COMPLETE"
  && brief.lineage?.source_consumer_handoff?.path
  && brief.lineage?.source_consumer_handoff?.version === consumer?.consumer_handoff_version
  && hasSourceReferences(brief.lineage),
);

let consumer = await readPlannerConsumerHandoff(session);
let consumerWrite = "NO_WRITE";
let consumerPath = consumer ? `data/research-sessions/${session}/planner-consumer-handoff-v${consumer.consumer_handoff_version}.json` : null;
if (!consumerIsReady(consumer)) {
  const saved = await savePlannerConsumerHandoff(buildPlannerConsumerHandoff({ fullHandoff, fullHandoffPath }));
  consumer = saved.handoff;
  consumerPath = saved.relativePath;
  consumerWrite = "CREATED";
}

let brief = await readPlannerDecisionBrief(session);
let briefWrite = "NO_WRITE";
let briefPath = brief ? `data/research-sessions/${session}/planner-decision-brief-v${brief.decision_brief_version}.json` : null;
if (!briefIsReady(brief, consumer)) {
  const saved = await savePlannerDecisionBrief(buildPlannerDecisionBrief({ consumerHandoff: consumer, consumerHandoffPath: consumerPath }));
  brief = saved.brief;
  briefPath = saved.relativePath;
  briefWrite = "CREATED";
}

if (!consumerIsReady(consumer)) throw new Error("CONSUMER_HANDOFF_PROJECTION_INVALID");
if (!briefIsReady(brief, consumer)) throw new Error("PLANNER_DECISION_BRIEF_PROJECTION_INVALID");
if (brief.lineage.source_consumer_handoff.path !== consumerPath) throw new Error("CONSUMER_HANDOFF_PATH_NOT_PRESERVED");
if (JSON.stringify(brief.lineage.source_evidence_ids) !== JSON.stringify(consumer.lineage.source_evidence_ids)) throw new Error("SOURCE_EVIDENCE_LINEAGE_NOT_PRESERVED");
if (JSON.stringify(brief.lineage.source_metric_ids) !== JSON.stringify(consumer.lineage.source_metric_ids)) throw new Error("SOURCE_METRIC_LINEAGE_NOT_PRESERVED");
if (JSON.stringify(brief.lineage.raw_references) !== JSON.stringify(consumer.lineage.raw_references)) throw new Error("RAW_LINEAGE_NOT_PRESERVED");
if (!Array.isArray(brief.planner_judgment_required) || brief.planner_judgment_required.length === 0) throw new Error("PLANNER_JUDGMENT_REQUIRED_NOT_PRESERVED");
if (Object.hasOwn(brief, "final_knowledge_node")) throw new Error("FINAL_KNOWLEDGE_ARCHITECTURE_BOUNDARY_BREACH");

console.log(JSON.stringify({
  PROJECTION_STATUS: consumerWrite === "NO_WRITE" && briefWrite === "NO_WRITE" ? "NO_WRITE" : "CREATED",
  CONSUMER_HANDOFF: { action: consumerWrite, version: consumer.consumer_handoff_version, path: consumerPath, lineage_status: consumer.lineage?.status },
  PLANNER_DECISION_BRIEF: { action: briefWrite, version: brief.decision_brief_version, path: briefPath, lineage_status: brief.lineage?.status },
  SOURCE_EVIDENCE_REFERENCES: consumer.lineage.source_evidence_ids.length,
  SOURCE_METRIC_REFERENCES: consumer.lineage.source_metric_ids.length,
  RAW_REFERENCES: consumer.lineage.raw_references.length,
  FULL_HANDOFF_PATH: consumer.lineage.full_handoff_reference.path,
  DECISION_BRIEF_SOURCE_CONSUMER_PATH: brief.lineage.source_consumer_handoff.path,
  PLANNER_JUDGMENT_REQUIRED: brief.planner_judgment_required.length,
  FINAL_KNOWLEDGE_ARCHITECTURE_CREATED: false,
  FULL_HANDOFF_REUSED: true,
  COLLECTION_RUN: 0,
  EXTERNAL_API_CALL: 0,
}, null, 2));
NODE
