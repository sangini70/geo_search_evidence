import { createReviewRows, filterReviewRows, sortReviewRows } from "./review-model.mjs";
import { generateResearchSeeds, updateResearchSeedStatus } from "../research/research-seed-generator.mjs";

const $ = (selector) => document.querySelector(selector);
const status = $("#status");
const seed = $("#seed");
const rawStatus = $("#raw-status");
const collectButton = $("#collect");
const packId = $("#pack-id");
const loadPackButton = $("#load-pack");
const review = $("#review");
const reviewMessage = $("#review-message");
const tableBody = $("#review-body");
const searchInput = $("#keyword-search");
const roleFilter = $("#role-filter");
const totalFilter = $("#total-filter");
const competitionFilter = $("#competition-filter");
const webFilter = $("#web-filter");
const sortField = $("#sort-field");
const sortDirection = $("#sort-direction");
const resultCount = $("#result-count");
const reviewVersion = $("#review-version");
const reviewVersionSelect = $("#review-version-select");
const saveReviewButton = $("#save-review");
const loadReviewButton = $("#load-review");
const createHandoffButton = $("#create-handoff");
const reviewSaveStatus = $("#review-save-status");
const hubSeedInput = $("#hub-seed");
const hubStoryInput = $("#hub-story");
const storyDirectionInput = $("#story-direction");
const plannerHypothesisInput = $("#planner-hypothesis");
const reviewerDirectionInput = $("#reviewer-direction");
const confirmHubContextButton = $("#confirm-hub-context");
const confirmPlannerHypothesisButton = $("#confirm-planner-hypothesis");
const confirmReviewerDirectionButton = $("#confirm-reviewer-direction");
const step1Status = $("#step-1-status");
const step2Status = $("#step-2-status");
const step3Status = $("#step-3-status");
const researchReady = $("#research-ready");
const researchSeedsPanel = $("#research-seeds-panel");
const generateResearchSeedsButton = $("#generate-research-seeds");
const researchSeedsMessage = $("#research-seeds-message");
const researchSeedsStatus = $("#research-seeds-status");
const researchSeedsBody = $("#research-seeds-body");
const researchSeedsReady = $("#research-seeds-ready");
const confirmAllResearchSeedsButton = $("#confirm-all-research-seeds");
const resetAllResearchSeedsButton = $("#reset-all-research-seeds");
let currentRows = [];
let decisions = new Map();
let notes = new Map();
let currentPackVersion = 1;
const researchInput = {
  hub_context: { hub_seed: "", hub_story: "", story_direction: "", confirmed: false },
  planner_hypothesis: { raw_text: "", confirmed: false },
  reviewer_research_direction: { raw_text: "", confirmed: false },
};
let researchSeeds = [];
let researchSeedsStale = false;

