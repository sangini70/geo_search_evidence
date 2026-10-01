import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateReviewSelection } from "../src/app/application.mjs";

const pack = JSON.parse(await readFile("data/snapshots/col_1790695616409/pack-v1.json", "utf8"));
const selection = pack.keywords.map((keyword) => ({ keyword_id: keyword.keyword_id, decision: "UNDECIDED", reviewer_note: "" }));
assert.deepEqual(validateReviewSelection(pack, selection), []);
assert.ok(validateReviewSelection(pack, selection.slice(1)).includes("REVIEW_SELECTION_MUST_COVER_ALL_CANDIDATES"));
assert.ok(validateReviewSelection(pack, selection.map((item, index) => index === 0 ? { ...item, decision: "INVALID" } : item)).includes("REVIEW_SELECTION_DECISION_INVALID"));
assert.ok(validateReviewSelection(pack, [{ ...selection[0], keyword_id: "unknown" }, ...selection.slice(1)]).includes("REVIEW_SELECTION_KEYWORD_REFERENCE_INVALID"));
console.log("Review selection contract tests passed.");
