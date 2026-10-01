import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildGeoHandoffFromReview } from "../src/handoff/review-selection-handoff.mjs";

const collectionId = "col_1790695616409";
const pack = JSON.parse(await readFile(`data/snapshots/${collectionId}/pack-v1.json`, "utf8"));
const review = JSON.parse(await readFile(`data/reviews/${collectionId}/review-v5.json`, "utf8"));
const handoff = buildGeoHandoffFromReview(pack, review);
const selected = review.reviewer_selection.filter((item) => item.decision === "SELECTED");

assert.equal(handoff.collection_id, collectionId);
assert.equal(handoff.review_version, 5);
assert.equal(handoff.selected_candidates.length, selected.length);
assert.deepEqual(handoff.selected_candidates.map((item) => item.keyword_id), selected.map((item) => item.keyword_id));
assert.ok(handoff.selected_candidates.every((item) => item.decision === "SELECTED"));
assert.ok(handoff.selected_candidates.every((item) => item.evidence_ids.length > 0 && item.metric_ids.length > 0));
assert.equal(handoff.selected_candidates.some((item) => item.decision === "EXCLUDED" || item.decision === "UNDECIDED"), false);
assert.equal(handoff.selected_candidates.some((item) => item.total_search_volume_status === "NOT_CALCULABLE" && item.total_search_volume !== null), false);
console.log("Review selection GEO Handoff contract tests passed.");
