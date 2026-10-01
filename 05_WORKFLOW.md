# GEO SEARCH EVIDENCE COLLECTOR
## WORKFLOW

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: End-to-End Collection Workflow

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`가 하나의 Hub Seed Keyword를 입력받아 최종 `SEARCH EVIDENCE PACK`을 생성하기까지의 End-to-End Workflow를 정의한다.

본 문서는 다음 질문에 답한다.

> 사용자가 Keyword를 입력한 다음 시스템은 무엇을 어떤 순서로 실행하는가?

상위 문서의 역할은 다음과 같다.

`00_PROJECT_CONSTITUTION.md`
→ 프로젝트의 원칙

`01_PROJECT_BRIEF.md`
→ 프로젝트의 목적과 범위

`03_DATA_SOURCE_STANDARD.md`
→ 어떤 Source에서 Evidence를 수집하는가

`04_SEARCH_EVIDENCE_SCHEMA.md`
→ 수집된 Evidence를 어떤 구조로 저장하는가

본 문서는 위 기준을 실제 실행 순서로 연결한다.

---

# 2. Workflow 최상위 원칙

전체 Workflow는 다음 원칙을 따른다.

1. Seed를 먼저 확정한다.
2. Collection Job을 생성한다.
3. Source 상태를 확인한다.
4. Keyword Discovery를 수행한다.
5. Search Demand Evidence를 수집한다.
6. 필요한 Competition Evidence를 수집한다.
7. Search Entrance와 Trend는 활성 Phase에 따라 수집한다.
8. RAW Evidence를 먼저 보존한다.
9. RAW 이후 Normalization을 수행한다.
10. Validation 이후 Derived Metric을 계산한다.
11. 일부 Source 실패 때문에 전체 결과를 폐기하지 않는다.
12. 사람이 결과를 검토할 수 있게 한다.
13. 검토 가능한 Evidence를 기반으로 Export한다.
14. Historical/MVP 경로에서는 Strategy Converter에 전달할 수 있다.
15. Current Target Architecture에서는 Final Planner Handoff를 통해 Network
    Planner 최종 판단으로 전달한다.
16. Collector는 최종 Knowledge Architecture 판단을 수행하지 않는다.

---

# 3. Existing Evidence Pipeline — Historical / MVP

전체 Workflow는 다음과 같다.

Hub Seed Keyword 입력

→ Input Validation

→ Collection Job 생성

→ Source Preflight

→ Seed Collection

→ Keyword Discovery

→ Keyword Normalization

→ Keyword Deduplication

→ Search Demand Collection

→ Competition Evidence Collection

→ Search Entrance Collection

→ Search Trend Collection

→ RAW Evidence 저장

→ Evidence Normalization

→ Schema Validation

→ Derived Metric Calculation

→ Evidence Aggregation

→ Collection Status 결정

→ Snapshot 저장

→ Result Review

→ SEARCH EVIDENCE PACK 생성

→ Export

→ Legacy / Intermediate Handoff 또는 Strategy Converter Handoff

각 Phase는 독립적으로 상태를 기록한다.

---

## 3.1 Current Target Research Workflow

현재 Target Architecture의 Research Workflow는 다음 순서로 정렬한다.

HUB CONTEXT
→ PLANNER HYPOTHESIS
→ REVIEWER RESEARCH DIRECTION
→ RESEARCH CONTEXT
→ RESEARCH SEED GENERATION
→ BROAD DISCOVERY + DIRECTED RESEARCH
→ BASIC DEMAND COLLECTION
→ DEMAND GATE
→ INTENT / HUB RELEVANCE GATE
→ DEEP RESEARCH TARGET
→ DEEP RESEARCH
→ SEARCH ENTRANCE ANALYSIS
→ GROUNDED QUESTION LINKING
→ SEARCH DEMAND CLUSTER
→ PLANNER HYPOTHESIS VERIFICATION
→ NEW DEMAND DISCOVERY
→ EVIDENCE COMPRESSION
→ FINAL PLANNER HANDOFF
→ NETWORK PLANNER FINAL JUDGMENT

Research Direction은 Research 실행 전에 제공되는 조사 방향이다.
Human Review Selection은 Collection과 Pack 이후 Candidate에 대해 수행하는
SELECTED / EXCLUDED / UNDECIDED 판단이며 서로 다른 개념이다.

Demand Gate와 Intent / Hub Relevance Gate는 Evidence 삭제 필터가 아니라
Research Resource Allocation Layer다. Gate에서 탈락한 Candidate도 RAW,
Canonical Evidence, Snapshot에서 삭제하지 않는다.

---

# 4. STEP 0 — 실행 준비

조사를 실행하기 전에 시스템은 최소한 다음을 확인한다.

- Application이 정상적으로 실행 가능한가
- 필요한 Configuration이 존재하는가
- 활성화된 Collector가 무엇인가
- 필요한 API Credential이 존재하는가
- 저장 위치에 접근 가능한가
- Schema Version을 확인할 수 있는가

이 단계에서는 외부 Search Evidence를 아직 수집하지 않는다.

---

# 5. STEP 1 — Hub Seed Keyword 입력

사용자는 하나의 Hub Seed Keyword를 입력한다.

예:

달러

또는:

엔화

환율

로보어드바이저

ETF

MVP에서는 기본적으로 하나의 Collection Job에 하나의 Seed를 사용한다.

여러 Seed를 동시에 입력하는 Batch 기능은 후속 단계에서 추가할 수 있다.

---

# 6. STEP 2 — Input Validation

입력된 Seed를 검증한다.

최소 Validation:

- 값이 비어 있지 않은가
- 지나치게 긴 입력이 아닌가
- 시스템이 처리 가능한 문자열인가
- 앞뒤 불필요한 공백을 제거할 수 있는가

입력값은 두 형태로 유지한다.

- raw_seed
- normalized_seed

사용자가 입력한 원문은 보존한다.

---

# 7. Seed Normalization

Seed Normalization은 최소한으로 수행한다.

허용:

- 앞뒤 공백 제거
- 연속 공백 정리
- Unicode 정규화

금지:

- AI를 이용한 의미 변경
- 유사 Keyword로 자동 교체
- 맞춤법을 임의로 수정
- 단어 추가
- 단어 삭제
- Search Intent 추론에 따른 재작성

Collector는 사용자가 입력한 Seed를 존중한다.

---

# 8. STEP 3 — Collection Job 생성

Input Validation이 성공하면 새로운 Collection Job을 생성한다.

기본 정보:

- collection_id
- raw_seed
- normalized_seed
- started_at
- schema_version
- enabled_collectors
- status

초기 상태:

`PENDING`

실제 Collection이 시작되면:

`RUNNING`

으로 변경한다.

---

# 9. Collection ID

각 실행은 독립적인 Collection ID를 가진다.

같은 Seed를 다시 조사해도 새로운 Collection을 생성한다.

예:

달러  
2026-09-28

달러  
2026-10-28

두 결과를 동일 Record로 덮어쓰지 않는다.

---

# 10. STEP 4 — Source Preflight

실제 수집 전에 활성 Source 상태를 확인한다.

확인 대상:

- Source Enabled 여부
- Credential 존재 여부
- Configuration 존재 여부
- Provider 상태
- Collector Version
- 필요한 Endpoint 설정
- Optional Collector 여부

가능한 결과:

- READY
- DISABLED
- CONFIG_ERROR
- AUTH_UNAVAILABLE
- EXPERIMENTAL

Preflight 실패 Source 때문에 다른 Source까지 중단하지 않는다.

---

# 11. Collector 분류

Collector는 실행 중요도에 따라 구분할 수 있다.

## CORE

MVP의 핵심 수집에 필요한 Collector.

예:

- Search Demand Collector

## OPTIONAL

없어도 Collection을 완료할 수 있는 Collector.

예:

- Autocomplete
- Related Search
- Trend
- SERP Observation

## EXPERIMENTAL

아직 안정성이 충분히 검증되지 않은 Collector.

Experimental Collector 실패는 Core Job 실패로 취급하지 않는다.

---

# 12. STEP 5 — Seed 자체 Evidence 수집

Seed 자체도 Keyword Entity로 등록한다.

예:

Seed:

달러

Keyword Entity:

달러

이후 Seed에 대한 Search Demand Evidence를 수집할 수 있다.

Seed는 Related Keyword 목록에서 다시 발견되지 않더라도 조사 대상에서 제외하지 않는다.

---

# 13. STEP 6 — Keyword Discovery

활성화된 Discovery Source를 이용해 Seed와 관련된 Keyword를 수집한다.

MVP Primary:

Search Ads Related Keyword

Phase 2 이후:

- Autocomplete
- Related Search
- Co-searched Keyword
- 기타 Search Entrance

수집된 Keyword마다 Discovery Source를 기록한다.

---

# 14. Discovery Evidence

Keyword가 발견되면 다음 관계를 저장한다.

Seed

→ Discovery Source

→ Discovered Keyword

예:

달러

→ Search Ads Related

→ 달러 환율

또는:

달러

→ Autocomplete

→ 달러 환율

동일 Keyword가 여러 Source에서 발견되더라도 각 Discovery Evidence를 보존한다.

---

# 15. STEP 7 — Keyword Normalization

발견된 Keyword를 공통 Normalization Rule로 처리한다.

예:

Raw:

` 달러 환율 `

Normalized:

`달러 환율`

Normalization은 비교와 Deduplication을 위한 것이다.

검색어 의미를 변경하지 않는다.

---

# 16. STEP 8 — Keyword Deduplication

동일한 Normalized Keyword가 여러 Source에서 발견된 경우 하나의 Keyword Entity로 통합한다.

그러나 Source Evidence는 합쳐서 삭제하지 않는다.

예:

Keyword Entity:

달러 환율

Discovery Evidence:

- Search Ads Related
- Autocomplete
- Related Search

즉:

Keyword는 Merge한다.

Evidence는 보존한다.

---

# 17. Keyword Candidate Set

Discovery가 완료되면 해당 Collection에서 조사할 Keyword Candidate Set을 생성한다.

예:

Seed:

달러

Candidate Set:

- 달러
- 달러 환율
- 원달러 환율
- 달러 강세
- 달러 인덱스
- 달러 환전
- 달러 투자

이 단계에서는 Keyword의 가치나 Knowledge Node 여부를 판단하지 않는다.

---

# 18. Candidate 수 제한

외부 Source가 매우 많은 Related Keyword를 반환할 수 있다.

필요하면 Collection Option으로 최대 Keyword 수를 제한할 수 있다.

예:

max_keywords

그러나 제한이 적용된 경우 반드시 기록한다.

예:

returned_keywords: 500  
processed_keywords: 100  
limit_applied: true

사용자가 전체 데이터가 수집됐다고 오해하지 않도록 한다.

---

# 19. STEP 9 — Search Demand Collection

Keyword Candidate Set 각각에 대해 Search Demand Evidence를 수집한다.

핵심 Evidence:

- Monthly PC Search Volume
- Monthly Mobile Search Volume

가능한 경우 Provider가 제공하는 기타 공식 Keyword Metric도 RAW로 보존한다.

---

# 20. Search Demand Collection 순서

기본 흐름:

Keyword Candidate Set

→ Batch 가능 여부 확인

→ Provider Request

→ RAW Response 저장

→ Response Parsing

→ Keyword Mapping

→ Evidence 생성

Batch API가 가능하면 불필요한 개별 호출을 줄인다.

단, Batch 최적화 때문에 Source Provenance를 잃어서는 안 된다.

---

# 21. RAW First

외부 Source Response를 받으면 Normalization보다 RAW 보존을 우선한다.

순서:

External Response

→ RAW Save

→ Parse

→ Normalize

→ Validate

→ Derived Calculation

Parsing 또는 Normalization이 실패하더라도 RAW Response가 남아 있어야 한다.

---

# 22. Search Volume Mapping

각 Keyword에 다음 Evidence를 연결한다.

- MONTHLY_SEARCH_VOLUME_PC
- MONTHLY_SEARCH_VOLUME_MOBILE

Source가 값을 제공하지 않은 경우:

0으로 변환하지 않는다.

적절한 Status를 기록한다.

예:

NOT_PROVIDED  
NO_RESULT  
COLLECTION_FAILED

---

# 23. STEP 10 — Competition Evidence Collection

Search Demand 수집 이후 필요한 경우 Competition 관련 Evidence를 수집한다.

예:

- Search Result Total
- Provider Competition Value

Search Result Total을 수집하는 경우 Search Vertical을 반드시 기록한다.

Canonical 기본 수집 계약은 2026-09-29부터 적용하는 `NEW_POLICY`에 따라
다음과 같다.

- Provider: `NAVER`
- Product: `NAVER API HUB Web Document Search`
- Search Vertical: `WEB`
- Endpoint: `/search/v1/webkr`
- Response Field: `total`

다른 Vertical은 Canonical Document Count에 합산하지 않고 별도 Evidence로
보존한다.

기타 지원 Vertical 예:

BLOG  
NEWS  
CAFE  
WEB

---

# 24. Search Result Collection

기본 흐름:

Keyword

→ Search Source Request

→ RAW Response

→ Search Vertical 확인

→ Result Total 추출

→ Evidence 저장

Result Total을 `총문서수`라는 모호한 값으로만 저장하지 않는다.

---

# 25. Competition Evidence와 해석 분리

Collector가 수행하는 것:

- Result Count 수집
- Provider Competition 값 수집
- 필요한 Derived Ratio 계산

Collector가 수행하지 않는 것:

- 이 Keyword는 쉽다
- 이 Keyword는 어렵다
- 이 Keyword를 공략해야 한다
- 이 Keyword를 버려야 한다

이 판단은 후속 Strategy Layer에서 수행한다.

---

# 26. STEP 11 — Search Entrance Collection

Phase 2 이후 Search Entrance Collector가 활성화된 경우 실행한다.

수집 후보:

- Autocomplete
- Related Search
- Co-searched Keyword

각 Source는 독립 Collector로 실행한다.

---

# 27. Search Entrance 실행 원칙

Search Entrance는 다음 조건을 기록한다.

- Parent Keyword
- Suggested/Related Keyword
- Position
- Provider
- Source
- Collection Method
- Collected At

Search Entrance는 검색량과 동일한 Evidence가 아니다.

---

# 28. Search Entrance 확장 Keyword

Search Entrance에서 새로운 Keyword가 추가로 발견될 수 있다.

예:

Seed:

달러

Search Ads Discovery:

달러 환율

Autocomplete에서 추가 발견:

달러 환전 수수료

이 Keyword를 Candidate Set에 추가할 수 있다.

그러나 무제한 재귀 확장을 기본값으로 사용하지 않는다.

---

# 29. Discovery Depth

Keyword Discovery에는 Depth 개념을 둘 수 있다.

예:

Depth 0:

Seed

Depth 1:

Seed에서 직접 발견된 Keyword

Depth 2:

Depth 1 Keyword에서 추가 발견된 Keyword

MVP 기본값은 Depth 1을 우선한다.

무제한 Recursive Discovery를 금지한다.

---

# 30. Recursive Expansion 제한

자동완성 → 관련검색어 → 자동완성 → 관련검색어 방식으로 계속 확장하면 Keyword 수가 폭발할 수 있다.

따라서 다음 제한을 둘 수 있다.

- max_depth
- max_keywords
- max_requests
- enabled_discovery_sources

제한값은 Collection Metadata에 기록한다.

---

# 31. STEP 12 — Search Trend Collection

Phase 3 이후 Trend Collector가 활성화된 경우 실행한다.

수집 대상은 모든 Keyword가 아닐 수 있다.

예:

- Seed
- 주요 Search Demand Keyword
- 사용자가 선택한 Keyword

Trend API 비용과 호출량을 고려해 별도 Collection Option으로 운영할 수 있다.

---

# 32. Trend Request

Trend 요청에는 가능한 경우 다음 조건을 기록한다.

- Keyword 또는 Keyword Group
- Period Start
- Period End
- Time Unit
- Device
- Gender
- Age

Source가 제공하지 않는 Dimension을 임의 생성하지 않는다.

---

# 33. Trend Response

Trend Response는 다음 순서로 처리한다.

RAW Response

→ RAW Save

→ Parse

→ Trend Evidence

→ Validation

Trend Ratio를 Search Volume으로 변환하지 않는다.

---

# 34. STEP 13 — Normalization

각 Source의 RAW Data를 GEO 공통 Schema로 변환한다.

예:

Provider Field A

→ monthly_search_pc

Provider Field B

→ monthly_search_mobile

Normalization은 형식 변환이다.

새로운 사실을 생성하는 과정이 아니다.

---

# 35. Normalization 순서

기본 순서:

RAW Response 확인

→ Source Adapter

→ Provider-specific Parsing

→ Common Field Mapping

→ Type Conversion

→ Normalized Evidence 생성

→ Validation

---

# 36. STEP 14 — Validation

Normalized Evidence는 저장 또는 Derived Calculation 전에 Validation한다.

검증 예:

- Keyword가 존재하는가
- Source ID가 존재하는가
- Collected At이 존재하는가
- Search Volume이 음수가 아닌가
- Search Result Total에 Vertical이 있는가
- Trend가 올바른 Evidence Type인가
- Numeric Field가 실제 Numeric인가

---

# 37. Validation Failure

Validation이 실패하면:

RAW Evidence는 보존한다.

Normalized Evidence는 정상값으로 강제 변환하지 않는다.

Status:

VALIDATION_FAILED

Error Record:

생성

다른 Keyword 처리는 계속한다.

---

# 38. STEP 15 — Derived Metric Calculation

Validation이 성공한 Evidence를 이용해 Derived Metric을 계산한다.

MVP 핵심:

- Total Search Volume
- Competition Ratio

향후:

- Mobile Share
- Search Demand Change
- Historical Change
- 기타 검증된 Metric

---

# 39. Total Search Volume Workflow

기본 Formula Version:

`total_search_volume_v1`

PC Search Volume과 Mobile Search Volume이 모두 유효한 정확한 Numeric이면:

```text
Total = PC + Mobile
Status = EXACT
```

계산 결과에는 다음을 연결한다.

- PC Search Volume Evidence ID
- Mobile Search Volume Evidence ID
- `formula`
- `formula_version`
- `calculated_at`
- `status`

PC 또는 Mobile 중 하나라도 Provider 원본 값 `<10` 또는 `< 10`이면:

```text
Total = null
Status = NOT_CALCULABLE
```

이 경우 `<10`을 0, 5, 9, 10 또는 임의 대표값으로 변환하지 않는다.
정확한 Total과 BOUNDED 결과를 생성하지 않으며, RAW와 NORMALIZED
Evidence의 원문을 보존한다.

Missing 또는 null은 기존 `NOT_AVAILABLE` 규칙을 따른다.
Invalid는 Validation 실패로 처리하며 정상 Numeric으로 변환하지 않는다.
Missing, null, invalid와 `<10`은 서로 다른 상태로 취급한다.

어느 경우에도 Missing, null, invalid, `<10`을 0으로 대체하지 않는다.

---

# 40. Competition Ratio Workflow

기본 조건:

Search Result Total이 유효하다.

AND

Total Search Volume이 유효하다.

AND

Total Search Volume > 0

이면 지정된 Formula Version으로 계산한다.

계산 결과에는 다음을 연결한다.

- numerator evidence
- denominator evidence
- formula
- formula_version
- calculated_at

---

# 41. Derived Metric 실패

계산에 필요한 값이 부족하면 0을 반환하지 않는다.

예:

competition_ratio:

value: null  
status: NOT_AVAILABLE

metadata:

missing_input: monthly_search_volume_total

---

# 42. STEP 16 — Evidence Aggregation

Keyword별로 여러 Evidence를 묶어 검토 가능한 구조를 만든다.

예:

달러 환율

Search Demand:
- PC
- Mobile
- Total

Competition:
- Search Result Total
- Provider Competition
- Competition Ratio

Search Entrance:
- Autocomplete
- Related Search

Trend:
- Trend Data

Source:
- Source IDs

Status:
- Evidence Status

---

# 43. Aggregation과 원본 보존

Aggregation은 View를 만들기 위한 과정이다.

원본 Evidence Record를 하나의 Row로 합쳐 삭제하지 않는다.

Canonical Data:

여러 Evidence Record

UI:

Keyword 한 줄

이 구조를 유지한다.

---

# 44. STEP 17 — Collector Status 결정

각 Collector 실행 결과를 확정한다.

가능한 상태:

SUCCESS  
PARTIAL_SUCCESS  
FAILED  
SKIPPED

예:

Search Ads: SUCCESS  
Search Result: SUCCESS  
Autocomplete: FAILED  
Related Search: SKIPPED  
Trend: SUCCESS

---

# 45. STEP 18 — Collection Job Status 결정

전체 Job Status는 Collector 결과를 기반으로 결정한다.

## SUCCESS

필수 Core Collector가 정상적으로 완료되고 요청된 핵심 Evidence가 확보됨.

## PARTIAL_SUCCESS

핵심 결과는 존재하지만 일부 Source 또는 Keyword에서 실패가 발생함.

## FAILED

핵심 Collection을 수행하지 못해 유효한 Search Evidence Pack을 만들 수 없음.

Optional Collector 실패만으로 FAILED 처리하지 않는다.

---

# 46. STEP 19 — Snapshot 저장

Collection이 종료되면 해당 시점의 Snapshot을 보존한다.

저장 대상:

- Collection Metadata
- Seed
- Keyword Set
- Evidence
- Derived Metrics
- Source Status
- Errors
- Collection Options

Derived Metrics는 RAW 파일이나 Export 결과가 아니라 Collection Snapshot의
`derived_metrics`에 저장한다. Local First MVP의 파일 위치와 Record 계약은
`04_SEARCH_EVIDENCE_SCHEMA.md`의 Derived Metric Repository Contract를 따른다.

동일 Seed의 기존 Snapshot을 덮어쓰지 않는다.

---

# 47. Snapshot 저장 시점

기본적으로 Collection Job 종료 시 Snapshot을 확정한다.

PARTIAL_SUCCESS도 Snapshot으로 저장한다.

FAILED Job 역시 문제 추적을 위해 Metadata와 Error를 보존할 수 있다.

실패 기록도 운영 Evidence다.

---

# 48. STEP 20 — Result View 생성

저장된 Canonical Data를 이용해 사용자 검토용 View를 생성한다.

대표 Table:

| Keyword | PC | Mobile | Total | Documents | Ratio | Autocomplete | Related | Status |
|---|---:|---:|---:|---:|---:|---|---|---|

이 Table은 Projection이다.

Canonical Storage 자체가 아니다.

---

# 49. Result View에서 반드시 보이는 정보

최소한 다음은 사용자가 확인할 수 있어야 한다.

- Seed
- Collection Date
- Keyword
- PC Search Volume
- Mobile Search Volume
- Total Search Volume
- Competition Evidence
- Source
- Status

Phase에 따라:

- Autocomplete
- Related Search
- Trend

를 추가한다.

---

# 50. Missing 표시

UI에서는 Missing을 빈칸으로만 보여주지 않는 것을 권장한다.

예:

N/A  
FAILED  
NOT PROVIDED

등 상태를 확인할 수 있어야 한다.

0과 구분한다.

---

# 51. Error Review

Collection에 오류가 존재하면 별도 Error Summary를 제공한다.

예:

Autocomplete Collector

FAILED

Reason:

SOURCE_CHANGED

Keyword:

달러

사용자가 일부 데이터가 없는 이유를 알 수 있어야 한다.

---

# 52. STEP 21 — Human Review

자동 수집 후 사람이 결과를 검토할 수 있어야 한다.

검토 목적:

- 이상한 Keyword 확인
- 비정상 검색량 확인
- Source 실패 확인
- Missing 확인
- Competition Data 확인
- Search Entrance 확인
- Export 전 데이터 상태 확인

Human Review는 Knowledge 판단 단계가 아니다.

Evidence 품질 확인 단계다.

---

# 53. Human Review에서 하지 않는 것

Collector UI에서 다음을 확정하지 않는다.

- 최종 Hub
- 최종 Node
- Article Title
- Search Intent
- Evergreen Knowledge
- Content Priority
- 투자 가치
- 사업 가치

이 판단은 Strategy Converter 및 후속 시스템의 역할이다.

---

# 54. Manual Correction 원칙

사용자가 수집값을 직접 수정해야 하는 상황이 발생할 수 있다.

원본 Evidence를 직접 덮어쓰지 않는다.

필요하면 별도 Correction 또는 Override Record를 생성한다.

예:

Original Evidence

+

User Correction

두 데이터를 모두 추적할 수 있어야 한다.

MVP에서 Correction 기능이 필요하지 않으면 구현을 미룬다.

---

# 55. STEP 22 — SEARCH EVIDENCE PACK 생성

검토 가능한 Collection에서 `SEARCH EVIDENCE PACK`을 생성한다.

Pack에는 최소 다음이 포함된다.

- Hub Seed
- Collection Metadata
- Keyword Data
- Search Demand
- Competition Evidence
- Search Entrance
- Trend
- Sources
- Derived Metrics
- Missing Data
- Errors

---

# 56. Evidence Pack 생성 원칙

Pack Builder는 Evidence를 새로 조사하지 않는다.

이미 Collection에 저장된 Evidence를 읽어 Handoff Format으로 변환한다.

Pack 생성 중 AI Search를 실행하지 않는다.

Pack Builder가 Search Intent를 판단하지 않는다.

Pack Builder가 Node를 결정하지 않는다.

---

# 57. STEP 23 — Export

지원 Export:

- Markdown
- JSON
- CSV
- XLSX

MVP에서는 우선순위를 둘 수 있다.

권장 초기 우선순위:

1. Markdown
2. JSON
3. CSV
4. XLSX

단, 기존 GEO Workflow에서 XLSX가 즉시 필요하다면 구현 순서를 조정할 수 있다.

---

# 58. Markdown Export Workflow

Canonical Evidence

→ Search Evidence Pack Builder

→ Markdown Formatter

→ `.md`

Markdown은 Strategy Converter와 사람이 모두 읽을 수 있도록 구성한다.

---

# 59. JSON Export Workflow

Canonical Evidence

→ JSON Serializer

→ Schema Validation

→ `.json`

JSON은 향후 자동 Pipeline의 핵심 교환 형식으로 사용한다.

---

# 60. CSV / XLSX Workflow

Canonical Evidence

→ Keyword Projection

→ Flat Table

→ CSV / XLSX

Flat Export 과정에서 Source 정보를 완전히 제거하지 않는다.

필요하면 별도 Source Column 또는 Sheet를 사용한다.

---

# 61. STEP 24 — Legacy / Historical Strategy Converter Handoff

기존 MVP와 호환을 위해 Evidence Pack을 Strategy Converter에 전달할 수 있다.
이 절은 Historical / Intermediate Handoff 경로를 정의하며, 08의 Current
Target Final Planner Handoff를 대체하지 않는다.

기본 흐름:

SEARCH EVIDENCE PACK

→ Strategy Converter

→ Search Demand Verification

→ Search Entrance Analysis

→ User Question

→ Evergreen Knowledge

→ Knowledge Candidate

Collector의 역할은 Handoff에서 종료된다.

---

# 62. Legacy / Intermediate Handoff 조건

최소한 다음이 있어야 정상 Handoff로 본다.

- Seed
- Collection Date
- Keyword 목록
- 핵심 Search Demand Evidence
- Source
- Status

Competition, Search Entrance, Trend는 Phase 및 Collection 설정에 따라 추가된다.

---

# 63. Handoff 실패

Search Demand Core 자체가 수집되지 않았다면 Strategy Converter 자동 Handoff를 중단할 수 있다.

예:

Search Ads Authentication Failure

→ Search Demand 없음

→ Collection FAILED

→ Evidence Pack은 오류 기록용으로 생성 가능

→ 정상 Strategy Analysis용 Pack으로 표시하지 않음

---

# 64. Workflow Phase 1 — MVP

MVP Workflow는 최대한 단순하게 유지한다.

Hub Seed 입력

→ Collection Job

→ Search Ads Keyword Discovery

→ Search Volume 수집

→ RAW 저장

→ Normalize

→ Total Search Volume 계산

→ 필요한 Competition Evidence 수집

→ Competition Ratio 계산

→ Snapshot 저장

→ Result Table

→ Markdown / JSON Export

이 흐름을 먼저 완성한다.

---

# 65. MVP 완료 기준

예를 들어 사용자가:

달러

를 입력하면 시스템이 최소 다음을 수행해야 한다.

1. Collection Job 생성
2. 달러 관련 Keyword 수집
3. PC 검색량 수집
4. Mobile 검색량 수집
5. Total 계산
6. 가능한 Competition Evidence 수집
7. Ratio 계산
8. Source 기록
9. Collection Date 기록
10. 오류 기록
11. 결과 Table 표시
12. Evidence Pack Export

이 흐름이 반복 가능해야 한다.

---

# 66. Workflow Phase 2 — Search Entrance

MVP 안정화 후 추가한다.

Seed

→ Autocomplete

→ Related Search

→ Co-searched Keyword

→ 기존 Keyword Set과 Merge

→ Search Entrance Evidence 저장

새로운 Search Entrance Keyword에 대해 Search Demand를 추가 수집할지는 Collection Option으로 제어한다.

---

# 67. Phase 2 확장 방식

Search Entrance에서 발견된 Keyword를 Search Demand Collector로 다시 보내는 경우:

New Keyword

→ Deduplication

→ Depth 확인

→ Keyword Limit 확인

→ Search Demand Collection

→ Evidence 저장

무제한 반복을 금지한다.

---

# 68. Workflow Phase 3 — Trend

Phase 3:

Existing Keyword Evidence

→ Trend Target Selection

→ Search Trend Collection

→ RAW Save

→ Normalize

→ Trend Evidence

→ Snapshot

Trend 수집은 Core Search Demand Collection과 분리한다.

---

# 69. Workflow Phase 4 — Historical Comparison

같은 Seed의 과거 Collection이 존재하면 비교할 수 있다.

Current Collection

+

Previous Collection

→ Comparison Engine

→ Search Demand Change

→ Keyword Added

→ Keyword Removed

→ Search Entrance Change

→ Competition Change

Comparison은 새로운 Derived Layer다.

과거 Snapshot을 수정하지 않는다.

---

# 70. Workflow Phase 5 — Provider Expansion

새 Provider를 추가할 경우 기존 Workflow를 복제하지 않는다.

새 Provider Collector

→ RAW

→ 기존 Normalization Contract

→ 기존 Evidence Schema

→ 기존 Aggregation

→ 기존 Export

Core Workflow를 유지한다.

---

# 71. Re-run Workflow

사용자는 같은 Seed를 다시 조사할 수 있다.

Re-run 시:

기존 Collection 불러오기

→ 수정

방식이 아니라:

새 Collection Job 생성

→ 새 Evidence 수집

→ 새 Snapshot 생성

방식을 사용한다.

---

# 72. Retry Workflow

일시적 오류가 발생한 Collector는 제한적으로 Retry할 수 있다.

예:

TIMEOUT  
NETWORK_ERROR  
일시적 RATE_LIMIT

기본 구조:

Collector Failure

→ Error Classification

→ Retryable 확인

→ Retry Limit 확인

→ Delay

→ Retry

→ Success 또는 Final Failure

무한 Retry를 금지한다.

---

# 73. Non-Retryable Error

다음 오류는 일반적으로 자동 반복 호출보다 확인이 우선이다.

- AUTH_ERROR
- CONFIG_ERROR
- SOURCE_CHANGED
- PARSE_ERROR
- VALIDATION_ERROR

실제 Retry 가능 여부는 Provider별 설정을 따른다.

---

# 74. Partial Success Workflow

예:

Search Ads: SUCCESS  
Search Result: SUCCESS  
Autocomplete: FAILED  
Trend: SUCCESS

처리:

성공 Evidence 보존

→ Autocomplete Error 기록

→ Collection Status PARTIAL_SUCCESS

→ Result View 생성

→ Evidence Pack 생성

→ Missing Source 표시

정상 데이터를 버리지 않는다.

---

# 75. Complete Failure Workflow

예:

핵심 Search Demand Source 인증 실패

처리:

Collection Job 생성

→ Error 저장

→ 가능한 Raw Error 저장

→ Status FAILED

→ Failure Summary

→ 정상 Search Demand Pack 생성 중단

오류를 검색량 0으로 표시하지 않는다.

---

# 76. No Result Workflow

API 호출은 성공했지만 해당 Keyword 데이터가 없을 수 있다.

이 경우:

Request: SUCCESS

Evidence:

status = NO_RESULT

System Error로 처리하지 않는다.

`COLLECTION_FAILED`와 구분한다.

---

# 77. Rate Limit Workflow

Rate Limit 발생 시:

Provider Response

→ RATE_LIMIT 분류

→ Retry 정책 확인

→ 가능한 경우 대기 후 Retry

→ 계속 실패하면 해당 Collector 종료

→ Error 기록

→ 다른 Collector 계속 실행

API 한도를 우회하기 위한 비정상적인 호출 방식을 사용하지 않는다.

---

# 78. Source Change Workflow

SERP 또는 API 구조 변경이 의심되는 경우:

Unexpected Response

→ Parse Failure

→ SOURCE_CHANGED 또는 PARSE_ERROR

→ RAW 보존

→ Collector 중단

→ 다른 Collector 계속 실행

→ Developer Review

→ Adapter 수정

→ Regression Test

→ Collector 재활성화

---

# 79. Legacy Source Workflow

Legacy Source가 필요한 경우 별도 Adapter로 실행한다.

Legacy Source

→ Legacy Adapter

→ Common Schema

Legacy와 Current Source의 Evidence를 구분한다.

과거 Source를 현재 Source처럼 표시하지 않는다.

---

# 80. Manual Import Workflow

기존 Excel Data를 가져오는 경우:

File Import

→ Column Mapping

→ Source Type USER_PROVIDED

→ Validation

→ Normalized Evidence

→ Import Snapshot

→ Result Review

기존 데이터를 공식 API 수집 데이터로 변환하지 않는다.

---

# 81. Manual Import Provenance

Import 시 가능한 경우 기록한다.

- Original Filename
- Imported At
- Original Columns
- Source Description
- Original Collection Date
- User Note

원본 출처를 모르면:

source_status = UNKNOWN

등으로 명시한다.

---

# 82. Historical Workflow

시간축이 쌓이면 다음 구조가 된다.

달러

→ Collection 1

→ Collection 2

→ Collection 3

각 Collection은 독립 Snapshot이다.

Historical Analysis는 Snapshot 사이를 비교한다.

---

# 83. Scheduling

초기 MVP에서는 자동 Schedule을 필수로 구현하지 않는다.

사용자가 필요할 때 직접 실행하는 On-demand Collection을 우선한다.

향후 Historical Data 필요성이 커지면:

- Weekly
- Monthly
- Custom

등의 Schedule을 추가할 수 있다.

---

# 84. 동일 데이터 재사용

같은 Job 내부에서 동일 Query를 반복 호출할 필요가 없는 경우 Temporary Cache를 사용할 수 있다.

그러나 다음을 구분한다.

Cache

vs

Historical Evidence

Cache는 성능 최적화다.

Snapshot은 Evidence 기록이다.

둘을 동일하게 취급하지 않는다.

---

# 85. Collection Options

향후 사용자는 Collection 범위를 선택할 수 있다.

예:

- Search Demand ON/OFF
- Competition ON/OFF
- Autocomplete ON/OFF
- Related Search ON/OFF
- Trend ON/OFF
- Max Keywords
- Discovery Depth
- Search Vertical
- Trend Period

MVP에서는 옵션을 최소화한다.

---

# 86. Default Workflow

초기 기본값은 복잡하지 않게 설정한다.

사용자:

Seed 입력

→ 실행

시스템:

필수 Collector 자동 선택

→ 수집

→ 결과

고급 설정은 필요한 경우에만 노출한다.

---

# 87. Workflow와 UI 관계

UI는 Workflow의 내부 복잡성을 그대로 보여줄 필요가 없다.

사용자는 기본적으로 다음만 이해하면 된다.

입력

→ 수집 중

→ 완료 또는 일부 실패

→ 결과 확인

→ Export

세부 Collector 상태는 필요할 때 확인할 수 있도록 한다.

---

# 88. Progress 표시

수집 시간이 길어질 경우 진행 상태를 표시할 수 있다.

예:

Keyword Discovery  
Search Demand  
Competition  
Search Entrance  
Trend  
Processing  
Complete

정확한 Percent를 계산할 수 없다면 가짜 진행률을 만들지 않는다.

단계 상태를 보여주는 방식을 사용할 수 있다.

---

# 89. Cancel Workflow

향후 수집 취소 기능을 제공할 수 있다.

취소 시 이미 수집된 RAW Evidence를 삭제하지 않는다.

Collection Status:

CANCELLED

상태 추가가 필요하면 Schema Version과 함께 정의한다.

MVP에서는 필수가 아니다.

---

# 90. Export 시점

Export는 Collection 완료 후 수행하는 것을 기본으로 한다.

PARTIAL_SUCCESS에서도 Export할 수 있다.

단, Export 안에 Missing과 Error를 포함한다.

FAILED Collection은 정상 분석용 Export와 구분한다.

---

# 91. Search Evidence Pack Version

Evidence Pack 자체에도 Version을 둘 수 있다.

예:

pack_version: 1.0

Schema Version과 Pack Version은 동일할 필요가 없다.

Schema는 내부 데이터 구조다.

Pack은 외부 Handoff Format이다.

---

# 92. GEO 전체 Workflow 연결

GEO PROJECT 전체에서 본 시스템의 위치는 다음과 같다.

Keyword / Issue Discovery

→ GEO Search Evidence Collector

→ Strategy Converter 1차

→ Search Data Verification

→ Strategy Converter 2차

→ Hub Planner

→ Research

→ Writer

Collector는 Search Evidence Layer를 담당한다.

---

# 93. Keyword Fighter 연결

Keyword Fighter를 사용하는 경우:

Keyword Fighter

→ Seed 후보

→ Search Evidence Collector

→ 실제 Search Evidence

→ Strategy Converter

Keyword Fighter의 추천값을 실제 Search Demand로 간주하지 않는다.

Collector에서 Evidence를 확인한다.

---

# 94. Planner 연결 금지

Search Evidence Collector에서 Hub Planner를 직접 실행하지 않는다.

이유:

Search Evidence

→ Strategy Interpretation

→ Knowledge Architecture

사이에 판단 단계가 존재하기 때문이다.

Collector가 Planner 역할까지 수행하면 Evidence와 판단이 섞인다.

---

# 95. Knowledge Research와 Evidence-based Research 경계

Search Evidence Collector는 최종 Knowledge Research 판단, Knowledge Node,
Hub Architecture, Learning Flow, Knowledge Relationship, Internal Link 또는
Article을 결정하지 않는다.

단, 08의 계약에 따라 Evidence-based Search Research, Search Demand Research,
Broad Discovery, Directed Research, Deep Research, Search Entrance Analysis,
Evidence Validation 및 Evidence Compression을 수행할 수 있다.

예:

`달러 예금`

이라는 검색어가 발견됐다고 해서 Collector가 달러예금 금리나 세법을 조사하지 않는다.

해당 지식의 최종 해석과 Knowledge Architecture 결정은 Network Planner 및
후속 Knowledge Layer가 담당한다. Collector는 실제 Search Evidence와 그
Provenance를 조사·검증·구조화하여 전달한다.

---

# 96. Writer 연결 금지

Collector는 Article을 작성하지 않는다.

검색량이 높은 Keyword를 발견했다고 해서 제목이나 본문을 자동 생성하지 않는다.

Search Evidence와 Content Production을 분리한다.

---

# 97. AI 사용 Workflow

향후 AI 기능이 추가될 경우 기본 흐름은 다음과 같다.

Verified Evidence

→ Optional AI Processor

→ AI_DERIVED Output

AI Output은 별도 Layer로 저장한다.

AI가 Evidence를 수정하지 않는다.

---

# 98. Audit Workflow

결과에 이상이 있을 경우 다음 순서로 추적할 수 있어야 한다.

UI Value

→ Aggregated Evidence

→ Normalized Evidence

→ RAW Evidence

→ Collector

→ Source

이를 통해 숫자의 출처를 역추적한다.

---

# 99. Workflow 변경 원칙

Workflow를 변경할 때 다음을 확인한다.

- Constitution을 위반하지 않는가
- Data Source Standard와 충돌하지 않는가
- Schema로 표현 가능한가
- RAW Evidence가 보존되는가
- Source Provenance가 유지되는가
- Strategy Converter Boundary를 침범하지 않는가
- 기존 Snapshot을 깨뜨리지 않는가

---

# 100. Workflow에서 금지하는 것

다음을 금지한다.

- Seed 입력 후 AI가 임의 Keyword를 만들어 Search Evidence처럼 저장
- RAW 저장 전에 데이터 변환
- API 실패값을 0으로 저장
- Missing 값을 임의 보간
- Source 없는 Search Volume 생성
- Trend Ratio를 검색량으로 변환
- Search Result Total의 Vertical 제거
- 동일 Keyword의 Source Evidence 삭제
- 무제한 Recursive Keyword Discovery
- Optional Collector 실패로 전체 Job 폐기
- 최신 Collection으로 과거 Snapshot 덮어쓰기
- Export 과정에서 새로운 사실 생성
- Collector에서 Search Intent 확정
- Collector에서 Knowledge Node 확정
- Collector에서 Article 작성
- AI 판단을 공식 Evidence로 덮어쓰기

---

# 101. End-to-End 검증 시나리오

Leo는 MVP 구현 후 최소 다음 시나리오를 실제로 검증한다.

Seed:

달러

실행:

1. Seed 입력
2. Collection Job 생성
3. Source Preflight
4. Related Keyword 수집
5. Keyword Normalization
6. Deduplication
7. PC Search Volume 수집
8. Mobile Search Volume 수집
9. RAW Response 저장
10. Normalization
11. Validation
12. Total Search Volume 계산
13. Competition Evidence 수집
14. Competition Ratio 계산
15. Collector Status 결정
16. Collection Status 결정
17. Snapshot 저장
18. Result Table 생성
19. SEARCH EVIDENCE PACK 생성
20. Markdown 또는 JSON Export

각 단계의 성공 여부를 확인한다.

---

# 102. Failure 검증 시나리오

정상 동작만 테스트하지 않는다.

최소 다음 상황을 검증한다.

- 잘못된 Credential
- API Timeout
- Rate Limit
- Empty Result
- 일부 Keyword Missing
- Parsing Failure
- Source Response 변경
- Search Volume 특수값
- PC 값만 존재
- Mobile 값만 존재
- Search Result Total 없음
- Optional Collector 실패

실패가 발생해도 RAW와 Error가 적절히 남는지 확인한다.

---

# 103. Partial Success 검증

예:

10개 Keyword 조사

8개 성공  
2개 실패

전체 결과를 폐기하지 않는다.

성공한 8개 Evidence를 저장한다.

실패한 2개는 Error 또는 Missing 상태로 기록한다.

Collection Status는 상황에 따라:

PARTIAL_SUCCESS

로 처리한다.

---

# 104. Reproducibility 검증

하나의 Collection 결과에서 다음을 다시 확인할 수 있어야 한다.

- 어떤 Seed였는가
- 언제 실행했는가
- 어떤 Source를 사용했는가
- 어떤 Collector Version이었는가
- 어떤 Keyword가 발견됐는가
- 어떤 RAW Response가 있었는가
- 어떤 Derived Formula를 사용했는가
- 어떤 오류가 있었는가

이 정보가 없으면 반복 가능한 Collection으로 보지 않는다.

---

# 105. Workflow 완료 정의

Search Evidence Collector의 Workflow는 다음 과정이 End-to-End로 반복 가능할 때 완성된 것으로 본다.

Hub Seed

→ Search Evidence Collection

→ RAW Preservation

→ Normalization

→ Validation

→ Derived Metrics

→ Snapshot

→ Human Review

→ SEARCH EVIDENCE PACK

→ Legacy / Intermediate Handoff 또는 Final Planner Handoff

이 과정에서 가장 중요한 것은 자동화 비율 자체가 아니다.

**수집된 Evidence를 신뢰하고 다시 검증할 수 있는가**가 핵심이다.

---

# 106. 최종 Workflow 원칙

본 프로젝트의 실행 순서는 다음 문장으로 요약한다.

**먼저 Seed를 받는다.**

**Source에서 Evidence를 수집한다.**

**원본을 먼저 보존한다.**

**그 다음 정규화한다.**

**검증된 값으로만 계산한다.**

**실패는 실패로 기록한다.**

**결과를 Snapshot으로 남긴다.**

**사람이 검토할 수 있게 보여준다.**

**Evidence Pack으로 만든다.**

**판단은 Strategy Converter로 넘긴다.**

최종 흐름:

SEED

→ DISCOVER

→ COLLECT

→ PRESERVE RAW

→ NORMALIZE

→ VALIDATE

→ DERIVE

→ AGGREGATE

→ SNAPSHOT

→ REVIEW

→ EXPORT

→ GEO HANDOFF

Search Evidence Collector는 판단 시스템이 아니다.

**반복 가능하고 검증 가능한 Search Evidence를 만드는 시스템이다.**

---

# FACT CHECK LIST

- 하나의 Collection Job은 하나의 조사 실행을 의미한다.
- 동일 Seed를 다시 조사할 경우 새로운 Collection과 Snapshot을 생성한다.
- Keyword는 통합할 수 있지만 서로 다른 Source Evidence는 보존한다.
- RAW Response는 Parsing과 Normalization보다 먼저 보존한다.
- PC 또는 Mobile 검색량이 Missing이면 Total을 임의 계산하지 않는다.
- Competition Ratio는 검증된 입력값이 있을 때만 계산한다.
- Search Result Total에는 Search Vertical을 연결한다.
- Search Entrance와 Search Demand를 별도 Evidence로 취급한다.
- Search Trend와 절대 검색량을 혼합하지 않는다.
- Recursive Keyword Discovery에는 Depth와 수량 제한을 둔다.
- Optional Collector 실패로 전체 Collection을 폐기하지 않는다.
- 실패와 실제 0을 구분한다.
- PARTIAL_SUCCESS도 Snapshot과 Export가 가능하다.
- Export는 새로운 Evidence를 생성하지 않는다.
- Search Evidence Pack은 저장된 Evidence를 Handoff 형식으로 변환한 결과다.
- Strategy Converter가 Search Evidence 이후의 판단을 담당한다.
- Planner, Research, Writer의 역할을 Collector가 침범하지 않는다.

---

# 107. Multi-Source Collection 실행 계약

하나의 Hub Seed Keyword 조사 실행은 하나의 Collection Job을 생성한다.
상위 Application / Collection Orchestrator가 조사 시작 시 Collection ID를 한 번 생성하고,
모든 Source Collector에 동일한 `collection_id`를 전달한다.

```text
Hub Seed Keyword
→ Collection 생성
→ Source별 Preflight / Collector 실행
→ Source Run별 RAW 보존
→ Canonical Evidence / Derived Metrics
→ 하나의 Collection Snapshot
→ SEARCH EVIDENCE PACK
→ GEO Handoff
```

Collector는 Collection ID를 생성하지 않는다. 동일 Seed를 새로 조사하는 경우에는
새 Collection을 생성한다.

## Source Run과 Partial Failure

각 Source 실행 시도는 Collection 내부 `source_run_id`로 구분한다.
Source Run은 별도의 상위 Session Entity가 아니다.

Search Ads가 성공하고 WEB이 실패한 경우에도:

- Search Ads RAW와 정상 Evidence를 보존한다.
- WEB 실패를 Source Run과 Error Registry에 기록한다.
- Collection은 `PARTIAL_SUCCESS`가 될 수 있다.
- 전체 Collection을 폐기하거나 fallback Evidence를 생성하지 않는다.

## Source Retry

실패한 Source만 Retry할 수 있다.

- 기존 `collection_id`를 유지한다.
- Retry마다 새로운 `source_run_id`를 생성한다.
- 기존 Source Run, Error, RAW는 수정하거나 삭제하지 않는다.
- Retry RAW는 별도 파일로 보존한다.
- Retry 성공 Evidence는 새로운 Evidence ID를 발급한다.
- Snapshot은 overwrite하지 않고 새 Version으로 저장한다.

동일 Collection의 Snapshot Version, Source Run, RAW Reference 계약은
`04_SEARCH_EVIDENCE_SCHEMA.md`의 상세 계약을 따른다.

---

## SEARCH EVIDENCE PACK Projection 단계

Collection Workflow의 Pack 단계는 다음 순서를 따른다.

```text
Collection
  → RAW
  → Normalization
  → Validation
  → Derived Metrics
  → Versioned Snapshot
  → SEARCH EVIDENCE PACK Projection
  → Result / Review
  → Strategy Converter Handoff
