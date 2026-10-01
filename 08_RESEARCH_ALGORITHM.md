# GEO SEARCH EVIDENCE COLLECTOR
# RESEARCH ALGORITHM

Status: SoT Candidate
Version: 1.0
Document Type: Research Algorithm
Scope: GEO Search Evidence Collector
Implementation Status: NOT IMPLEMENTED
Last Updated: 2026-10-01

---

# 0. DOCUMENT ROLE

이 문서는 GEO Search Evidence Collector가
하나의 Hub를 대상으로 Search Demand를 조사하고,
실제 Search Evidence를 수집·검증·구조화·압축하여
GEO Network Planner에 전달하는 Research Algorithm을 정의한다.

이 문서는 Collector의 Research 판단 순서와
각 단계의 책임 경계를 정의한다.

기존 Evidence Infrastructure를 대체하지 않는다.

기존의 다음 구조는 유지한다.

- RAW First
- Source Provenance
- Canonical Evidence
- Validation
- Derived Metric
- Snapshot
- Partial Failure
- Error Registry
- Multi-Source Collection
- Search Evidence Pack
- Human Review
- Versioned Artifact
- Handoff Adapter

본 문서는 그 위에

Research Context
→ Research Direction
→ Research Gate
→ Deep Research
→ Search Demand Structure
→ Evidence Compression
→ Final Planner Handoff

레이어를 추가한다.

---

# 1. PURPOSE

GEO Search Evidence Collector의 목적은
단순히 Related Keyword를 많이 수집하는 것이 아니다.

Collector는 하나의 Hub를 대상으로

- 무엇을 조사하려는 Hub인지 이해하고
- Planner가 만든 1차 Knowledge Hypothesis를 이해하고
- Reviewer가 지정한 Research Direction을 이해하고
- 실제 Search Demand를 넓게 발견하고
- 필요한 영역을 깊게 조사하고
- Search Evidence를 검증하고
- 실제 검색행동의 구조를 파악하고
- Planner가 사용할 수 있도록 Evidence를 압축하여

최종적으로 GEO Network Planner가
더 정확한 Knowledge Architecture를 설계하도록 돕는다.

Collector는 최종 Knowledge Architecture를 결정하지 않는다.

---

# 2. CORE PRINCIPLES

## 2.1 Evidence First

판단의 근거는 실제 Search Evidence여야 한다.

Planner와 Reviewer는 조사 방향과 가설을 제공한다.

실제 Search Demand 여부는 Evidence로 확인한다.

---

## 2.2 RAW First

Provider가 반환한 원본 데이터는
가공 전에 RAW 형태로 보존한다.

가공 결과가 RAW를 대체해서는 안 된다.

---

## 2.3 Source Provenance

모든 주요 Evidence와 Research Artifact는
가능한 범위에서 출처를 추적할 수 있어야 한다.

출처 예:

- HUB_CONTEXT
- PLANNER_HYPOTHESIS
- REVIEWER_RESEARCH_DIRECTION
- NAVER_SEARCH_ADS
- NAVER_WEB_SEARCH
- TREND_SOURCE
- BROAD_DISCOVERY
- DIRECTED_RESEARCH

---

## 2.4 Discovery ≠ Deep Research ≠ Knowledge Node

다음 세 상태는 서로 다르다.

1. 발견된 Candidate
2. Deep Research 대상
3. 최종 Knowledge Node

Candidate가 발견되었다고
Deep Research 대상이 되는 것은 아니다.

Deep Research 대상이 되었다고
Knowledge Node가 되는 것도 아니다.

최종 Knowledge Node 판단은
GEO Network Planner의 책임이다.

---

## 2.5 Gate ≠ Delete

Research Gate는
Evidence 삭제 장치가 아니다.

Gate는 제한된 Research Resource를
어디에 우선 투입할지 결정하는

Research Resource Allocation Layer

이다.

Gate를 통과하지 못한 Candidate도
RAW / Evidence / Snapshot에서 삭제하지 않는다.

---

## 2.6 Compression ≠ Deletion

Evidence Compression은
원본 Evidence 삭제가 아니다.

Collector 내부에서는
가능한 Evidence를 풍부하게 보존한다.

Final Planner Handoff에서는
Planner 판단에 필요한 정보만 압축하여 제공한다.

압축 결과에서 원본 Evidence로 돌아갈 수 있는
Lineage를 유지해야 한다.

---

