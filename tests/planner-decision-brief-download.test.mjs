import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readLatestPlannerDecisionBriefFile } from "../src/repositories/planner-decision-brief-repository.mjs";

const session = "research_session_brief_download";
const otherSession = "research_session_brief_download_other";
const directory = join(process.env.GEO_DATA_ROOT, "research-sessions", session);
await mkdir(directory, { recursive: true });

const v1 = Buffer.from('{"decision_brief_version":1}\n');
const v2 = Buffer.from('{"decision_brief_version":2}\n');
const v10 = Buffer.from('{"decision_brief_version":10}\n');
await writeFile(join(directory, "planner-decision-brief-v1.json"), v1);
await writeFile(join(directory, "planner-decision-brief-v2.json"), v2);
await writeFile(join(directory, "planner-decision-brief-v10.json"), v10);
await writeFile(join(directory, "planner-decision-brief-vX.json"), "malformed filename");
await writeFile(join(directory, "planner-decision-brief-v3.tmp.json"), "malformed filename");

const latest = await readLatestPlannerDecisionBriefFile(session);
assert.equal(latest.version, 10);
assert.equal(latest.fileName, "planner-decision-brief-v10.json");
assert.deepEqual(latest.bytes, v10);
assert.deepEqual(await readFile(join(directory, latest.fileName)), v10);

assert.equal(await readLatestPlannerDecisionBriefFile("research_session_without_brief"), null);
await mkdir(join(process.env.GEO_DATA_ROOT, "research-sessions", otherSession), { recursive: true });
await writeFile(join(process.env.GEO_DATA_ROOT, "research-sessions", otherSession, "planner-decision-brief-v99.json"), "other session");
assert.equal((await readLatestPlannerDecisionBriefFile(session)).version, 10);
await assert.rejects(() => readLatestPlannerDecisionBriefFile("../research_session_brief_download"), /INVALID_RESEARCH_SESSION_REFERENCE/);

console.log("Planner Decision Brief download repository tests passed");
