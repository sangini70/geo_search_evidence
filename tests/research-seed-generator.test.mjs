import assert from "node:assert/strict";
import { generateResearchSeeds, updateResearchSeedStatus } from "../src/research/research-seed-generator.mjs";

const input = {
  hub_context: { hub_story: "환율과 달러 가치의 변동 구조", story_direction: "Search Seed: 환율", confirmed: true },
  planner_hypothesis: { raw_text: "MAIN KEYWORD: 환율\nSECONDARY KEYWORDS:\n- 원달러 환율\n- 달러 환율", confirmed: true },
  reviewer_research_direction: { raw_text: "Demand Anchor:\n- 환율\n- 원달러 환율\n검증 대상:\n- 환율 상승 이유", confirmed: true },
};
const seeds = generateResearchSeeds(input);
assert.deepEqual(seeds.map((seed) => seed.seed_text), ["환율", "원달러 환율", "달러 환율", "환율 상승 이유"]);
assert.equal(seeds[0].source_types.includes("HUB_CONTEXT"), true);
assert.equal(seeds[0].source_types.includes("PLANNER_HYPOTHESIS"), true);
assert.equal(seeds[0].source_types.includes("REVIEWER_RESEARCH_DIRECTION"), true);
assert.equal(seeds[0].source_references.length, 3);
assert.equal(seeds.every((seed) => seed.status === "PROPOSED"), true);
assert.equal(updateResearchSeedStatus(seeds, seeds[0].research_seed_id, "CONFIRMED")[0].status, "CONFIRMED");
assert.equal(updateResearchSeedStatus(seeds, seeds[1].research_seed_id, "EXCLUDED")[1].status, "EXCLUDED");
const noBroadNouns = generateResearchSeeds({ hub_context: { hub_story: "시장 구조를 이해한다", story_direction: "전체 방향", confirmed: true }, planner_hypothesis: { raw_text: "가설 설명만 있음", confirmed: true }, reviewer_research_direction: { raw_text: "검토가 필요하다", confirmed: true } });
assert.equal(noBroadNouns.length, 0);
const plainLists = generateResearchSeeds({ hub_context: {}, planner_hypothesis: { raw_text: "Planner Hypothesis:\n환율 결정 원리\n달러 가치", confirmed: true }, reviewer_research_direction: { raw_text: "Reviewer Research Direction:\n환율 변동\n원화 가치", confirmed: true } });
assert.deepEqual(plainLists.map((seed) => seed.seed_text), ["환율 결정 원리", "달러 가치", "환율 변동", "원화 가치"]);
const browserFormatFixture = {
  hub_context: {
    hub_story: "원달러 환율과 달러 가치의 변동 구조를 이해한다.",
    story_direction: "환율 변동 구조",
    confirmed: true,
  },
  planner_hypothesis: {
    raw_text: [
      "MAIN KEYWORD",
      "- 원달러 환율",
      "SECONDARY KEYWORDS",
      "- 환율 상승 이유",
      "- 환율 하락 이유",
    ].join("\n"),
    confirmed: true,
  },
  reviewer_research_direction: {
    raw_text: [
      "Search Entrance 후보",
      "- 환율",
      "- 원달러 환율",
      "Demand Anchor 후보",
      "- 달러 가치",
      "Intent Bridge 후보",
      "- 환율 변동",
      "실제 조회 대상",
      "- 환율 결정 원리",
      "VERIFICATION REQUIRED",
      "- 환율 상승 이유",
    ].join("\n"),
    confirmed: true,
  },
};
const browserFormatSeeds = generateResearchSeeds(browserFormatFixture);
const browserFormatSeedTexts = browserFormatSeeds.map((seed) => seed.seed_text);
assert.equal(browserFormatSeedTexts.includes("후보"), false);
assert.equal(browserFormatSeedTexts.includes("대상"), false);
assert.equal(browserFormatSeedTexts.includes("검증"), false);
assert.equal(browserFormatSeedTexts.includes("VERIFICATION REQUIRED"), false);
assert.equal(browserFormatSeedTexts.includes("원달러 환율"), true);
assert.equal(browserFormatSeedTexts.includes("환율 상승 이유"), true);
assert.equal(browserFormatSeedTexts.includes("환율 하락 이유"), true);
assert.equal(browserFormatSeedTexts.includes("달러 가치"), true);
assert.equal(browserFormatSeedTexts.includes("환율 변동"), true);
assert.equal(browserFormatSeedTexts.includes("환율 결정 원리"), true);
assert.equal(browserFormatSeeds.filter((seed) => seed.seed_text === "원달러 환율").length, 1);
assert.equal(browserFormatSeeds.find((seed) => seed.seed_text === "원달러 환율").source_types.includes("PLANNER_HYPOTHESIS"), true);
assert.equal(browserFormatSeeds.find((seed) => seed.seed_text === "원달러 환율").source_types.includes("REVIEWER_RESEARCH_DIRECTION"), true);