## 2.7 Cluster ≠ Node

Search Demand Cluster는
실제 검색수요를 이해하기 위한 Research Artifact다.

Search Demand Cluster를
Knowledge Node로 자동 변환해서는 안 된다.

---

## 2.8 Planner Hypothesis ≠ Final Architecture

Network Planner 1차 결과는
검증 대상인 Knowledge Hypothesis다.

Collector는 이를 승인하거나 폐기하지 않는다.

Collector는 실제 Search Evidence를 연결한다.

최종 판단은 Network Planner가 수행한다.

---

# 3. OVERALL WORKFLOW

전체 GEO 흐름은 다음과 같다.

Hub Story Architect
↓
Network Planner 1차
↓
Strategy Planner Reviewer
↓
GEO Search Evidence Collector
↓
Network Planner 최종
↓
Final Hub Knowledge Map

Collector 내부 Research Algorithm은 다음과 같다.

HUB CONTEXT
↓
PLANNER HYPOTHESIS
↓
REVIEWER RESEARCH DIRECTION
↓
RESEARCH CONTEXT
↓
RESEARCH SEED GENERATION
↓
BROAD DISCOVERY + DIRECTED RESEARCH
↓
BASIC DEMAND COLLECTION
↓
DEMAND GATE
↓
INTENT / HUB RELEVANCE GATE
↓
DEEP RESEARCH TARGET
↓
DEEP RESEARCH
↓
SEARCH ENTRANCE ANALYSIS
↓
GROUNDED QUESTION LINKING
↓
SEARCH DEMAND CLUSTER
↓
PLANNER HYPOTHESIS VERIFICATION
↓
NEW DEMAND DISCOVERY
↓
EVIDENCE COMPRESSION
↓
FINAL PLANNER HANDOFF
↓
NETWORK PLANNER FINAL JUDGMENT

---

# 4. INPUT MODEL

Collector는 Research Context를
순차적으로 입력받는다.

세 입력을 하나의 자유 텍스트로 혼합하지 않는다.

각 입력의 역할과 Provenance를 분리한다.

---

# 5. STEP 1 — HUB CONTEXT

## 5.1 Input

첫 번째 입력은 Hub Context다.

최소 입력:

- Hub Seed
- Hub Story
- Story Direction

예:

Hub Seed:

원·달러 환율과 달러 가치의 변동 구조

Hub Story:

원·달러 환율이 단순히 오르고 내리는 숫자가 아니라
원화와 달러의 상대적 가치가 계속 재평가되는 결과라는 점을 이해한다.

Story Direction:

환율을 두 통화 사이의 상대적 가격이라는 관점에서 출발하여
경제 환경과 시장 기대 변화가 환율에 반영되는 구조를 이해한다.

---

## 5.2 Hub Seed ≠ Search Keyword

Hub Seed는 Search Keyword와 동일하지 않다.

예:

Hub Seed:

원·달러 환율과 달러 가치의 변동 구조

Search Keyword 후보:

- 환율
- 원달러 환율
- 달러 환율
- 환율 상승 이유
- 달러 가치
- 달러지수

Hub Seed를 그대로 Search API Query로 사용한다고
가정해서는 안 된다.

---

## 5.3 Step 1 Purpose

이 단계의 목적은

“무엇을 조사하려는 Hub인가?”

를 이해하는 것이다.

이 단계에서는 외부 Search API를 호출하지 않는다.

---

# 6. STEP 2 — PLANNER HYPOTHESIS

두 번째 입력은
Network Planner 1차 결과다.

포함 가능 정보:

- Hub
- Node
- Main Keyword
- Secondary Keyword
- User Question
- Intent
- Direct Answer Goal
- Understanding Goal
- Knowledge Relationship
- Flow
- Slug
- Internal Link
- Verification Required

이 정보는

PLANNER HYPOTHESIS

로 취급한다.

확정된 Knowledge Architecture로 취급하지 않는다.

Collector는 Planner Hypothesis를
후속 Search Evidence와 연결한다.

---

# 7. STEP 3 — REVIEWER RESEARCH DIRECTION

세 번째 입력은
Strategy Planner Reviewer 결과다.

포함 가능 정보:

- Mode
- Demand Anchor 후보
- Search Entrance 후보
- Search Intent 후보
- Intent Bridge 후보
- User Question Set
- Evergreen Knowledge 후보
- 실제 조회 목록
- 1차 핵심 조회
- 2차 추가 조회
- 3차 선택 조회
- Verification Target
- Reviewer Note
- Search Data Requirement

