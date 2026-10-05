import assert from "node:assert/strict";
import { buildResearchSessionContextArtifact } from "../src/repositories/research-session-context-repository.mjs";

const context = { hub_context: { hub_story: "Hub", story_direction: "Direction" }, planner_hypothesis: { raw_text: "Planner", confirmed: true }, reviewer_research_direction: { raw_text: "Reviewer", confirmed: true } };
const artifact = buildResearchSessionContextArtifact({ researchSessionId: "research_session_context_test", context, now: "2026-10-01T00:00:00.000Z" });
assert.equal(artifact.research_session_id, "research_session_context_test");
assert.deepEqual(artifact.context, context);
assert.deepEqual(artifact.hub_context, context.hub_context);
assert.deepEqual(artifact.planner_hypothesis, context.planner_hypothesis);
assert.deepEqual(artifact.reviewer_research_direction, context.reviewer_research_direction);
assert.equal(artifact.context_version, 1);
console.log("Research Session Context tests passed.");
