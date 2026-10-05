const SECTION_MARKERS = [
  { pattern: /^(?:main\s+keyword|주s*키워드)\s*[:：]?\s*(.*)$/i, sourceType: "PLANNER_HYPOTHESIS", label: "MAIN_KEYWORD" },
  { pattern: /^(?:secondary\s+keywords?|보조\s*키워드)\s*[:：]?\s*(.*)$/i, sourceType: "PLANNER_HYPOTHESIS", label: "SECONDARY_KEYWORDS" },
  { pattern: /^(?:demand\s+anchor|수요\s*앵커)\s*[:：]?\s*(.*)$/i, sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "DEMAND_ANCHOR" },
  { pattern: /^(?:search\s+entrance|검색\s*진입(?:어|점)?)\s*[:：]?\s*(.*)$/i, sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "SEARCH_ENTRANCE" },
  { pattern: /^(?:intent\s+bridge|의도\s*브리지)\s*[:：]?\s*(.*)$/i, sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "INTENT_BRIDGE" },
  { pattern: /^(?:planner\s+hypothesis|planner\s+research\s+candidate|planner\s+가설)\s*[:：]?\s*$/i, sourceType: "PLANNER_HYPOTHESIS", label: "PLANNER_HYPOTHESIS" },
  { pattern: /^(?:reviewer\s+research\s+direction|reviewer\s+direction|reviewer\s+research\s+candidate|reviewer\s+결과)\s*[:：]?\s*$/i, sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "REVIEWER_RESEARCH_DIRECTION" },
  { pattern: /^(?:실제\s*조회\s*대상|검증\s*대상|수요\s*검증\s*대상|1차\s*확인\s*대상|2차\s*확인\s*대상|3차\s*(?:long[- ]?tail|롱테일)\s*대상)\s*[:：]?\s*(.*)$/i, sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "EXPLICIT_REVIEW_TARGET" },
  { pattern: /^(?:search\s+seed(?:s)?|research\s+seed(?:s)?|핵심\s*search\s*표현|검색\s*시드)\s*[:：]?\s*(.*)$/i, sourceType: "HUB_CONTEXT", label: "EXPLICIT_HUB_SEARCH_EXPRESSION" },
];

const VERIFICATION_REQUIRED_MARKER = { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "VERIFICATION_REQUIRED", pattern: /^verification\s+required\s*[:：]?\s*$/i };
const REVIEW_STRUCTURED_MARKERS = [
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "PRIORITY_REVIEW_GROUP", pattern: /^\d+\s*차\s+우선\s+확인군(?:\s*후보)?$/u },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "EXPLICIT_REVIEW_TARGET", pattern: /^(?:실제\s+)?(?:검색|조회)\s*(?:데이터\s*)?(?:조사\s*)?(?:대상|확인군)(?:\s*\/\s*(?:확인군|대상))?(?:\s*후보)?$/u },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "REVIEW_QUERY_STAGE_1", acceptUnbulleted: true, codeBlockOnly: true, keepUntilCodeBlock: true, pattern: /^1차\s+핵심\s+조회(?:\s*(?:[-–—:]\s*).*)?$/u },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "REVIEW_QUERY_STAGE_2", acceptUnbulleted: true, codeBlockOnly: true, keepUntilCodeBlock: true, pattern: /^2차\s+추가\s+조회(?:\s*(?:[-–—:]\s*).*)?$/u },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "REVIEW_QUERY_STAGE_3", acceptUnbulleted: true, codeBlockOnly: true, keepUntilCodeBlock: true, pattern: /^3차\s+선택\s+조회(?:\s*(?:[-–—:]\s*).*)?$/u },
];
const RUNTIME_MARKERS = [
  { sourceType: "PLANNER_HYPOTHESIS", label: "MAIN_KEYWORD", acceptUnbulleted: false, pattern: /^(?:[-*]\s*)?main\s+keyword\s*[:：]\s*(.*)$/i },
  { sourceType: "PLANNER_HYPOTHESIS", label: "SECONDARY_KEYWORDS", acceptUnbulleted: false, pattern: /^(?:[-*]\s*)?secondary\s+keywords?\s*[:：]\s*(.*)$/i },
  { sourceType: "PLANNER_HYPOTHESIS", label: "MAIN_KEYWORD", acceptUnbulleted: false, pattern: /^(?:[-*]\s*)?\*\*(?:main\s+keyword):\*\*\s*(.*)$/i },
  { sourceType: "PLANNER_HYPOTHESIS", label: "SECONDARY_KEYWORDS", acceptUnbulleted: false, pattern: /^(?:[-*]\s*)?\*\*(?:secondary\s+keywords?):\*\*\s*(.*)$/i },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "DEMAND_ANCHOR_GROUP", acceptUnbulleted: true, pattern: /^\d+\s*차\s+demand\s+anchor\s+조회$/iu },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "SEARCH_ENTRANCE_GROUP", acceptUnbulleted: true, pattern: /^\d+\s*차\s+search\s+entrance\s*\/\s*intent\s+bridge$/iu },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "EXPLICIT_REVIEW_TARGET", acceptUnbulleted: true, pattern: /^\d+\s*차\s+전문\s+knowledge\s+연결\s+조회$/iu },
  { sourceType: "REVIEWER_RESEARCH_DIRECTION", label: "PRIMARY_DEMAND_ANCHORS", acceptUnbulleted: true, pattern: /^primary\s+demand\s+anchors$/i },
];