Reviewer 결과는
Directed Research의 주요 입력이다.

Reviewer가 제시한 Candidate는
확정 Search Demand가 아니다.

실제 Evidence로 검증해야 한다.

---

# 8. SEQUENTIAL CONFIRMATION

Collector UI는 세 입력을 순차적으로 받는 것을 기본으로 한다.

STEP 1
Hub Context 입력
↓
확인

STEP 2
Planner 1차 결과 입력
↓
확인

STEP 3
Reviewer 결과 입력
↓
확인

STEP 4
Search Evidence Collection 실행

각 확인 단계에서는
외부 Search API를 호출하지 않는다.

각 단계에서는 입력 내용을 구조화하고
핵심 이해 결과를 사용자에게 보여줄 수 있다.

사용자는 실제 Collection 실행 전에
Collector가 입력을 올바르게 이해했는지 확인할 수 있어야 한다.

---

# 9. RESEARCH CONTEXT

세 단계의 입력은 각각 원본을 보존한다.

Collector는 이를 결합하여
Research Context를 생성한다.

Research Context는 최소한 다음 관계를 이해해야 한다.

Hub Context
→ 무엇을 이해하려는가

Planner Hypothesis
→ 어떤 Knowledge 구조를 가설로 만들었는가

Reviewer Research Direction
→ 무엇을 실제 Search Evidence로 검증해야 하는가

Research Context는 원본 입력을 대체하지 않는다.

---

# 10. RESEARCH SEED GENERATION

Collector는 실제 Search Evidence 조사에 사용할
Research Seed를 생성한다.

Research Seed의 출처를 구분한다.

예:

- HUB_DERIVED
- PLANNER_DERIVED
- REVIEWER_DIRECTED
- BROAD_DISCOVERY

Research Seed에는 가능한 경우
다음 Context를 연결한다.

- seed_keyword
- origin
- research_stage
- research_reason
- related_planner_hypothesis
- related_reviewer_direction
- provenance
- status

---

# 11. REVIEWER RESEARCH STAGE

Reviewer가 Research Stage를 제공한 경우
이를 보존한다.

예:

PRIMARY
SECONDARY
CONDITIONAL

또는 원문 기준:

- 1차 핵심 조회
- 2차 추가 조회
- 3차 선택 조회

Research Stage는

Keyword Ranking

이 아니다.

Research Stage는 Reviewer가 지정한
조사 순서 또는 Research Direction이다.

Collector는 이를 임의의 SEO/GEO Score로 변환하지 않는다.

---

# 12. BROAD DISCOVERY

Collector는 Reviewer가 지정한 Keyword만 조사하지 않는다.

Hub 및 Research Seed를 기반으로
Broad Discovery를 수행한다.

목적:

Planner와 Reviewer가 예상하지 못한
실제 Search Demand를 발견하는 것.

Broad Discovery 결과는
기존 Canonical Evidence 구조에 저장한다.

Broad Discovery의 규모를
임의로 축소해서는 안 된다.

예:

509개의 Related Keyword가 발견되었다면
509개 Candidate와 Evidence는 보존한다.

단,

509개 Candidate를 모두
Deep Research해야 한다는 의미는 아니다.

---

# 13. DIRECTED RESEARCH

Reviewer가 명시한 Research Seed는
Directed Research 대상으로 추적한다.

예:

환율
원달러 환율
달러 환율
환율 상승 이유
환율 하락 이유
달러 강세
달러지수
DXY
환율 결정 원리

각 Research Seed는
Reviewer가 왜 조사 대상으로 지정했는지
가능한 범위에서 보존한다.

예:

keyword:
달러지수

reason:
달러 가치 계열의 독립 Search Demand 확인

stage:
SECONDARY

source:
STRATEGY_PLANNER_REVIEWER

---

# 14. BASIC DEMAND COLLECTION

Broad Discovery 및 Directed Research에서 확보한 Candidate에 대해
기본 Search Demand Evidence를 수집한다.

기본 Evidence는 현재 Provider 능력과
Source Contract 범위 안에서 수집한다.

예:

- PC Search Volume
- Mobile Search Volume
- Total Search Volume
- Provider Competition
- Related Keyword
- Source
- RAW Reference

기존 Total Search Volume 규칙을 유지한다.