```

Pack Builder는 Snapshot만 입력으로 사용한다.

- 외부 API를 호출하지 않는다.
- RAW를 수정하지 않는다.
- Snapshot을 수정하지 않는다.
- Evidence 의미를 다시 계산하지 않는다.
- Keyword Ranking 또는 추천 판단을 만들지 않는다.
- Strategy Converter, Planner, Research, Writer의 책임을 침범하지 않는다.

Pack은 Keyword Candidate 중심 Projection이며 `HUB_SEED`와 `RELATED_KEYWORD` 역할을 보존한다.
Candidate는 Evidence, Metric, Source Run, RAW Reference를 참조 목록으로 연결하고 RAW Payload는
복제하지 않는다.

현재 Core Pack Source는 Search Ads Search Demand, Provider Competition Evidence, Total Search Volume,
Hub Seed WEB `SEARCH_RESULT_TOTAL`이다. DataLab Search Trend는 Optional Source이며 Trend가 없는
Collection도 정상 Core Pack을 생성할 수 있다. AutoComplete, 함께 많이 찾는 검색어, 일반 검색 UI
Related Search, Google Source는 현재 Production Pack에서 DEFER한다.

Pack 생성 Gate:

- `SUCCESS`: 정상 Pack 생성
- `PARTIAL_SUCCESS`: Core Search Ads Evidence와 Keyword 관계가 유효하면 성공 Evidence 및 Error를 포함한 Partial Pack 생성
- `FAILED`: 정상 분석용 Pack 생성 중단

Optional Source의 `NOT_COLLECTED` 또는 실패는 Core Pack 전체 실패로 변환하지 않는다.
Pack의 물리적 배열은 Canonical Keyword ID 또는 Collection 생성 순서의 결정론적 순서를 사용하며,
UI 정렬과 추천 Ranking을 구분한다.

Pack 저장은 Snapshot Payload와 분리된 Pack Repository가 담당한다. 현재 물리적 호환 경계는
`data/snapshots/<collection_id>/pack-v<pack_version>.json`이며, `data/exports/`는 General Export용이다.

---
## 65. Human Review and Selection

Pack 생성 이후 Reviewer가 Candidate별로 SELECTED, EXCLUDED, UNDECIDED를 결정한다. Review Selection은 Pack과 별도의 Versioned Artifact이며, Evidence/Metric을 다시 계산하거나 Pack을 수정하지 않는다.

SEARCH EVIDENCE PACK
  → Human Review
  → Review Selection Version
  → GEO Handoff
  → Strategy Converter

UNDECIDED는 허용된다. Core Pack이 유효하고 선택된 Candidate가 하나 이상인 경우 Handoff를 생성할 수 있다. Partial Success에서는 성공 Evidence, 실패 Source, Error, Coverage를 숨기지 않는다.