function hasText(value) { return Boolean(value.trim()); }
function invalidateResearchFrom(step) {
  if (step <= 1) {
    researchInput.hub_context.confirmed = false;
    researchInput.planner_hypothesis.confirmed = false;
    researchInput.reviewer_research_direction.confirmed = false;
  } else if (step === 2) {
    researchInput.planner_hypothesis.confirmed = false;
    researchInput.reviewer_research_direction.confirmed = false;
  } else {
    researchInput.reviewer_research_direction.confirmed = false;
  }
  if (researchSeeds.length > 0) researchSeedsStale = true;
  renderResearchInputState();
}
function renderResearchInputState() {
  step1Status.textContent = researchInput.hub_context.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  step2Status.textContent = researchInput.planner_hypothesis.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  step3Status.textContent = researchInput.reviewer_research_direction.confirmed ? "확인 완료" : "입력 필요 · 재확인 필요";
  confirmPlannerHypothesisButton.disabled = !researchInput.hub_context.confirmed;
  confirmReviewerDirectionButton.disabled = !researchInput.planner_hypothesis.confirmed;
  const contextConfirmed = researchInput.hub_context.confirmed && researchInput.planner_hypothesis.confirmed && researchInput.reviewer_research_direction.confirmed;
  researchReady.hidden = !contextConfirmed;
  researchSeedsPanel.hidden = !contextConfirmed;
  generateResearchSeedsButton.disabled = !contextConfirmed;
  if (researchSeedsStale) {
    researchSeedsStatus.textContent = "재생성 필요";
    researchSeedsMessage.textContent = "Research Context가 변경되었습니다. Research Seed를 다시 생성하세요.";
    researchSeedsReady.hidden = true;
  }
}
function bindResearchInput(input, update, invalidationStep) {
  input.addEventListener("input", () => { update(input.value); invalidateResearchFrom(invalidationStep); });
}
bindResearchInput(hubSeedInput, (value) => { researchInput.hub_context.hub_seed = value; }, 1);
bindResearchInput(hubStoryInput, (value) => { researchInput.hub_context.hub_story = value; }, 1);
bindResearchInput(storyDirectionInput, (value) => { researchInput.hub_context.story_direction = value; }, 1);
bindResearchInput(plannerHypothesisInput, (value) => { researchInput.planner_hypothesis.raw_text = value; }, 2);
bindResearchInput(reviewerDirectionInput, (value) => { researchInput.reviewer_research_direction.raw_text = value; }, 3);
function syncResearchInputFromDom() {
  researchInput.hub_context.hub_seed = hubSeedInput.value;
  researchInput.hub_context.hub_story = hubStoryInput.value;
  researchInput.hub_context.story_direction = storyDirectionInput.value;
  researchInput.planner_hypothesis.raw_text = plannerHypothesisInput.value;
  researchInput.reviewer_research_direction.raw_text = reviewerDirectionInput.value;
}
confirmHubContextButton.addEventListener("click", () => {
  if (![researchInput.hub_context.hub_seed, researchInput.hub_context.hub_story, researchInput.hub_context.story_direction].every(hasText)) {
    step1Status.textContent = "입력 필요";
    return;
  }
  researchInput.hub_context.confirmed = true;
  renderResearchInputState();
});
confirmPlannerHypothesisButton.addEventListener("click", () => {
  if (!hasText(researchInput.planner_hypothesis.raw_text)) { step2Status.textContent = "입력 필요"; return; }
  researchInput.planner_hypothesis.confirmed = true;
  renderResearchInputState();
});
confirmReviewerDirectionButton.addEventListener("click", () => {
  if (!hasText(researchInput.reviewer_research_direction.raw_text)) { step3Status.textContent = "입력 필요"; return; }
  researchInput.reviewer_research_direction.confirmed = true;
  renderResearchInputState();
});
function renderResearchSeedCounts() {
  const counts = { PROPOSED: 0, CONFIRMED: 0, EXCLUDED: 0 };
  for (const seed of researchSeeds) counts[seed.status] += 1;
  $("#seed-proposed-count").textContent = counts.PROPOSED;
  $("#seed-confirmed-count").textContent = counts.CONFIRMED;
  $("#seed-excluded-count").textContent = counts.EXCLUDED;
  researchSeedsReady.hidden = researchSeeds.length === 0 || researchSeedsStale || counts.CONFIRMED === 0;
  researchSeedsReady.textContent = `Research Seeds 검토 완료\nCONFIRMED ${counts.CONFIRMED}개`;
}
function sourceLabel(sourceType) {
  return { HUB_CONTEXT: "Hub", PLANNER_HYPOTHESIS: "Planner", REVIEWER_RESEARCH_DIRECTION: "Reviewer" }[sourceType] || sourceType;
}
function renderResearchSeeds() {
  const researchSeedsTable = researchSeedsBody.closest("table");
  const researchSeedsHeader = researchSeedsTable?.querySelector("thead tr");
  researchSeedsHeader?.replaceChildren(...["Research Seed", "Source", "Reason", "Decision"].map((label) => {
    const cell = document.createElement("th");
    cell.textContent = label;
    return cell;
  }));
  researchSeedsBody.replaceChildren();
  for (const seed of researchSeeds) {
    const row = document.createElement("tr");
    const seedCell = document.createElement("td"); seedCell.textContent = seed.seed_text; row.append(seedCell);
    const sourceCell = document.createElement("td"); sourceCell.textContent = seed.source_types.map(sourceLabel).join(", "); row.append(sourceCell);
    const reasonCell = document.createElement("td"); reasonCell.textContent = seed.reason || "REVIEW_REQUIRED"; row.append(reasonCell);
    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    for (const status of ["PROPOSED", "CONFIRMED", "EXCLUDED"]) statusSelect.append(new Option(status, status));
    statusSelect.value = seed.status;
    statusSelect.addEventListener("change", () => { researchSeeds = updateResearchSeedStatus(researchSeeds, seed.research_seed_id, statusSelect.value); renderResearchSeeds(); });
    statusCell.append(statusSelect); row.append(statusCell); researchSeedsBody.append(row);
  }
  renderResearchSeedCounts();
}
generateResearchSeedsButton.addEventListener("click", () => {
  syncResearchInputFromDom();
  if (!(researchInput.hub_context.confirmed && researchInput.planner_hypothesis.confirmed && researchInput.reviewer_research_direction.confirmed)) {
    return;
  }
  researchSeeds = generateResearchSeeds(researchInput);
  researchSeedsStale = false;
  researchSeedsStatus.textContent = researchSeeds.length ? "생성 완료" : "추출된 Seed 없음";
  researchSeedsMessage.textContent = researchSeeds.length ? "Research Seed 후보를 검토하세요. 아직 Search API를 호출하지 않았습니다." : "명시적인 Search Candidate를 찾지 못했습니다. REVIEW_REQUIRED";
  renderResearchSeeds();
});
function setAllResearchSeedStatuses(status) {
  researchSeeds = researchSeeds.map((seed) => ({ ...seed, status }));
  renderResearchSeeds();
}
confirmAllResearchSeedsButton.addEventListener("click", () => setAllResearchSeedStatuses("CONFIRMED"));
resetAllResearchSeedsButton.addEventListener("click", () => setAllResearchSeedStatuses("PROPOSED"));
renderResearchInputState();