정확한 PC 숫자
+
정확한 Mobile 숫자

인 경우에만 EXACT Total을 계산한다.

하나라도 `<10`이 포함되면
임의 숫자로 변환하지 않는다.

status:

NOT_CALCULABLE

Missing 값은 기존 Contract에 따라 처리한다.

---

# 15. DEMAND GATE

## 15.1 Purpose

Demand Gate는
Deep Research Resource를 어디에 우선 투입할지 결정한다.

Evidence 삭제 필터가 아니다.

---

## 15.2 Operational Threshold

초기 운영 기본값:

DEEP_RESEARCH_DEMAND_THRESHOLD = 1000

classification:

OPERATIONAL_THRESHOLD

property:

configurable

이 값은 지식적 기준이나
Search Demand의 절대적 정의가 아니다.

운영 경험과 Evidence에 따라 변경할 수 있다.

코드에 변경 불가능한 상수로 고정해서는 안 된다.

---

## 15.3 Basic Rule

예:

monthly_search_volume_total >= configured threshold

→ Deep Research Candidate

monthly_search_volume_total < configured threshold

→ 기본적으로 Deep Research 우선 대상에서 제외 가능

그러나 Candidate와 Evidence는 삭제하지 않는다.

---

## 15.4 NOT_CALCULABLE

Total Search Volume이

NOT_CALCULABLE

인 경우 자동으로 수요 없음으로 처리해서는 안 된다.

예:

PC `<10`
Mobile 10

이 경우 정확한 Total을 계산할 수 없을 뿐
Search Demand가 없다는 의미가 아니다.

---

## 15.5 Gate Exception

Threshold 미만이어도
다음과 같은 경우 Deep Research 후보가 될 수 있다.

- Reviewer가 직접 검증을 지시한 Research Seed
- Planner의 핵심 User Question과 직접 연결된 Candidate
- Hub Story를 이해하는 데 중요한 Supporting Question
- Trend 확인이 필요한 Candidate
- 별도 Evidence에서 중요한 Search Entrance로 확인된 Candidate
- 다른 주요 Candidate와의 관계 확인이 필요한 Candidate

예외 통과는
원본 Search Volume을 변경하지 않는다.

예외 통과 이유를 기록한다.

---

# 16. INTENT / HUB RELEVANCE GATE

Demand Gate를 통과했다고
자동으로 Deep Research하지 않는다.

다음 단계에서
이번 Hub와의 관련성을 확인한다.

목적:

“실제 수요는 있지만
이번 Hub에서 깊게 조사할 필요가 있는가?”

를 판단하는 것이다.

예:

Search Volume 50,000

이어도 Hub Context와 관계가 없다면
Deep Research 대상에서 제외할 수 있다.

반대로 Search Volume 300이라도
Reviewer 직접 지시와 Hub Context가 명확하면
Deep Research 대상으로 유지할 수 있다.

---

## 16.1 Gate Inputs

가능한 판단 근거:

- Hub Context
- Planner Hypothesis
- Reviewer Research Direction
- Search Keyword
- Related Keyword Evidence
- Search Volume
- Search Entrance Evidence
- Provenance

---

## 16.2 No Unsupported Intent

Collector는 Keyword 문자열만 보고
Search Intent를 확정해서는 안 된다.

Evidence가 부족하면:

REVIEW_REQUIRED

또는

NOT_CONFIRMED

상태를 사용한다.

---

# 17. DEEP RESEARCH TARGET

Demand Gate와
Intent / Hub Relevance Gate 결과를 바탕으로

Deep Research Target을 생성한다.

Deep Research Target이 되는 것은
Knowledge Node 선정이 아니다.

Deep Research Target은

“추가 Research Resource를 투입할 가치가 있는 조사 대상”

이라는 의미다.

Target에는 가능한 경우 다음을 연결한다.

- Research Seed
- Demand Evidence
- Gate Decision
- Gate Reason
- Reviewer Direction
- Planner Hypothesis
- Provenance

---

# 18. DEEP RESEARCH

Deep Research Target에 대해서만
추가 Evidence를 조사한다.

가능한 Deep Research Source 예:

- Search Result Evidence
- Trend Evidence
- Additional Related Search Evidence
- Search Entrance Evidence
- Search Relationship Evidence

실제 Source는
기존 Data Source Standard와
Provider Contract를 따른다.

Deep Research 단계에서도
RAW First와 Source Provenance를 유지한다.