function normalizeSeedText(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

function cleanCandidate(value) {
  return normalizeSeedText(String(value).replace(/^[-*•·][ \t]*/u, "").replace(/^\d+[.)][ \t]*/u, ""));
}

function isStatusOrDecisionText(value) {
  const text = cleanCandidate(value);
  return /^(?:확정\s*[:：]\s*보류|보류|not\s+confirmed|not\s+provided|required|verification\s+required|search\s+demand|planner\s+handoff|mode\s+[ab]|현재\s+판단)(?:\s*[:：].*)?$/iu.test(text);
}

function isCandidateLine(value) {
  const text = cleanCandidate(value);
  if (!text || text.length > 160) return false;
  if (isStatusOrDecisionText(text)) return false;
  if (/^(?:node|section|step|reason|이유|설명|reviewer|planner|hub)\b\s*[:：]?$/iu.test(text)) return false;
  return !/^[ \t]/u.test(text) && !/[.!?。！？;；]/u.test(text);
}

function reviewerStagesFromMarker(marker) {
  const match = /^REVIEW_QUERY_STAGE_([123])$/u.exec(String(marker ?? ""));
  return match ? [Number(match[1])] : [];
}

function splitInlineCandidates(value) {
  const text = cleanCandidate(value);
  if (!text) return [];
  return text.split(/\s*(?:,|，|\/|、)\s*/u).map(cleanCandidate).filter(isCandidateLine);
}