const actualBrowserFormatFixture = {
  hub_context: { hub_story: "원달러 환율과 달러 가치의 변동 구조", story_direction: "", confirmed: true },
  planner_hypothesis: {
    raw_text: "MAIN KEYWORD\n- 원달러 환율\nSECONDARY KEYWORDS\n- 환율 상승 이유\n- 환율 하락 이유",
    confirmed: true,
  },
  reviewer_research_direction: {
    raw_text: [
      "1차 우선 확인군",
      "- 환율",
      "- 원달러 환율",
      "- 달러 환율",
      "- 달러 가치",
      "- 원화 가치",
      "- 환율 변동",
      "Search Entrance 후보",
      "- 원달러 환율",
      "- 환율 상승",
      "- 환율 상승 이유",
      "- 원달러 환율 상승",
      "- 환율 하락",
      "- 환율 하락 이유",
      "- 원달러 환율 하락",
      "- 달러 강세",
      "- 달러 약세",
      "- 환율 결정",
      "- 환율 결정 원리",
      "- 환율 변동 원인",
      "- 달러지수",
      "- 달러 인덱스",
      "- DXY",
      "Intent Bridge 후보",
      "- 원달러 환율 의미",
      "- 원달러 환율 원리",
      "- 원달러 환율 상승 이유",
      "- 원달러 환율 하락 이유",
      "- 환율 오르는 이유",
      "- 환율 내리는 이유",
      "- 환율과 달러 가치",
      "- 환율과 원화 가치",
      "- 달러 강세 환율",
      "- 달러 약세 환율",
      "- 환율과 달러지수",
      "- 원달러 환율 달러지수",
      "- 환율 결정 원리",
      "- 환율 변동 원인",
      "- 외환 수요 공급",
    ].join("\n"),
    confirmed: true,
  },
};
const actualBrowserSeeds = generateResearchSeeds(actualBrowserFormatFixture);
const actualBrowserSeedTexts = actualBrowserSeeds.map((seed) => seed.seed_text);
for (const expectedSeed of [
  "환율", "원달러 환율", "달러 환율", "달러 가치", "원화 가치", "환율 변동",
  "환율 상승 이유", "환율 하락 이유", "달러 강세", "달러 약세", "환율 결정 원리",
  "환율 변동 원인", "달러지수", "달러 인덱스", "DXY", "외환 수요 공급",
]) assert.equal(actualBrowserSeedTexts.includes(expectedSeed), true, expectedSeed);
for (const noiseSeed of ["후보", "대상", "검증", "확인", "검증 대상", "VERIFICATION REQUIRED", "REVIEW_REQUIRED", "Search Entrance", "Demand Anchor", "Intent Bridge", "MODE A", "MODE B"]) {
  assert.equal(actualBrowserSeedTexts.includes(noiseSeed), false, noiseSeed);
}
assert.equal(actualBrowserSeeds.filter((seed) => seed.seed_text === "원달러 환율").length, 1);
assert.equal(actualBrowserSeeds.find((seed) => seed.seed_text === "원달러 환율").source_types.includes("PLANNER_HYPOTHESIS"), true);
assert.equal(actualBrowserSeeds.find((seed) => seed.seed_text === "원달러 환율").source_types.includes("REVIEWER_RESEARCH_DIRECTION"), true);

const markdownRuntimeFixture = {
  ...actualBrowserFormatFixture,
  planner_hypothesis: {
    ...actualBrowserFormatFixture.planner_hypothesis,
    raw_text: actualBrowserFormatFixture.planner_hypothesis.raw_text.replace(/^(MAIN KEYWORD|SECONDARY KEYWORDS)$/gmu, "### $1"),
  },
  reviewer_research_direction: {
    ...actualBrowserFormatFixture.reviewer_research_direction,
    raw_text: actualBrowserFormatFixture.reviewer_research_direction.raw_text.replace(/^(1차 우선 확인군|Search Entrance 후보|Intent Bridge 후보)$/gmu, "### $1"),
  },
};
const markdownRuntimeSeeds = generateResearchSeeds(markdownRuntimeFixture);
assert.equal(markdownRuntimeSeeds.length > 0, true);
assert.equal(markdownRuntimeSeeds.some((seed) => seed.seed_text === "환율"), true);
assert.equal(markdownRuntimeSeeds.some((seed) => seed.seed_text === "DXY"), true);