---

# 19. SEARCH RESULT EVIDENCE

Search Result Total은
정확한 Source Surface를 보존해야 한다.

예:

NAVER WEB Search Result Total

은

NAVER Web Document Search에서
해당 Query에 대해 반환된 total

이라는 의미다.

이를

NAVER 전체 문서수
인터넷 전체 문서수

등으로 확대 해석해서는 안 된다.

Search Result Evidence는
해당 Provider / Product / Vertical / Collection Time과 함께 해석한다.

---

# 20. PROVIDER COMPETITION

NAVER Search Ads의 compIdx는

Provider Competition Evidence

로 취급한다.

이는 GEO Competition Ratio가 아니다.

두 값을 혼합하거나
서로 대체해서는 안 된다.

---

# 21. COMPETITION RATIO

GEO Competition Ratio의 공식은
현재 확정되지 않았다.

따라서 다음 상태를 유지한다.

formula = NOT_CONFIGURED

formula_version = NOT_CONFIGURED

status = NOT_CONFIGURED

Search Volume,
Search Result Total,
Provider Competition

등을 임의로 조합하여
Competition Ratio를 생성해서는 안 된다.

---

# 22. SEARCH ENTRANCE ANALYSIS

Collector는 다수의 Keyword 표현이
어떤 Search Entrance를 형성하는지 조사한다.

예:

환율 상승 이유
환율 오르는 이유
원달러 환율 상승 이유

서로 다른 표현이
동일하거나 유사한 Search Demand를 나타낼 가능성이 있다.

그러나 문자열 유사성만으로
동일 Intent라고 확정해서는 안 된다.

Evidence가 부족하면:

REVIEW_REQUIRED

로 유지한다.

---

# 23. GROUNDED QUESTION LINKING

Collector는 Keyword만 보고
자유롭게 User Question을 만들어서는 안 된다.

Question은 Grounded되어야 한다.

허용 가능한 근거:

- Hub Context에서 제공된 Question
- Planner 제공 User Question
- Reviewer 제공 User Question
- 실제 Search Evidence
- Provenance가 존재하는 별도 Evidence Source

Question의 근거를 추적할 수 있어야 한다.

근거가 충분하지 않은 경우:

NOT_CONFIRMED

또는

REVIEW_REQUIRED

상태를 사용한다.

---

# 24. SEARCH DEMAND CLUSTER

Collector는 다수의 Keyword와 Evidence를
Search Demand 단위로 구조화할 수 있다.

예:

Search Demand Cluster:

환율 상승·하락

관련 표현:

- 환율 상승 이유
- 환율 오르는 이유
- 원달러 환율 상승
- 환율 하락 이유
- 환율 내리는 이유
- 원달러 환율 하락

Cluster는
Knowledge Node가 아니다.

---

## 24.1 Minimum Cluster Lineage

각 Cluster는 가능한 범위에서 다음을 보존한다.

- cluster_id
- related_keyword_ids
- source_evidence_ids
- source_metric_ids
- representative_search_entrances
- related_planner_hypothesis
- related_reviewer_direction
- evidence_status
- raw_references

Cluster의 모든 중요한 판단은
원본 Evidence로 추적할 수 있어야 한다.

---

# 25. PLANNER HYPOTHESIS VERIFICATION

Collector는 Planner가 만든
각 Knowledge Hypothesis와
실제 Search Evidence를 연결한다.

예:

Planner Hypothesis:

환율과 달러지수(DXY)의 관계

Search Evidence:

- 달러지수
- 달러 인덱스
- DXY
- 환율과 달러지수

Collector는 다음과 같은
Evidence 상태를 제공할 수 있다.

- EVIDENCE_SUPPORTED
- EVIDENCE_WEAK
- NOT_CONFIRMED
- REVIEW_REQUIRED

이 상태는

Node 승인
Node 삭제

결정이 아니다.

최종 판단은 Network Planner가 수행한다.

---

# 26. NEW DEMAND DISCOVERY

Broad Discovery 또는 Deep Research 과정에서
Planner와 Reviewer가 예상하지 못한
Search Demand가 발견될 수 있다.

이를 무시하거나 삭제하지 않는다.

별도의 Discovery 상태로 보존한다.

예:

NEW_DEMAND_DISCOVERY

가능한 경우 다음을 연결한다.

