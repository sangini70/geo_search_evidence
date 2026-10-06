import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listCompletedResearchSessions } from "../src/repositories/planner-decision-brief-repository.mjs";

const root = join(process.env.GEO_DATA_ROOT, "research-sessions");
async function writeBrief(session, version, createdAt, researchSessionId = session) {
  const directory = join(root, session);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `planner-decision-brief-v${version}.json`), JSON.stringify({ research_session_id: researchSessionId, created_at: createdAt, decision_brief_version: version }) + "\n");
}

await writeBrief("research_session_1791243000000", 10, "2026-10-05T00:00:00.000Z");
await writeBrief("research_session_1791243356750", 1, "2026-10-06T00:00:00.000Z");
await writeBrief("research_session_1791244000000", 2, "2026-10-04T00:00:00.000Z");
await mkdir(join(root, "research_session_1791245000000"), { recursive: true });
await writeFile(join(root, "research_session_1791245000000", "planner-decision-brief-vX.json"), "malformed");

const sessions = await listCompletedResearchSessions();
assert.equal(sessions[0].research_session_id, "research_session_1791243356750");
assert.equal(sessions[0].decision_brief_version, 1);
assert.equal(sessions[1].research_session_id, "research_session_1791243000000");
assert.equal(sessions[1].decision_brief_version, 10);
assert.ok(!sessions.some((item) => item.research_session_id === "research_session_1791245000000"));
console.log("Recent completed Research Session tests passed");