function formatNumber(value) { return typeof value === "number" ? value.toLocaleString("ko-KR") : "—"; }
function volumeValue(value, rawValue) { return typeof value === "number" ? formatNumber(value) : rawValue || "—"; }
function setOptionValues(select, values) {
  const current = select.value;
  select.replaceChildren(new Option("ALL", "ALL"));
  for (const value of values.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), "ko"))) select.append(new Option(value, value));
  select.value = values.includes(current) ? current : "ALL";
}
function updateCounts() {
  const counts = { SELECTED: 0, EXCLUDED: 0, UNDECIDED: 0 };
  for (const decision of decisions.values()) counts[decision] += 1;
  $("#selected-count").textContent = counts.SELECTED;
  $("#excluded-count").textContent = counts.EXCLUDED;
  $("#undecided-count").textContent = counts.UNDECIDED;
}
function resetReviewState() {
  decisions = new Map(currentRows.map((row) => [row.candidate.keyword_id, "UNDECIDED"]));
  notes = new Map(currentRows.map((row) => [row.candidate.keyword_id, ""]));
  reviewVersion.textContent = "NEW";
  updateCounts();
}
function renderSummary(pack) {
  const metadata = pack.metadata;
  $("#summary-collection").textContent = metadata.collection_id;
  $("#summary-seed").textContent = metadata.hub_seed;
  $("#summary-status").textContent = metadata.collection_status;
  $("#summary-candidates").textContent = metadata.keyword_count;
  $("#summary-hub").textContent = pack.keywords.filter((item) => item.keyword_role === "HUB_SEED").length;
  $("#summary-related").textContent = pack.keywords.filter((item) => item.keyword_role === "RELATED_KEYWORD").length;
  $("#summary-evidence").textContent = metadata.evidence_count;
  $("#summary-metrics").textContent = metadata.derived_metric_count;
  $("#summary-search-ads").textContent = pack.source_summary.NAVER_SEARCH_ADS?.status || "NOT_AVAILABLE";
  $("#summary-web").textContent = pack.source_summary.NAVER_API_HUB_WEBKR?.status || "NOT_AVAILABLE";
  $("#summary-trend").textContent = pack.source_summary.NAVER_API_HUB_SEARCH_TREND?.status || "NOT_COLLECTED";
  $("#summary-ratio").textContent = `${pack.competition_ratio.formula} / ${pack.competition_ratio.formula_version}`;
}
function renderTable() {
  const filtered = filterReviewRows(currentRows, { search: searchInput.value, role: roleFilter.value, totalStatus: totalFilter.value, competition: competitionFilter.value, webStatus: webFilter.value });
  const sorted = sortReviewRows(filtered, sortField.value, sortDirection.value);
  resultCount.textContent = `${sorted.length} / ${currentRows.length}`;
  tableBody.replaceChildren();
  for (const row of sorted) {
    const id = row.candidate.keyword_id;
    const tr = document.createElement("tr");
    const values = [row.keyword, row.role, volumeValue(row.pcValue, row.pcRawValue), volumeValue(row.mobileValue, row.mobileRawValue), row.totalValue == null ? "—" : formatNumber(row.totalValue), row.totalStatus, row.competition || "—", row.webStatus, row.trendStatus, row.providers.join(", ") || "—"];
    for (const value of values) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
    const decisionCell = document.createElement("td");
    const decision = document.createElement("select");
    for (const value of ["SELECTED", "EXCLUDED", "UNDECIDED"]) decision.append(new Option(value, value));
    decision.value = decisions.get(id) || "UNDECIDED";
    decision.addEventListener("change", () => { decisions.set(id, decision.value); updateCounts(); });
    decisionCell.append(decision); tr.append(decisionCell);
    const noteCell = document.createElement("td");
    const note = document.createElement("input"); note.type = "text"; note.value = notes.get(id) || ""; note.placeholder = "Reviewer note";
    note.addEventListener("input", () => notes.set(id, note.value)); noteCell.append(note); tr.append(noteCell);
    const detailCell = document.createElement("td"); const details = document.createElement("details"); const summary = document.createElement("summary"); summary.textContent = "Details"; const pre = document.createElement("pre");
    pre.textContent = JSON.stringify({ keyword_id: id, evidence_ids: row.evidenceIds, metric_ids: row.metricIds, source_run_ids: row.sourceRunIds, raw_references: row.rawReferences, collected_at: row.collectedAt }, null, 2);
    details.append(summary, pre); detailCell.append(details); tr.append(detailCell); tableBody.append(tr);
  }
  updateCounts();
}
function renderFilters() {
  setOptionValues(roleFilter, [...new Set(currentRows.map((row) => row.role))]);
  setOptionValues(totalFilter, [...new Set(currentRows.map((row) => row.totalStatus))]);
  setOptionValues(competitionFilter, [...new Set(currentRows.map((row) => row.competition))]);
  setOptionValues(webFilter, [...new Set(currentRows.map((row) => row.webStatus))]);
}
async function loadReview(version = null) {
  const suffix = version ? `&version=${encodeURIComponent(version)}` : "";
  const response = await fetch(`/review?collectionId=${encodeURIComponent(packId.value.trim())}${suffix}`);
  if (!response.ok) throw new Error("Review 조회에 실패했습니다.");
  const data = await response.json();
  reviewVersionSelect.replaceChildren(new Option("LATEST", ""));
  for (const item of data.versions || []) reviewVersionSelect.append(new Option(`v${item}`, String(item)));
  resetReviewState();
  if (data.review) {
    reviewVersion.textContent = `v${data.review.review_version}`;
    for (const item of data.review.reviewer_selection) { decisions.set(item.keyword_id, item.decision); notes.set(item.keyword_id, item.reviewer_note || ""); }
  }
  updateCounts();
}
async function loadPack(collectionId) {
  const trimmed = collectionId.trim();
  if (!trimmed) throw new Error("Collection ID가 필요합니다.");
  reviewMessage.textContent = "Pack을 조회하는 중입니다.";
  const response = await fetch(`/pack?collectionId=${encodeURIComponent(trimmed)}`);
  if (!response.ok) throw new Error(response.status === 404 ? "해당 Collection의 Pack을 찾을 수 없습니다." : "Pack 조회에 실패했습니다.");
  const pack = await response.json(); packId.value = pack.metadata.collection_id; currentPackVersion = Number(pack.metadata.pack_version); currentRows = createReviewRows(pack);
  renderSummary(pack); renderFilters(); await loadReview(); renderTable(); review.hidden = false;
  reviewMessage.textContent = "Pack과 Review Selection을 기준으로 표시 중입니다. Pack은 변경하지 않습니다.";
}
async function saveReview() {
  saveReviewButton.disabled = true;
  saveReviewButton.textContent = "저장 중...";
  reviewSaveStatus.textContent = "저장 중...";
  try {
    const reviewerSelection = currentRows.map((row) => ({ keyword_id: row.candidate.keyword_id, decision: decisions.get(row.candidate.keyword_id) || "UNDECIDED", reviewer_note: notes.get(row.candidate.keyword_id) || "" }));
    const response = await fetch("/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collectionId: packId.value.trim(), packVersion: currentPackVersion, reviewerSelection }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Review 저장에 실패했습니다.");
    await loadReview(String(result.review.review_version)); renderTable(); reviewMessage.textContent = `Review v${result.review.review_version}이 저장되었습니다.`;
    reviewSaveStatus.textContent = `저장 완료 · v${result.review.review_version}`;
  } catch (error) {
    reviewSaveStatus.textContent = "저장 실패";
    throw error;
  } finally {
    saveReviewButton.disabled = false;
    saveReviewButton.textContent = "Review 저장";
  }
}
loadPackButton.addEventListener("click", async () => { try { await loadPack(packId.value); } catch (error) { review.hidden = false; reviewMessage.textContent = error.message; } });
saveReviewButton.addEventListener("click", async () => { try { await saveReview(); } catch (error) { reviewMessage.textContent = error.message; } });
loadReviewButton.addEventListener("click", async () => { try { await loadReview(reviewVersionSelect.value || null); renderTable(); } catch (error) { reviewMessage.textContent = error.message; } });
createHandoffButton.addEventListener("click", async () => {
  createHandoffButton.disabled = true;
  try {
    const reviewVersionValue = reviewVersion.textContent.startsWith("v") ? Number(reviewVersion.textContent.slice(1)) : null;
    const response = await fetch("/handoff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collectionId: packId.value.trim(), packVersion: currentPackVersion, reviewVersion: reviewVersionValue }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "GEO Handoff 생성에 실패했습니다.");
    reviewMessage.textContent = `GEO Handoff 생성 완료 · v${result.handoff.handoff_version} · Review v${result.handoff.review_version} · SELECTED ${result.handoff.selected_candidates.length}개`;
  } catch (error) { reviewMessage.textContent = error.message; } finally { createHandoffButton.disabled = false; }
});
for (const control of [searchInput, roleFilter, totalFilter, competitionFilter, webFilter, sortField, sortDirection]) control.addEventListener("input", renderTable);
collectButton.addEventListener("click", async () => {
  status.textContent = "확인 중"; rawStatus.textContent = "수집 중"; collectButton.disabled = true;
  try {
    const response = await fetch("/collect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seedKeyword: seed.value }) });
    const result = await response.json(); const collectionStatus = result.snapshot?.status;
    if (collectionStatus === "SUCCESS" || collectionStatus === "PARTIAL_SUCCESS") { status.textContent = collectionStatus; rawStatus.textContent = `Evidence ${result.evidence?.length ?? 0}건`; packId.value = result.collectionId || ""; try { await loadPack(result.collectionId); } catch (error) { review.hidden = false; reviewMessage.textContent = `Collection은 완료되었지만 Pack은 아직 조회할 수 없습니다: ${error.message}`; } }
    else { status.textContent = "실패"; rawStatus.textContent = result.status === "WAITING_FOR_CREDENTIALS" ? "대기" : "실패"; $("#preflight").textContent = result.preflight?.status || result.status || "FAILED"; }
  } catch { status.textContent = "실패"; rawStatus.textContent = "실패"; } finally { collectButton.disabled = false; }
});
await fetch("/status").then((response) => response.json()).then((data) => { status.textContent = data.status; $("#stage").textContent = data.stage; $("#preflight").textContent = data.sourcePreflight.status; $("#ratio").textContent = `${data.competitionRatio.formula} / ${data.competitionRatio.formulaVersion}`; }).catch(() => { status.textContent = "상태 확인 실패"; });
const initialCollectionId = new URLSearchParams(location.search).get("collectionId");
if (initialCollectionId) { packId.value = initialCollectionId; loadPack(initialCollectionId).catch((error) => { review.hidden = false; reviewMessage.textContent = error.message; }); }