- Keyword
- Search Volume
- Search Entrance
- Related Evidence
- Trend
- Provenance
- Hub Relevance Status

Collector는 이를

NEW KNOWLEDGE NODE

라고 선언하지 않는다.

Network Planner에게
새로운 Search Demand Evidence로 전달한다.

---

# 27. TREND ANALYSIS

Trend Evidence가 존재하는 경우
Search Demand의 시간적 특성을 이해하는
보조 Evidence로 사용한다.

가능한 관찰:

- 지속 수요 가능성
- 최근 증가
- 최근 감소
- 일시적 Issue 가능성
- 계절성 가능성

Trend Evidence만으로

EVERGREEN NODE

를 확정해서는 안 된다.

Trend Evidence가 없다면
추정하지 않는다.

status:

NOT_COLLECTED
또는
NOT_AVAILABLE

등 기존 Contract에 맞는 상태를 사용한다.

---

# 28. PARTIAL FAILURE

일부 Source 수집이 실패해도
전체 Research를 자동 폐기하지 않는다.

예:

Search Ads SUCCESS
WEB SUCCESS
Trend FAILED

이 경우 가능한 Evidence는 보존한다.

Collection / Research 상태는
기존 Partial Failure Contract를 따른다.

실패한 Source를

0
SUCCESS
DEFAULT VALUE

등으로 대체하지 않는다.

---

# 29. HUMAN REVIEW

Human Review는
Evidence와 분리된 Judgment Layer다.

Reviewer 또는 사용자의 판단으로

RAW
Canonical Evidence
Derived Metric

을 변경해서는 안 된다.

Human Review는
별도의 Versioned Artifact로 보존한다.

기존 Review Selection 구조를 유지한다.

---

# 30. EVIDENCE COMPRESSION

Collector 내부 Evidence는
가능한 범위에서 풍부하게 보존한다.

예:

509 Canonical Keywords
1,528 Evidence
509 Metrics
RAW
Snapshot
Pack
Review
Gate Decision
Deep Research Result
Cluster

Final Planner Handoff에서는
이 모든 데이터를 그대로 나열하지 않는다.

Planner 판단에 필요한 구조로 압축한다.

---

## 30.1 Compression Rules

Compression은 다음을 해서는 안 된다.

- RAW 삭제
- Canonical Evidence 삭제
- Metric 삭제
- 낮은 Search Volume Evidence 은폐
- Reviewer Direction 삭제
- Missing Evidence 은폐
- Failed Source 은폐

Compression은

Planner용 Projection

이다.

---

## 30.2 Compression Lineage

압축된 주요 Item에는
가능한 범위에서 다음을 연결한다.

- compressed_item_id
- source_keyword_ids
- source_evidence_ids
- source_metric_ids
- source_cluster_ids
- source_review_reference
- raw_references
- evidence_status

Planner가 필요할 경우
압축 결과에서 원본 Evidence까지
역추적할 수 있어야 한다.

---

# 31. FINAL PLANNER HANDOFF

Collector의 최종 운영 산출물은
Network Planner가 사용할

Final Planner Handoff

이다.

내부 Artifact는 여러 개 존재할 수 있다.

예:

RAW
Snapshot
Pack
Review
Gate Decision
Deep Research Result
Cluster
Compression Artifact
Error Registry

그러나 Planner에게 전달하는
최종 운영 파일은 하나를 원칙으로 한다.

---

# 32. FINAL HANDOFF REQUIRED CONTENT

Final Planner Handoff는 최소한
다음 질문에 답할 수 있어야 한다.

1. 어떤 Hub를 조사했는가?
2. Hub Story와 Story Direction은 무엇인가?
3. Planner는 처음 어떤 Knowledge Hypothesis를 만들었는가?
4. Reviewer는 무엇을 조사하라고 했는가?
5. 어떤 Broad Search Demand가 발견되었는가?
6. Reviewer 지정 Research Seed의 실제 Evidence는 어떠했는가?
7. Demand Gate에서 어떤 Candidate가 Deep Research 대상으로 분류되었는가?
8. Gate 예외 통과가 있었다면 이유는 무엇인가?
9. 어떤 Candidate가 Hub Relevance에서 제외 또는 보류되었는가?
10. 주요 Search Demand Cluster는 무엇인가?
11. 대표 Search Entrance는 무엇인가?
12. Grounded User Question은 무엇인가?
13. Search Volume Evidence는 무엇인가?
14. Trend Evidence는 무엇인가?
15. Search Result Evidence는 무엇인가?
16. Provider Competition Evidence는 무엇인가?
17. Planner Hypothesis를 지지하는 Evidence는 무엇인가?
18. Evidence가 약하거나 확인되지 않은 Hypothesis는 무엇인가?
19. Planner가 예상하지 못한 새로운 Search Demand가 발견되었는가?
20. Missing / Failed / Not Collected Evidence는 무엇인가?
21. 어떤 항목이 REVIEW_REQUIRED인가?
22. Network Planner가 최종적으로 판단해야 할 것은 무엇인가?
23. 주요 판단의 Source Provenance와 Lineage는 무엇인가?