const yenRuntimeFixture = {
  hub_context: { hub_story: "엔화 가치와 환율 변동", story_direction: "", confirmed: true },
  planner_hypothesis: {
    raw_text: [
      "- MAIN KEYWORD: 엔화 환율",
      "- SECONDARY KEYWORDS: 엔화 가치, 엔저, 엔고, 원엔 환율, 달러엔 환율",
      "- MAIN KEYWORD: 엔저",
      "- SECONDARY KEYWORDS: 엔고, 엔화 강세, 엔화 약세",
    ].join("\n"),
    confirmed: true,
  },
  reviewer_research_direction: {
    raw_text: [
      "## 1차 핵심 조회 — Demand Anchor Discovery",
      "```text",
      "엔화",
      "엔화 환율",
      "엔화 가치",
      "엔저",
      "엔고",
      "원엔 환율",
      "달러엔 환율",
      "엔화 강세",
      "엔화 약세",
      "```",
      "DEMAND ANCHOR: 확정: 보류",
      "SEARCH DEMAND: NOT PROVIDED",
      "## 2차 추가 조회 — Search Entrance / Intent Bridge",
      "```text",
      "엔화 환율 보는 법",
      "엔화 상승",
      "엔화 하락",
      "엔저 원인",
      "엔고 원인",
      "```",
      "## 3차 선택 조회 — Relation / Long-tail",
      "```text",
      "원엔 달러엔 차이",
      "엔화 가치 원인",
      "```",
      "VERIFICATION REQUIRED",
      "NOT CONFIRMED",
    ].join("\n"),
    confirmed: true,
  },
};
const yenRuntimeSeeds = generateResearchSeeds(yenRuntimeFixture);
const yenRuntimeSeedTexts = yenRuntimeSeeds.map((seed) => seed.seed_text);
for (const expectedSeed of [
  "엔화", "엔화 환율", "엔화 가치", "엔저", "엔고", "원엔 환율", "달러엔 환율",
  "엔화 강세", "엔화 약세", "엔화 환율 보는 법", "엔화 상승", "엔화 하락",
  "엔저 원인", "엔고 원인", "원엔 달러엔 차이", "엔화 가치 원인",
]) assert.equal(yenRuntimeSeedTexts.includes(expectedSeed), true, expectedSeed);
for (const noiseSeed of ["확정: 보류", "보류", "NOT CONFIRMED", "NOT PROVIDED", "REQUIRED", "VERIFICATION REQUIRED", "SEARCH DEMAND", "PLANNER HANDOFF", "MODE A", "현재 판단"]) {
  assert.equal(yenRuntimeSeedTexts.includes(noiseSeed), false, noiseSeed);
}
assert.equal(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화 환율").source_types.includes("PLANNER_HYPOTHESIS"), true);
assert.equal(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화 환율").source_types.includes("REVIEWER_RESEARCH_DIRECTION"), true);
assert.deepEqual(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화 환율").reviewer_stages, [1]);
assert.deepEqual(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화 환율 보는 법").reviewer_stages, [2]);
assert.deepEqual(yenRuntimeSeeds.find((seed) => seed.seed_text === "원엔 달러엔 차이").reviewer_stages, [3]);
assert.equal(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화").source_references.some((reference) => reference.marker === "REVIEW_QUERY_STAGE_1"), true);
assert.equal(yenRuntimeSeeds.find((seed) => seed.seed_text === "엔화 환율 보는 법").source_references.some((reference) => reference.marker === "REVIEW_QUERY_STAGE_2"), true);
assert.equal(yenRuntimeSeeds.find((seed) => seed.seed_text === "원엔 달러엔 차이").source_references.some((reference) => reference.marker === "REVIEW_QUERY_STAGE_3"), true);
assert.equal(yenRuntimeSeeds.filter((seed) => seed.seed_text === "엔화 환율").length, 1);

const notationVariantSeeds = generateResearchSeeds({
  hub_context: {},
  planner_hypothesis: { raw_text: "MAIN KEYWORD: 원엔 환율", confirmed: true },
  reviewer_research_direction: { raw_text: "1차 핵심 조회\n```\n원엔 환율\n```", confirmed: true },
});
assert.equal(notationVariantSeeds.length, 1);
assert.equal(notationVariantSeeds[0].seed_text, "원엔 환율");
assert.deepEqual(notationVariantSeeds[0].reviewer_stages, [1]);

console.log("Research Seed Generator tests passed.");
