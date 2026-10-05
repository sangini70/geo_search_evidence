import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { buildResearchPlan, RESEARCH_PLAN_EVIDENCE_TYPES } from "../src/research/research-plan.mjs";
import { readResearchPlan, saveResearchPlan } from "../src/repositories/research-plan-repository.mjs";

const sessionId = `research_session_plan_test_${Date.now()}`;
const context = {
  hub_context: { hub_story: "엔화 가치와 환율의 변동 구조", story_direction: "환율 관계" },
  planner_hypothesis: { raw_text: "MAIN KEYWORD: 엔화 환율", confirmed: true },
  reviewer_research_direction: { raw_text: "1차 핵심 조회\n엔화 환율", confirmed: true },
};
const seeds = [
  {
    seed_text: "엔화 환율",
    normalized_seed_text: "엔화 환율",
    source_types: ["PLANNER_HYPOTHESIS"],
    source_references: [{ source_type: "PLANNER_HYPOTHESIS", marker: "MAIN_KEYWORD", line_number: 1 }],
    reviewer_stages: [],
    reason: "MAIN_KEYWORD in planner_hypothesis_raw",
    status: "PROPOSED",
  },
  {
    seed_text: "엔화 환율",
    normalized_seed_text: "엔화 환율",
    source_types: ["REVIEWER_RESEARCH_DIRECTION"],
    source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_1", line_number: 2 }],
    reviewer_stages: [1],
    reason: "REVIEW_QUERY_STAGE_1 in reviewer_research_direction_raw",
    status: "PROPOSED",
  },
  {
    seed_text: "엔화 가치",
    normalized_seed_text: "엔화 가치",
    source_types: ["REVIEWER_RESEARCH_DIRECTION"],
    source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_2", line_number: 3 }],
    reviewer_stages: [2],
    reason: "REVIEW_QUERY_STAGE_2 in reviewer_research_direction_raw",
    status: "PROPOSED",
  },
  {
    seed_text: "엔고",
    normalized_seed_text: "엔고",
    source_types: ["REVIEWER_RESEARCH_DIRECTION"],
    source_references: [{ source_type: "REVIEWER_RESEARCH_DIRECTION", marker: "REVIEW_QUERY_STAGE_3", line_number: 4 }],
    reviewer_stages: [3],
    reason: "REVIEW_QUERY_STAGE_3 in reviewer_research_direction_raw",
    status: "PROPOSED",
  },
  {
    seed_text: "planner only",
    normalized_seed_text: "planner only",
    source_types: ["PLANNER_HYPOTHESIS"],
    source_references: [{ source_type: "PLANNER_HYPOTHESIS", marker: "SECONDARY_KEYWORDS", line_number: 5 }],
    reviewer_stages: [],
    reason: "SECONDARY_KEYWORDS in planner_hypothesis_raw",
    status: "PROPOSED",
  },
];

const inputBefore = structuredClone({ context, seeds });
const plan = buildResearchPlan({ researchSessionId: sessionId, context, researchSeeds: seeds, now: "2026-10-02T00:00:00.000Z" });
assert.equal(plan.research_session_id, sessionId);
assert.equal(plan.status, "PLANNED");
assert.equal(plan.algorithm_version, "1.1");
assert.equal(plan.plan_items.length, 4);
assert.deepEqual(plan.context.reviewer_direction, context.reviewer_research_direction);
assert.deepEqual(plan.plan_items[0].reviewer_stages, [1]);
assert.deepEqual(plan.plan_items.find((item) => item.search_seed === "엔화 가치").reviewer_stages, [2]);
assert.deepEqual(plan.plan_items.find((item) => item.search_seed === "엔고").reviewer_stages, [3]);
assert.deepEqual(plan.plan_items.find((item) => item.search_seed === "planner only").reviewer_stages, []);
assert.equal(plan.plan_items[0].source_references.length, 2);
assert.equal(plan.plan_items[0].related_planner_hypotheses.length, 1);
assert.equal(plan.plan_items[0].related_reviewer_direction.length, 1);
assert.deepEqual(plan.plan_items[0].evidence_to_collect, RESEARCH_PLAN_EVIDENCE_TYPES);
assert.equal(plan.plan_items[0].evidence_to_collect.includes("COMPETITION_RATIO"), false);
assert.equal(plan.plan_items[0].evidence_to_collect.includes("TREND"), false);
assert.equal(plan.initial_discovery.status, "NOT_EXECUTED");
assert.equal(plan.plan_items.every((item) => item.initial_discovery_status === "NOT_SELECTED"), true);
assert.deepEqual({ context, seeds }, inputBefore);

try {
  const saved = await saveResearchPlan(plan);
  assert.equal(saved.relativePath, `data/research-sessions/${sessionId}/research-plan-v1.json`);
  const readBack = await readResearchPlan(sessionId);
  assert.equal(readBack.plan_version, 1);
  assert.equal(readBack.research_session_id, sessionId);
  assert.equal(readBack.plan_items.length, 4);
} finally {
  await rm(`data/research-sessions/${sessionId}`, { recursive: true, force: true });
}

console.log("Research Plan tests passed.");