---

# 33. FINAL PLANNER RESPONSIBILITY

Final Planner Handoff를 받은
GEO Network Planner가 최종적으로 판단한다.

예:

- Node 유지
- Node 통합
- Node 분리
- Node 추가
- Node 제외
- Hub 구조
- Learning Flow
- Knowledge Relationship
- Internal Link
- Final Knowledge Architecture

Collector는 이 결정을 대신하지 않는다.

---

# 34. COLLECTOR ALLOWED DECISIONS

Collector가 수행할 수 있는 것:

- Search Evidence 수집
- RAW 저장
- Normalization
- Validation
- 허용된 Derived Metric 계산
- Search Demand 발견
- Basic Demand Collection
- Demand Gate
- Research Resource Allocation
- Hub Relevance 검토
- Deep Research Target 생성
- Deep Research
- Search Entrance 구조화
- Grounded Question 연결
- Search Demand Cluster 생성
- Planner Hypothesis와 Evidence 연결
- New Demand Discovery 표시
- Trend Evidence 정리
- Missing Evidence 표시
- REVIEW_REQUIRED 표시
- Evidence Compression
- Final Planner Handoff 생성

---

# 35. COLLECTOR PROHIBITED DECISIONS

Collector가 수행해서는 안 되는 것:

- 최종 Knowledge Node 확정
- Node 삭제 확정
- Hub Architecture 확정
- Learning Flow 확정
- 최종 Knowledge Relationship 확정
- 최종 Internal Link 확정
- Keyword Ranking
- Best Keyword 선정
- SEO Score 생성
- GEO Score 생성
- 임의 Priority Score 생성
- 근거 없는 Search Intent 확정
- 근거 없는 User Question 생성
- Search Volume이 낮다는 이유만으로 Knowledge 삭제
- Provider Competition을 Competition Ratio로 사용
- Competition Ratio 임의 계산
- Failed Evidence를 0 또는 Success로 대체
- Reviewer Direction을 실제 Search Evidence로 오인
- Planner Hypothesis를 확정 Knowledge로 오인

---

# 36. STATUS PRINCIPLE

상태는 실제 Evidence 상태를 표현해야 한다.

필요한 경우 기존 Schema와 정합성을 검토하여
다음과 같은 의미를 사용할 수 있다.

- SUCCESS
- FAILED
- PARTIAL_SUCCESS
- EXACT
- NOT_CALCULABLE
- NOT_AVAILABLE
- NOT_COLLECTED
- NOT_CONFIGURED
- NOT_CONFIRMED
- REVIEW_REQUIRED
- EVIDENCE_SUPPORTED
- EVIDENCE_WEAK
- NEW_DEMAND_DISCOVERY

새 Status를 코드에 추가하기 전에는
기존 04_SEARCH_EVIDENCE_SCHEMA.md와
충돌 여부를 Audit한다.

문서에 등장했다는 이유만으로
자동 구현하지 않는다.

---

# 37. CONFIGURATION PRINCIPLE

운영상 변경 가능한 기준은
지식적 사실과 분리한다.

초기 예:

DEEP_RESEARCH_DEMAND_THRESHOLD

default:

1000

classification:

OPERATIONAL_THRESHOLD

property:

configurable

운영 Threshold는
Evidence 또는 Knowledge의 진위를 결정하지 않는다.

Threshold 변경으로
기존 RAW Evidence가 변경되어서는 안 된다.

---

# 38. LEGACY / EXISTING IMPLEMENTATION PROTECTION

본 Algorithm을 구현하기 위해
현재 Collector를 재구축하지 않는다.

기존의 다음 구조는 우선 보존한다.

