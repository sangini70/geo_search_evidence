import assert from "node:assert/strict";
import { buildCollectionTargets } from "../src/research/research-collection-targets.mjs";

const seeds = [
  { research_seed_id: "seed-a", seed_text: "A", source_types: ["PLANNER_HYPOTHESIS"], source_references: [{ source: "planner", line: 1 }], reviewer_stages: [1, 2], reason: "planner candidate", status: "CONFIRMED" },
  { research_seed_id: "seed-b", seed_text: "B", source_types: ["REVIEWER_RESEARCH_DIRECTION"], source_references: [{ source: "reviewer", line: 2 }], reviewer_stages: [], reason: "reviewer candidate", status: "PROPOSED" },
  { research_seed_id: "seed-c", seed_text: "C", source_types: ["HUB_CONTEXT"], source_references: [{ source: "hub", line: 3 }], reason: "hub candidate", status: "EXCLUDED" },
];

let result = buildCollectionTargets(seeds);
assert.equal(result.status, "READY");
assert.equal(result.count, 2);
assert.deepEqual(result.targets.map((target) => target.keyword), ["A", "B"]);
assert.equal(result.targets[0].decision, "CONFIRMED");
assert.equal(result.targets[1].decision, "PROPOSED");
assert.equal(result.targets[0].collection_status, "READY");
assert.deepEqual(result.targets[0].source_references, seeds[0].source_references);
assert.deepEqual(result.targets[0].reviewer_stages, [1, 2]);
assert.deepEqual(result.targets[1].reviewer_stages, []);
assert.deepEqual(seeds[0].source_references, [{ source: "planner", line: 1 }]);

result = buildCollectionTargets([seeds[2]]);
assert.equal(result.status, "NOT_READY");
assert.equal(result.count, 0);
assert.deepEqual(result.targets, []);

const multiple = buildCollectionTargets([
  { ...seeds[1], status: "CONFIRMED" },
  { ...seeds[2], status: "CONFIRMED" },
]);
assert.deepEqual(multiple.targets.map((target) => target.keyword), ["B", "C"]);

const reprepared = buildCollectionTargets(seeds.map((seed) => seed.seed_text === "B" ? { ...seed, status: "CONFIRMED" } : seed));
assert.deepEqual(reprepared.targets.map((target) => target.keyword), ["A", "B"]);
console.log("Research Collection Target tests passed.");