function normalizeSectionLine(value) {
  return String(value ?? "").replace(/^#{1,6}\s+/u, "").replace(/^\*\*(.*?)\*\*$/u, "$1").trim();
}

function addCandidate(candidates, candidate, sourceType, inputField, lineNumber, marker, reason) {
  const normalized = normalizeSeedText(candidate);
  if (!isCandidateLine(normalized)) return;
  const existing = candidates.get(normalized);
  const reference = { source_type: sourceType, input_field: inputField, line_number: lineNumber, marker, text: normalized };
  if (existing) {
    if (!existing.source_types.includes(sourceType)) existing.source_types.push(sourceType);
    existing.source_references.push(reference);
    existing.reviewer_stages = [...new Set([...existing.reviewer_stages, ...reviewerStagesFromMarker(marker)])].sort((a, b) => a - b);
    if (reason && !existing.reasons.includes(reason)) existing.reasons.push(reason);
    existing.reason = existing.reasons.join("; ");
    return;
  }
  candidates.set(normalized, { seed_text: normalized, normalized_seed_text: normalized, source_types: [sourceType], source_references: [reference], reviewer_stages: reviewerStagesFromMarker(marker), reasons: reason ? [reason] : [], reason: reason || "", status: "PROPOSED" });
}

function extractFromField(value, inputField, candidates) {
  const lines = String(value ?? "").split(/\r?\n/u);
  let active = null;
  let inCodeBlock = false;
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (/^```/u.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock) active = null;
      continue;
    }
    const sectionLine = normalizeSectionLine(line);
    const marker = RUNTIME_MARKERS.find((item) => item.pattern.test(sectionLine)) || (VERIFICATION_REQUIRED_MARKER.pattern.test(sectionLine)
      ? VERIFICATION_REQUIRED_MARKER
      : REVIEW_STRUCTURED_MARKERS.find((item) => item.pattern.test(sectionLine)) || SECTION_MARKERS.find((item) => item.pattern.test(sectionLine)));
    if (marker) {
      const match = marker.pattern.exec(sectionLine);
      const hasInlineDelimiter = /[:：]/u.test(sectionLine);
      const inlineValue = hasInlineDelimiter ? (match?.[1] || "") : "";
      for (const candidate of splitInlineCandidates(inlineValue)) addCandidate(candidates, candidate, marker.sourceType, inputField, index + 1, marker.label, `${marker.label} in ${inputField}`);
      active = hasInlineDelimiter && inlineValue ? null : marker;
      continue;
    }
    if (!line) {
      const nextNonEmptyLine = lines.slice(index + 1).find((candidateLine) => candidateLine.trim());
      const blankBeforeActiveCodeBlock = active?.acceptUnbulleted && /^```/u.test(nextNonEmptyLine?.trim() || "");
      if (!blankBeforeActiveCodeBlock && !active?.keepUntilCodeBlock) active = null;
      continue;
    }
    if (!active || (active.codeBlockOnly && !inCodeBlock) || !isCandidateLine(cleanCandidate(line))) continue;
    const candidate = cleanCandidate(line);
    const isListItem = /^[-*•·][ \t]*/u.test(line) || /^\d+[.)][ \t]*/u.test(line);
    const isExplicitSectionLine = active.label === "PLANNER_HYPOTHESIS" || active.label === "REVIEWER_RESEARCH_DIRECTION";
    if (isListItem || isExplicitSectionLine || active.acceptUnbulleted) addCandidate(candidates, candidate, active.sourceType, inputField, index + 1, active.label, `${active.label} in ${inputField}`);
  }
}

export function generateResearchSeeds({ hub_context, planner_hypothesis, reviewer_research_direction, hubContext, plannerHypothesis, reviewerResearchDirection } = {}) {
  const hub = hub_context || hubContext || {};
  const planner = planner_hypothesis || plannerHypothesis || {};
  const reviewer = reviewer_research_direction || reviewerResearchDirection || {};
  const candidates = new Map();
  extractFromField(hub?.hub_story, "hub_story", candidates);
  extractFromField(hub?.story_direction, "story_direction", candidates);
  extractFromField(planner?.raw_text, "planner_hypothesis_raw", candidates);
  extractFromField(reviewer?.raw_text, "reviewer_research_direction_raw", candidates);
  const result = [...candidates.values()].map((seed, index) => ({ research_seed_id: `research_seed_${String(index + 1).padStart(3, "0")}`, ...seed }));
  return result;
}

export function updateResearchSeedStatus(seeds, researchSeedId, status) {
  if (!["PROPOSED", "CONFIRMED", "EXCLUDED"].includes(status)) throw new Error("RESEARCH_SEED_STATUS_INVALID");
  return seeds.map((seed) => seed.research_seed_id === researchSeedId ? { ...seed, status } : seed);
}