- Collection
- Collection ID
- Source Run
- RAW Repository
- Canonical Keyword
- Canonical Evidence
- Derived Metric
- Snapshot
- Search Evidence Pack
- Review Selection
- Versioned Review
- GEO Handoff Adapter
- Partial Failure
- Error Registry
- Source Provenance

새 Research Layer는
기존 Evidence Infrastructure 위에 추가하는 것을 기본 원칙으로 한다.

---

# 39. CURRENT COLLECTION COMPATIBILITY

기존 Collector의

seedKeyword

는 실제 Search Provider에 전달되는
Search Seed 역할을 수행해 왔다.

새로운

Hub Seed

와 동일한 개념으로 간주해서는 안 된다.

예:

Hub Seed:

원·달러 환율과 달러 가치의 변동 구조

실제 Search Seed:

환율
원달러 환율
달러 환율

향후 구현에서는
Hub Seed와 Search Seed의 역할을 명확히 분리한다.

기존 seedKeyword Contract를
Audit 없이 제거하거나 변경하지 않는다.

---

# 40. IMPLEMENTATION SAFETY RULE

본 문서는 Research Algorithm의 SoT Candidate다.

구현 전 반드시 다음을 수행한다.

1. 기존 00~07 문서를 읽는다.
2. 현재 Source Code를 읽는다.
3. 현재 Data Artifact 구조를 확인한다.
4. 본 문서와 기존 SoT의 충돌 여부를 Audit한다.
5. 본 문서와 현재 구현의 충돌 여부를 Audit한다.
6. 필요한 변경 범위를 보고한다.
7. 충돌사항을 임의 수정하지 않는다.
8. 사용자 승인 후 SoT를 조정한다.
9. 승인된 범위만 구현한다.

---

# 41. IMPLEMENTATION ORDER

본 Algorithm의 구현은 한 번에 수행하지 않는다.

기본 구현 순서는 다음과 같다.

Phase 1
Sequential Research Input

Hub Context
→ Planner Hypothesis
→ Reviewer Research Direction

Phase 2
Research Context / Research Seed

Phase 3
Broad Discovery + Directed Research

Phase 4
Basic Demand Collection + Demand Gate

Phase 5
Intent / Hub Relevance Gate

Phase 6
Deep Research Target + Deep Research

Phase 7
Search Entrance + Grounded Question

Phase 8
Search Demand Cluster

Phase 9
Planner Hypothesis Verification + New Demand Discovery

Phase 10
Evidence Compression

Phase 11
Final Planner Handoff

각 Phase는
기존 Evidence Infrastructure와의 정합성을 확인한 후 진행한다.

---

# 42. FINAL EXECUTION FLOW

HUB CONTEXT
↓
PLANNER HYPOTHESIS
↓
REVIEWER RESEARCH DIRECTION
↓
RESEARCH CONTEXT
↓
RESEARCH SEED GENERATION
↓
BROAD DISCOVERY + DIRECTED RESEARCH
↓
BASIC DEMAND COLLECTION
↓
DEMAND GATE
↓
INTENT / HUB RELEVANCE GATE
↓
DEEP RESEARCH TARGET
↓
DEEP RESEARCH
↓
SEARCH ENTRANCE ANALYSIS
↓
GROUNDED QUESTION LINKING
↓
SEARCH DEMAND CLUSTER
↓
PLANNER HYPOTHESIS VERIFICATION
↓
NEW DEMAND DISCOVERY
↓
EVIDENCE COMPRESSION
↓
FINAL PLANNER HANDOFF
↓
NETWORK PLANNER FINAL JUDGMENT

---

# 43. CORE RULE

방향은 Planner와 Reviewer에게 받는다.

판단 근거는 실제 Search Evidence에서 찾는다.

많이 발견하는 것과
깊게 조사하는 것을 구분한다.

발견됨은
Deep Research 대상을 의미하지 않는다.

Deep Research 대상은
Knowledge Node를 의미하지 않는다.

Gate는 Evidence를 삭제하지 않는다.

Cluster는 Node가 아니다.

Planner Hypothesis는
Final Architecture가 아니다.

Compression은 삭제가 아니다.

Collector는 많이 조사하되 많이 말하지 않는다.

내부 Evidence는 최대한 풍부하게 보존한다.

최종 Handoff는
Network Planner가 최종 Knowledge Architecture를
판단하는 데 필요한 Evidence로 압축한다.

Collector는 최종 Knowledge Architecture를 결정하지 않는다.