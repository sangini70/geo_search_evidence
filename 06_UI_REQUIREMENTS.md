# GEO SEARCH EVIDENCE COLLECTOR
## UI REQUIREMENTS

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: User Interface Requirements

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`의 사용자 인터페이스 요구사항을 정의한다.

이 시스템의 UI 목적은 화려한 Keyword Tool을 만드는 것이 아니다.

사용자가 하나의 Hub Seed Keyword를 입력하고,

- 무엇이 수집되고 있는지
- 어떤 Keyword가 발견됐는지
- 검색수요가 얼마나 확인됐는지
- 어떤 Source에서 왔는지
- 어떤 데이터가 실패하거나 누락됐는지
- Strategy Converter에 넘길 준비가 되었는지

를 빠르게 확인할 수 있게 만드는 것이 목적이다.

핵심 UX는 다음과 같다.

INPUT

→ COLLECT

→ REVIEW

→ EXPORT

---

# 2. UI 최상위 원칙

UI는 다음 원칙을 따른다.

1. Seed 입력이 가장 먼저 보인다.
2. 실행 방법은 단순해야 한다.
3. 기본 화면에 불필요한 설정을 노출하지 않는다.
4. 수집 상태를 명확하게 보여준다.
5. 검색량과 검색추이를 혼동시키지 않는다.
6. RAW와 DERIVED를 구분할 수 있어야 한다.
7. Missing과 0을 구분한다.
8. 실패를 숨기지 않는다.
9. Source를 확인할 수 있어야 한다.
10. Keyword 비교가 쉬워야 한다.
11. Export가 쉬워야 한다.
12. Strategy Converter Handoff가 쉬워야 한다.
13. GEO 판단 기능을 UI에 섞지 않는다.
14. Desktop First로 설계한다.
15. 기능보다 데이터 가독성을 우선한다.

---

# 3. 핵심 사용자

초기 핵심 사용자는 GEO 운영자 1인이다.

따라서 MVP에서는 다음을 고려하지 않는다.

- 회원가입
- 로그인
- 조직관리
- 사용자 권한
- 팀 Workspace
- 결제
- 구독
- SaaS Dashboard
- 공개 서비스용 Landing Page

UI는 내부 Research Tool에 가깝게 설계한다.

---

# 4. 핵심 사용자 행동

사용자가 수행하는 핵심 행동은 다섯 가지다.

1. Hub Seed Keyword 입력
2. Search Evidence 수집 실행
3. 결과 확인
4. 오류 및 Source 확인
5. Export 또는 Strategy Converter Handoff

이 다섯 행동보다 중요하지 않은 기능은 초기 화면에서 우선순위를 낮춘다.

---

# 5. 기본 화면 구조

초기 UI는 하나의 Main Screen을 중심으로 구성한다.

권장 구조:

HEADER

↓

SEARCH INPUT

↓

COLLECTION STATUS

↓

SUMMARY

↓

KEYWORD RESULT TABLE

↓

DETAIL PANEL

↓

EXPORT / GEO HANDOFF

별도의 복잡한 Dashboard를 먼저 만들지 않는다.

---

# 6. Header

Header에는 최소한 다음을 표시한다.

- GEO Search Evidence Collector
- 현재 Version
- Source 상태 확인 진입점
- History 진입점

초기 MVP에서는 Project Logo나 복잡한 Navigation이 필요하지 않다.

---

# 7. Search Input 영역

화면 상단에서 가장 중요한 영역이다.

필수 요소:

- Hub Seed Keyword Input
- Collect 버튼

예:

Hub Seed Keyword

`달러`

[ Search Evidence 수집 ]

사용자가 첫 화면에서 무엇을 해야 하는지 즉시 알 수 있어야 한다.

---

# 8. Seed Input

Seed Input은 한 번에 하나의 Hub Seed Keyword 입력을 기본으로 한다.

Placeholder 예:

`허브 키워드를 입력하세요`

예:

- 달러
- 엔화
- 환율
- ETF
- 로보어드바이저

MVP에서 여러 Keyword를 쉼표로 입력하는 기능은 제공하지 않아도 된다.

## 8.1 Sequential Research Input

현재 Target Research Architecture는 다음 확인 단계를 지원할 수 있어야 한다.

### STEP 1 — Hub Context

- Hub Seed / Hub Context
- Hub Story
- Story Direction

### STEP 2 — Planner Hypothesis

- Network Planner 1차 결과

### STEP 3 — Reviewer Research Direction

- Strategy Planner Reviewer 결과

### STEP 4 — Search Evidence Collection

실제 Collection과 Provider API 실행은 STEP 4에서만 시작한다.
STEP 1~3은 입력 구조 확인과 사용자 확인 단계이며 외부 Search API를 호출하거나
새 Collection을 생성하지 않는다.

기존 Result Table, Pack Review, Review Selection UI는 가능한 한 유지한다.

---

# 9. Seed Input Validation

잘못된 입력은 실행 전에 알려준다.

예:

빈 입력

→ `허브 키워드를 입력하세요.`

공백만 입력

→ 실행 금지

과도하게 긴 문자열

→ Validation Message

오류 메시지는 기술적인 Stack Trace가 아니라 사용자가 이해할 수 있는 문장으로 표시한다.

---

# 10. Collect Button

기본 Primary Action은 하나다.

`Search Evidence 수집`

또는 더 짧게:

`수집 시작`

버튼을 누르면 새로운 Collection Job을 생성한다.

기존 Collection을 덮어쓰지 않는다.

---

# 11. Advanced Options

MVP에서는 고급 옵션을 기본적으로 접어둔다.

예:

`고급 설정`

펼쳤을 때 향후 다음 옵션을 제공할 수 있다.

- Search Demand
- Competition
- Autocomplete
- Related Search
- Trend
- Search Vertical
- Max Keywords
- Discovery Depth
- Trend Period

초기 사용자는 옵션을 몰라도 정상 Collection을 실행할 수 있어야 한다.

---

# 12. Default Collection

사용자가 Seed만 입력하고 실행하면 시스템이 기본 Collection Profile을 사용한다.

MVP 기본:

- Search Demand: ON
- Competition Evidence: ON 또는 구현 가능한 기본값
- Search Entrance: Phase에 따라
- Trend: Phase에 따라
- Max Keywords: System Default
- Discovery Depth: System Default

기본값은 코드 내부에서 관리할 수 있지만 Collection Metadata에 기록한다.

---

# 13. Collection 시작 상태

Collect 버튼을 누르면 즉시 실행 상태를 보여준다.

예:

`달러 Search Evidence를 수집하고 있습니다.`

Collection ID 또는 기술 정보는 기본 화면에서 크게 강조하지 않는다.

필요하면 Detail에서 확인할 수 있게 한다.

---

# 14. Progress UI

진행 상황은 단계 중심으로 보여준다.

예:

Keyword Discovery  
→ 완료

Search Demand  
→ 수집 중

Competition  
→ 대기

Search Entrance  
→ 대기

Trend  
→ 대기

Processing  
→ 대기

정확한 진행률을 계산할 수 없다면 가짜 Percentage를 표시하지 않는다.

---

# 15. Collector Status 표시

Collector별 상태를 다음과 같이 구분한다.

- 대기
- 실행 중
- 완료
- 일부 완료
- 실패
- 건너뜀

내부 Enum은 영어를 사용할 수 있다.

UI에서는 이해하기 쉬운 한국어 Label을 사용할 수 있다.

---

# 16. 전체 Collection Status

전체 상태는 명확하게 표시한다.

SUCCESS

→ `수집 완료`

PARTIAL_SUCCESS

→ `일부 데이터 수집 실패`

FAILED

→ `수집 실패`

RUNNING

→ `수집 중`

PENDING

→ `대기 중`

색상만으로 상태를 전달하지 않는다.

Text Label을 반드시 함께 사용한다.

---

# 17. Partial Success UI

일부 Source가 실패해도 결과 화면을 정상적으로 보여준다.

예:

`수집은 완료되었지만 1개 Source에서 오류가 발생했습니다.`

그리고:

`오류 보기`

를 제공한다.

정상 수집된 Keyword 데이터를 숨기지 않는다.

---

# 18. Failed UI

Core Collection이 실패하면 명확한 원인을 표시한다.

예:

`Search Demand 데이터를 수집하지 못했습니다.`

가능한 추가 정보:

- Source
- Error Type
- Retry 가능 여부

사용자에게 검색량 0처럼 보이게 하지 않는다.

---

# 19. Summary 영역

Collection 완료 후 결과 상단에 Summary를 보여준다.

예:

Seed: 달러

수집일: 2026-09-28

발견 Keyword: 84

Search Demand 확보: 79

Missing: 5

Source 오류: 1

Status: PARTIAL_SUCCESS

Summary는 전체 결과를 빠르게 파악하기 위한 것이다.

---

# 20. Summary Card 남용 금지

각 숫자를 큰 Card 여러 개로 만들 필요는 없다.

내부 도구이므로 공간 효율성을 우선한다.

한 줄 또는 Compact Summary 영역을 권장한다.

예:

`달러 · Keyword 84 · Demand 79 · Missing 5 · 오류 1 · 2026-09-28`

---

# 21. Keyword Result Table

Result Table은 UI의 핵심이다.

MVP 기본 Column:

| Keyword | PC | Mobile | Total | Documents | Competition Ratio | Status |
|---|---:|---:|---:|---:|---:|---|

Phase 확장 후:

| Keyword | PC | Mobile | Total | Documents | Ratio | Auto | Related | Trend | Status |
|---|---:|---:|---:|---:|---:|---|---|---|---|

---

# 22. Keyword Column

Keyword는 Table의 첫 번째 주요 Column이다.

Seed Keyword는 시각적으로 구분할 수 있다.

예:

`달러` — SEED

나머지는 Related Keyword로 표시한다.

Keyword를 지나치게 축약하지 않는다.

---

# 23. PC Search Volume

Column:

`PC`

의미:

Monthly PC Search Volume

Tooltip 또는 Column Help에서 정확한 의미를 확인할 수 있게 한다.

---

# 24. Mobile Search Volume

Column:

`Mobile`

의미:

Monthly Mobile Search Volume

PC와 Mobile을 한 Column으로 합치지 않는다.

---

# 25. Total Search Volume

Column:

`Total`

Derived 값이면 사용자가 확인할 수 있어야 한다.

예:

Tooltip:

`PC + Mobile 계산값`

Source가 직접 제공한 값과 계산값을 구분할 수 있게 한다.

---

# 26. Documents

Column Label은 실제 Source 의미에 맞게 결정한다.

단순히 `문서수`라고 표시할 경우 사용자가 전체 웹 문서수로 오해할 수 있다.

권장:

`검색결과`

또는:

`Blog Results`

등 실제 Search Vertical을 반영한다.

상세 정보에서는 반드시 Vertical을 표시한다.

---

# 27. Competition Ratio

Column:

`Ratio`

또는:

`Competition Ratio`

이 값이 GEO 계산값이면 이를 명확히 한다.

Tooltip 예:

`Search Result Total ÷ Total Search Volume`

Formula Version은 Detail에서 확인할 수 있다.

Ratio를 자동으로:

낮음  
보통  
높음

으로 평가하지 않는다.

그 판단은 후속 Strategy Layer에서 수행한다.

---

# 28. Provider Competition

Provider 자체 Competition Metric이 존재하는 경우 GEO Competition Ratio와 별도 Column 또는 Detail로 표시한다.

예:

Provider Competition

vs

GEO Ratio

두 값을 같은 이름으로 표시하지 않는다.

---

# 29. Search Entrance Column

Phase 2 이후 다음 Column을 추가할 수 있다.

- Auto
- Related
- Co-search

Table에서는 Compact 표시를 사용할 수 있다.

예:

✓

또는:

3

단, 의미를 명확하게 한다.

예:

Auto = 자동완성 발견 여부

또는:

Auto = 자동완성 Position

둘 중 무엇인지 혼동되지 않게 한다.

---

# 30. Search Entrance Detail

Keyword를 선택하면 상세 Panel에서 다음을 보여줄 수 있다.

Autocomplete

- 발견 여부
- Position
- Parent Keyword
- Source
- Collected At

Related Search

- 발견 여부
- Position
- Parent Keyword
- Source
- Collected At

Co-searched

- 발견 여부
- Position
- Raw Label
- Source
- Collected At

---

# 31. Trend Column

Trend는 검색량과 다른 개념이므로 Table에서 단순 숫자로 섞지 않는다.

가능한 UI:

`Trend 보기`

또는 작은 Indicator

상세 Panel에서 실제 Trend 데이터를 확인한다.

---

# 32. Trend Detail

Trend Detail에는 다음을 표시할 수 있다.

- Period
- Time Unit
- Device
- Keyword Group
- Relative Ratio

필요하면 Line Chart를 사용할 수 있다.

Chart에는 반드시 다음을 명확히 한다.

`상대 검색 추이`

절대 검색량처럼 보이게 하지 않는다.

---

# 33. Table Sorting

사용자는 주요 Numeric Column을 정렬할 수 있어야 한다.

예:

- PC
- Mobile
- Total
- Search Result Total
- Competition Ratio

기본 정렬은 특정 Keyword를 추천하는 의미를 갖지 않도록 한다.

예:

Discovery 순서 또는 Total Search Volume 기준 등 시스템 Default를 명확히 할 수 있다.

---

# 34. Table Filtering

MVP 또는 초기 확장 단계에서 다음 Filter가 유용하다.

- Keyword Search
- Status
- Missing 여부
- Source
- Search Entrance 존재 여부

복잡한 SEO Filter Builder를 만들지 않는다.

---

# 35. Keyword Search Filter

결과가 많을 경우 Table 내부 검색을 제공한다.

예:

`결과 내 키워드 검색`

사용자가:

환율

을 입력하면 해당 문자열을 포함하는 Keyword를 빠르게 찾을 수 있다.

---

# 36. Missing 표시

Missing 값은 `0`으로 표시하지 않는다.

권장:

`—`

또는:

`N/A`

Tooltip 또는 Detail에서 이유를 확인할 수 있다.

예:

NOT_PROVIDED  
COLLECTION_FAILED  
NO_RESULT

---

# 37. 실제 0 표시

Source가 실제 숫자 0을 반환한 경우:

`0`

으로 표시한다.

Missing:

`—`

와 시각적으로 구분한다.

---

# 38. Error 표시

Keyword 단위 오류가 존재하면 Status Column에서 확인할 수 있다.

예:

`일부 실패`

클릭하면:

PC: SUCCESS  
Mobile: SUCCESS  
Search Result: FAILED

처럼 확인할 수 있다.

---

# 39. Keyword Detail Panel

Table Row를 선택하면 Keyword Detail을 표시한다.

권장 방식:

- Right Side Panel
- Expandable Row
- Modal

Desktop First에서는 Right Side Panel이 적합할 수 있다.

최종 구현 방식은 Leo가 전체 UI 구조에 맞춰 결정할 수 있다.

---

# 40. Detail Panel 구조

Keyword Detail은 다음 Section으로 구성할 수 있다.

## Keyword

- Raw Keyword
- Normalized Keyword
- Seed 여부
- Discovery Sources

## Search Demand

- PC
- Mobile
- Total

## Competition

- Search Result Total
- Search Vertical
- Provider Competition
- GEO Ratio

## Search Entrance

- Autocomplete
- Related Search
- Co-searched

## Trend

- Period
- Ratio

## Provenance

- Source
- Collector
- Collected At

## Errors

- Error Type
- Message

---

# 41. Provenance UI

일반 사용 화면에서는 Source 정보를 지나치게 크게 표시하지 않는다.

그러나 한두 번의 클릭으로 반드시 확인할 수 있어야 한다.

예:

`출처 보기`

→ NAVER_SEARCH_ADS  
→ OFFICIAL_API  
→ Collector v1  
→ Collected At

숫자의 출처를 숨기지 않는다.

---

# 42. RAW Evidence UI

MVP에서는 RAW JSON 전체를 기본 화면에 보여줄 필요가 없다.

Detail의 고급 영역에서 다음 기능을 제공할 수 있다.

`RAW 보기`

목적:

- Debug
- Source 검증
- Parsing 문제 확인

일반 검토 흐름을 방해하지 않게 접어둔다.

---

# 43. Derived Metric 표시

Derived Metric에는 작은 표시를 둘 수 있다.

예:

`Calculated`

또는:

`계산값`

상세 정보:

Formula  
Formula Version  
Input Evidence

사용자가 Source 원본값으로 오해하지 않게 한다.

---

# 44. Source Status Panel

Source 상태를 확인하는 별도 영역을 제공할 수 있다.

예:

NAVER Search Ads  
ACTIVE  
Last Verified: YYYY-MM-DD

NAVER Search API  
ACTIVE

Autocomplete  
EXPERIMENTAL

Related Search  
EXPERIMENTAL

이 Panel은 운영 및 Debug 용도다.

---

# 45. History

동일 Seed를 반복 조사할 경우 과거 Collection을 확인할 수 있어야 한다.

History 기본 Column:

- Seed
- Collection Date
- Keyword Count
- Status
- Source Error
- Export

MVP 초기에는 간단한 History List면 충분하다.

---

# 46. History 선택

과거 Collection을 선택하면 당시 Snapshot을 그대로 보여준다.

현재 Source 데이터로 자동 갱신하지 않는다.

과거 결과는 Historical Evidence다.

---

# 47. Re-run

History 또는 Result 화면에서:

`다시 수집`

기능을 제공할 수 있다.

Re-run은 기존 Collection 수정이 아니다.

새로운 Collection Job을 생성한다.

---

# 48. Historical Comparison

Phase 4에서는 동일 Seed의 두 Snapshot을 비교할 수 있다.

예:

2026-09-28

vs

2026-10-28

비교 대상:

- Search Volume
- Added Keywords
- Removed Keywords
- Search Entrance
- Competition Ratio

Comparison 기능은 MVP 필수가 아니다.

---

# 49. Export 영역

Result 화면에서 Export 기능을 쉽게 찾을 수 있어야 한다.

예:

`Export`

클릭 후:

- Markdown
- JSON
- CSV
- XLSX

---

# 50. Markdown Export

Markdown Export는 GEO Workflow에서 중요한 기능이다.

Button 예:

`Markdown 생성`

또는:

`Strategy Converter용 Markdown`

Markdown은 `SEARCH EVIDENCE PACK`을 기반으로 생성한다.

---

# 51. JSON Export

JSON은 시스템 간 데이터 전달용이다.

Button:

`JSON`

사용자가 자주 쓰지 않더라도 향후 자동 Pipeline을 위해 유지한다.

---

# 52. CSV Export

CSV는 간단한 Table 분석용이다.

Button:

`CSV`

Keyword 중심 Flat Projection을 Export한다.

---

# 53. XLSX Export

기존 GEO 작업 방식과 호환하기 위해 XLSX Export를 제공할 수 있다.

Button:

`Excel`

가능한 Sheet:

- SUMMARY
- EVIDENCE
- SOURCES
- ERRORS

MVP에서는 SUMMARY 중심 단일 Sheet부터 시작해도 된다.

---

# 54. GEO Handoff

일반 Export와 GEO Handoff를 구분할 수 있다.

예:

`Strategy Converter 입력 생성`

이 기능은 현재 Collection에서 `SEARCH EVIDENCE PACK`을 생성한다.

---

# 55. Strategy Converter 입력 생성

Button 실행:

Current Collection

→ Evidence Pack Builder

→ Markdown

→ Preview

사용자는 생성된 내용을 확인하고 복사하거나 저장할 수 있다.

향후 자동 연결이 가능해져도 Pack Preview를 유지하는 것이 좋다.

---

# 56. Handoff Preview

Preview에는 최소한 다음을 보여준다.

- Hub Seed
- Collection Date
- Keyword Data
- Search Demand
- Competition
- Search Entrance
- Trend
- Source
- Missing
- Errors

Strategy Converter로 무엇이 전달되는지 사람이 확인할 수 있어야 한다.

---

# 57. Copy 기능

Markdown 결과에는:

`복사`

버튼을 제공하는 것이 좋다.

현재 GEO 작업 방식에서 ChatGPT 또는 다른 Agent에 전달하기 쉽기 때문이다.

한 번의 동작으로 전체 Pack을 복사할 수 있어야 한다.

---

# 58. Export와 Handoff 차이

Export:

데이터 파일 생성

Handoff:

다음 GEO 단계가 이해할 수 있는 구조로 변환

둘을 구분한다.

예:

CSV Export

vs

Strategy Converter Input

---

# 59. Warning 표시

중요한 데이터 제한은 사용자에게 알려준다.

예:

`검색결과 수는 NAVER Blog Search 기준입니다.`

또는:

`Trend는 상대 검색 추이입니다.`

또는:

`Autocomplete 수집에 실패했습니다.`

경고는 실제로 필요한 경우에만 표시한다.

---

# 60. UI에서 금지하는 해석

다음 Label을 자동 생성하지 않는다.

- 최고의 Keyword
- 추천 Keyword
- 황금 Keyword
- 쉬운 Keyword
- 돈 되는 Keyword
- 반드시 공략
- 버려야 할 Keyword
- 성공 확률 높음

Collector UI는 Evidence Review Tool이다.

판단 도구가 아니다.

---

# 61. Keyword Ranking 금지

Result Table에 자동 종합점수를 만들어 Keyword 순위를 매기지 않는다.

예:

SEO Score 93  
Opportunity Score 87  
GEO Score 95

이런 값은 Evidence Source가 아니다.

향후 Strategy Layer에서 명시적인 Rule이 정의되기 전까지 만들지 않는다.

---

# 62. Search Demand 강조

Keyword 판단을 하지 않더라도 Search Demand 비교를 위해 Total Search Volume 정렬은 가능하다.

이는 Evidence 정렬이지 추천 Ranking이 아니다.

UI 문구에서도 이를 구분한다.

---

# 63. Responsive 정책

본 시스템은 Desktop First다.

주요 사용 환경:

- PC
- 큰 Table
- 다수 Keyword 비교
- Export
- GEO 작업

모바일 최적화는 우선순위가 낮다.

그러나 최소한 화면이 완전히 깨지지 않도록 Responsive 기본 처리는 한다.

---

# 64. Desktop Layout

권장 Desktop 구조:

Top Header

↓

Seed Search Area

↓

Status / Summary

↓

Wide Keyword Table

↓

Optional Detail Side Panel

↓

Export Actions

Table 가독성을 최우선으로 한다.

---

# 65. Table Width

Column이 많아질 경우 모든 Column을 억지로 좁게 만들지 않는다.

가능한 방법:

- Horizontal Scroll
- Column 선택
- Detail Panel
- Phase별 Column 그룹

Keyword를 읽을 수 없을 정도로 압축하지 않는다.

---

# 66. Column Visibility

향후 Column 선택 기능을 제공할 수 있다.

예:

기본:

Keyword  
PC  
Mobile  
Total  
Documents  
Ratio  
Status

선택:

Autocomplete  
Related  
Trend  
Source

MVP 필수 기능은 아니다.

---

# 67. Accessibility

상태를 색상만으로 구분하지 않는다.

예:

빨간색만 표시

금지

권장:

FAILED + 색상

PARTIAL + 색상

SUCCESS + 색상

Text와 Visual Indicator를 함께 사용한다.

---

# 68. Loading 상태

수집 중 Table을 빈 화면으로 방치하지 않는다.

예:

`Search Demand를 수집하고 있습니다.`

가능하면 현재 실행 단계도 표시한다.

---

# 69. Empty State

아직 Collection이 없는 첫 화면에서는 간단한 안내를 보여준다.

예:

`허브 키워드를 입력하면 관련 Search Evidence를 수집합니다.`

긴 사용 설명서를 첫 화면에 노출하지 않는다.

---

# 70. No Result State

Collection은 성공했지만 Related Keyword가 없을 경우:

`관련 키워드 결과가 없습니다.`

라고 표시한다.

`수집 실패`와 구분한다.

---

# 71. Error Message 원칙

사용자용 오류 메시지는 다음 구조를 권장한다.

무엇이 실패했는가

+

결과에 어떤 영향이 있는가

+

필요하면 다음 행동

예:

`Autocomplete 수집에 실패했습니다. 검색량 데이터는 정상적으로 수집되었습니다.`

---

# 72. Developer Error Detail

기술적인 Error Detail은 별도로 확인할 수 있게 한다.

예:

Error Type  
HTTP Status  
Collector  
Source  
Timestamp  
Raw Error

일반 사용자 Message와 Stack Trace를 동일 영역에 섞지 않는다.

---

# 73. API Credential UI

초기 Local Tool에서 Credential 입력 UI가 필요한지는 구현 환경에 따라 결정한다.

가능하면 Secret은 Environment Variable 또는 안전한 설정 방식으로 관리한다.

Result 화면에서 Secret을 표시하지 않는다.

---

# 74. Settings

초기 Settings는 최소화한다.

필요 후보:

- Source Enabled
- Default Search Vertical
- Max Keywords
- Discovery Depth
- Export Directory
- Trend Period

개발자 설정과 일반 Collection 설정을 구분한다.

---

# 75. Source Configuration UI

Source별 상태 확인이 필요하면 다음 정도만 표시한다.

Source  
Status  
Enabled  
Last Verified

Secret Key 자체를 보여주지 않는다.

---

# 76. Data Refresh

Result 화면에서 `새로고침`이 단순히 외부 Source를 다시 호출하는 의미가 되어서는 안 된다.

UI 화면 Refresh와 Evidence Re-collection을 구분한다.

Evidence를 다시 수집하려면:

`다시 수집`

을 사용한다.

---

# 77. Auto-save

Collection 결과는 완료 후 자동 저장한다.

사용자가 별도의 `저장` 버튼을 눌러야만 Evidence가 남는 구조를 만들지 않는다.

특히 RAW Evidence는 수집 과정에서 안전하게 보존한다.

---

# 78. Delete

과거 Collection 삭제 기능은 MVP 우선순위가 낮다.

추가할 경우 실수 방지를 위해 확인 절차를 둔다.

Historical Evidence를 무심코 삭제하지 않도록 한다.

---

# 79. Raw Data와 Export 파일 구분

UI에서 다음을 구분한다.

Stored Collection

vs

Exported File

Export 파일을 삭제했다고 Collection 원본이 삭제되어서는 안 된다.

---

# 80. Performance UX

Keyword가 많더라도 UI가 멈춘 것처럼 보여서는 안 된다.

필요한 경우:

- Pagination
- Virtualized Table
- Progressive Rendering

등을 사용할 수 있다.

그러나 MVP에서는 실제 데이터 규모를 먼저 확인한 후 도입한다.

---

# 81. Pagination

수백 개 이상의 Keyword가 발생하면 Pagination을 고려한다.

예:

50개 / 페이지

또는:

100개 / 페이지

작은 Dataset에서 불필요한 Pagination을 강제하지 않는다.

---

# 82. Result Count

Table 상단에 현재 결과 수를 표시한다.

예:

`84 Keywords`

Filter 적용 시:

`84개 중 17개 표시`

사용자가 현재 보고 있는 범위를 알 수 있게 한다.

---

# 83. Table Selection

향후 특정 Keyword만 Export하거나 Trend 조사할 필요가 있다면 Checkbox Selection을 추가할 수 있다.

MVP에서는 필수가 아니다.

전체 Collection 중심 Workflow를 우선한다.

---

# 84. Detail 우선순위

Detail Panel에서 정보 표시 우선순위:

1. Search Demand
2. Competition Evidence
3. Search Entrance
4. Trend
5. Provenance
6. RAW
7. Technical Metadata

일반 검토에 필요한 정보를 먼저 보여준다.

---

# 85. Search Evidence와 Technical Metadata 분리

사용자가 가장 자주 보는 정보:

Keyword  
Search Volume  
Competition  
Search Entrance

개발자가 주로 보는 정보:

Evidence ID  
Collector Version  
Raw Response  
HTTP Status

두 영역을 시각적으로 구분한다.

---

# 86. Phase별 UI 노출

아직 구현되지 않은 기능을 빈 Menu로 먼저 만들지 않는다.

MVP:

Search Demand + Competition + Export

Phase 2:

Search Entrance 추가

Phase 3:

Trend 추가

Phase 4:

Historical Comparison 추가

Phase 5:

Provider 선택 추가

실제 기능이 생길 때 UI를 추가한다.

---

# 87. MVP Main Screen

MVP Main Screen은 다음 정도면 충분하다.

HEADER

↓

Hub Seed Input + Collect Button

↓

Collection Status

↓

Summary

↓

Keyword Table

↓

Keyword Detail

↓

Export

복잡한 Sidebar Navigation은 필요하지 않다.

---

# 88. MVP Result Table

MVP 필수 Column:

- Keyword
- PC
- Mobile
- Total
- Search Result
- Competition Ratio
- Status

가능하면:

- Source

를 추가한다.

Source가 여러 개면 Detail에서 확인할 수 있다.

---

# 89. MVP Detail

MVP Keyword Detail:

- Raw Keyword
- Search Demand
- Search Result
- Search Vertical
- Competition Ratio
- Source
- Collected At
- Status
- Error

이 정도로 시작한다.

---

# 90. MVP Export

MVP에서 최소한 다음 두 가지는 우선 지원한다.

- Markdown
- JSON

기존 작업 호환성이 필요하면:

- CSV
- XLSX

를 추가한다.

---

# 91. Phase 2 UI

Phase 2에서 추가:

- Auto Column
- Related Column
- Search Entrance Detail
- Discovery Source 표시
- Discovery Depth 표시

Search Entrance 때문에 Main Table이 지나치게 복잡해지면 Detail Panel을 적극 활용한다.

---

# 92. Phase 3 UI

Phase 3에서 추가:

- Trend 상태
- Trend Detail
- Relative Trend Chart
- Period Selector

Trend Chart는 절대 검색량과 혼동되지 않게 Label을 표시한다.

---

# 93. Phase 4 UI

Phase 4에서 추가:

History

→ Collection 선택

→ Compare

비교 화면:

- Current
- Previous
- Change

Search Demand 변화와 Keyword 구성 변화를 확인할 수 있게 한다.

---

# 94. Phase 5 UI

여러 Provider를 지원하게 되면 Provider Filter 또는 Provider Selector를 추가할 수 있다.

예:

NAVER  
GOOGLE  
YOUTUBE

Provider 데이터가 서로 같은 Metric처럼 보이지 않도록 구분한다.

---

# 95. GEO Handoff UI

장기적으로 가장 중요한 Action 중 하나는 다음이다.

`Strategy Converter 입력 생성`

이 버튼은 단순 Download 버튼이 아니다.

현재 Collection을 GEO 다음 단계가 읽을 수 있는 Evidence Pack으로 변환한다.

---

# 96. GEO Handoff 위치

Result 검토가 끝난 뒤 자연스럽게 사용할 수 있도록 화면 하단 또는 Export 영역에 배치한다.

예:

Export

- Markdown
- JSON
- Excel

GEO

- Strategy Converter 입력 생성

일반 Export와 다음 Workflow 진행을 구분한다.

---

# 97. Handoff 완료 상태

Evidence Pack 생성 후 다음을 보여준다.

`Strategy Converter 입력이 생성되었습니다.`

그리고:

- Preview
- Copy
- Save

기능을 제공할 수 있다.

Collector 자체에서 Strategy Converter 분석 결과를 만들지 않는다.

---

# 98. UI에서 AI 사용

MVP UI에 AI Chat 기능을 넣지 않는다.

예:

`이 Keyword 분석해줘`

같은 Chat Panel을 만들 필요가 없다.

Search Evidence Collector의 핵심은 데이터 수집과 검토다.

AI 판단은 별도 GEO 단계에서 수행한다.

---

# 99. UI에서 광고성 기능 금지

내부 GEO Tool이므로 다음은 필요 없다.

- Upgrade
- Premium
- Pricing
- Credits
- Daily Streak
- Gamification
- Keyword Score Animation
- Marketing Popup

작업 속도와 정확성을 우선한다.

---

# 100. Visual Design 원칙

Visual Design은 다음 방향을 따른다.

- Clean
- Dense but readable
- Data-first
- Neutral
- Professional
- Minimal

과도한 Gradient, Animation, Illustration은 필요하지 않다.

---

# 101. 정보 계층

시각적 중요도는 다음과 같다.

가장 중요:

Seed  
Search Demand  
Keyword Table

그 다음:

Competition  
Status  
Search Entrance

그 다음:

Trend  
Source

고급:

RAW  
Collector Metadata  
Technical Error

---

# 102. UI와 Canonical Data 분리

UI Table 구조에 맞추기 위해 Database Schema를 변경하지 않는다.

Canonical Data:

Collection  
Keyword  
Evidence  
Source  
Derived Metric  
Error

UI:

Projection

이 원칙을 유지한다.

---

# 103. UI와 Workflow 분리

UI에서 버튼 하나를 눌렀다고 모든 Logic을 Component 안에 구현하지 않는다.

UI:

Command 전달

Application Layer:

Workflow 실행

Collector:

Source 수집

Repository:

저장

UI:

결과 표시

이 역할을 분리한다.

---

# 104. UI 상태 복구

페이지를 새로 열거나 Application을 재실행해도 저장된 Collection을 다시 조회할 수 있어야 한다.

완료된 Evidence가 UI Session에만 존재해서는 안 된다.

---

# 105. Running Job 복구

향후 장시간 Job을 지원한다면 Application 재실행 시 Running Job 상태 처리 규칙이 필요하다.

MVP에서는 복잡한 Resume 기능을 필수로 하지 않는다.

대신 비정상 종료된 Job을 식별할 수 있도록 상태를 보존한다.

---

# 106. 사용자 확인이 필요한 상황

다음 상황에서는 명확한 안내가 필요하다.

- Core Source 인증 실패
- 모든 Keyword 수집 실패
- Source 구조 변경 의심
- Export 생성 실패
- 데이터 저장 실패

Optional Source 하나가 실패할 때마다 불필요한 Modal을 띄우지 않는다.

---

# 107. Modal 사용 최소화

Modal은 작업 흐름을 끊는다.

따라서 다음과 같은 중요한 경우에만 사용한다.

- 삭제 확인
- 위험한 설정 변경
- 치명적 오류
- 명확한 사용자 선택 필요

일반 정보는 Inline Message나 Panel을 사용한다.

---

# 108. Tooltip 사용

Column 의미가 짧은 Label만으로 불명확한 경우 Tooltip을 사용한다.

예:

Total

→ `PC와 Mobile 검색량을 합산한 계산값`

Ratio

→ `현재 Formula Version에 따른 GEO 계산값`

사용자가 별도 설명서를 열지 않아도 핵심 의미를 이해할 수 있게 한다.

---

# 109. Documentation Link

고급 사용자를 위해 다음 문서로 연결할 수 있다.

- Data Source Standard
- Schema
- Workflow

그러나 UI를 Documentation Portal로 만들지 않는다.

---

# 110. UI 테스트 핵심 시나리오

Leo는 최소 다음 UI Flow를 테스트한다.

Scenario 1:

앱 실행

→ `달러` 입력

→ 수집 시작

→ Progress 확인

→ 완료

→ Keyword Table 확인

→ Keyword Detail 확인

→ Markdown 생성

→ Copy

---

# 111. Partial Success UI 테스트

Scenario 2:

Search Demand 성공

Autocomplete 실패

Expected:

- Search Demand Table 정상 표시
- 전체 결과 삭제되지 않음
- PARTIAL_SUCCESS 표시
- Autocomplete 오류 확인 가능
- Export 가능
- Export에 Missing/Error 포함

---

# 112. Failed UI 테스트

Scenario 3:

Core Search Demand Source 실패

Expected:

- FAILED 표시
- 오류 원인 확인 가능
- 검색량 0으로 표시되지 않음
- 기존 Historical Collection은 영향 없음

---

# 113. Missing UI 테스트

Scenario 4:

PC 값 존재

Mobile Missing

Expected:

PC = 실제 값

Mobile = —

Total = —

Status = 일부 데이터 없음

Total을 PC 값과 동일하게 표시하지 않는다.

---

# 114. Zero UI 테스트

Scenario 5:

Source가 실제 0을 반환

Expected:

0

Missing:

—

두 상태가 명확히 구분된다.

---

# 115. Historical UI 테스트

Scenario 6:

`달러`를 두 번 수집

Expected:

History에 두 Collection 존재

첫 번째 Collection 열기

→ 첫 번째 Snapshot 표시

두 번째 Collection 열기

→ 두 번째 Snapshot 표시

두 번째 결과가 첫 번째 결과를 덮어쓰지 않는다.

---

# 116. Export UI 테스트

Scenario 7:

Collection 완료

→ Strategy Converter 입력 생성

Expected:

- Hub Seed 존재
- Collection Date 존재
- Keyword Data 존재
- Search Demand 존재
- Source 존재
- Missing 표시
- Error 표시
- 전체 복사 가능

---

# 117. UI에서 금지하는 것

다음을 금지한다.

- 첫 화면부터 복잡한 Dashboard
- 불필요한 회원 기능
- Keyword 종합 Score
- AI 추천 Ranking
- 검색량과 Trend를 같은 Metric처럼 표시
- Missing을 0으로 표시
- Error를 숨김
- Source 없는 숫자 표시
- Search Vertical 없는 문서수 표시
- Derived 값을 Source 원본처럼 표시
- 가짜 Progress Percentage
- 무제한 Keyword Expansion UI
- Export 시 Evidence 해석 추가
- Collector 안에서 Planner 기능 제공
- Collector 안에서 Writer 기능 제공
- UI Session에만 Evidence 보관
- 화려한 디자인 때문에 Table 가독성 저하

---

# 118. UI 개발 우선순위

개발 우선순위는 다음과 같다.

1. Seed 입력
2. Collection 실행
3. 실행 상태
4. Keyword Result Table
5. Missing / Error 표시
6. Keyword Detail
7. Source 확인
8. Export
9. Strategy Converter Handoff
10. History
11. Search Entrance
12. Trend
13. Historical Comparison
14. Provider Expansion
15. 시각적 장식

---

# 119. MVP UI 완료 기준

MVP UI는 사용자가 설명 없이 다음 작업을 수행할 수 있으면 된다.

`달러` 입력

→ 수집 시작

→ 진행 상태 확인

→ 결과 Table 확인

→ 검색량 비교

→ Missing 확인

→ Source 확인

→ 오류 확인

→ Markdown 생성

→ Strategy Converter에 전달

이 흐름이 빠르고 명확해야 한다.

---

# 120. 최종 UI 정의

GEO Search Evidence Collector의 UI는 Keyword Research SaaS가 아니다.

또한 SEO Dashboard도 아니다.

본 UI의 목적은 다음 하나다.

> Search Evidence를 빠르게 수집하고, 검토하고, 다음 GEO 단계로 넘긴다.

따라서 최종 UX는 다음 구조를 유지한다.

INPUT

→ COLLECT

→ STATUS

→ REVIEW

→ VERIFY

→ EXPORT

→ GEO HANDOFF

사용자가 가장 자주 보는 것은 화려한 그래프가 아니라:

**Keyword**

**Search Demand**

**Competition Evidence**

**Source**

**Status**

이다.

좋은 UI는 시스템의 복잡성을 과시하는 UI가 아니다.

**사용자가 Evidence를 빠르게 이해하고 다음 작업으로 이동할 수 있게 하는 UI다.**

---

# FACT CHECK LIST

- 초기 사용자는 GEO 운영자 1인을 기준으로 한다.
- MVP는 회원가입·결제·팀 Workspace를 요구하지 않는다.
- 기본 UX는 INPUT → COLLECT → REVIEW → EXPORT 구조다.
- Seed Keyword 하나를 기본 Collection 단위로 사용한다.
- Collection 진행 상태와 최종 상태를 구분해서 표시한다.
- PARTIAL_SUCCESS에서도 정상 Evidence를 확인하고 Export할 수 있어야 한다.
- Missing과 실제 0을 UI에서 구분한다.
- PC, Mobile, Total Search Volume을 구분한다.
- Derived Total과 Competition Ratio는 계산값임을 확인할 수 있어야 한다.
- Search Result Total에는 실제 Search Vertical 정보를 확인할 수 있어야 한다.
- Search Demand와 Search Trend를 동일한 Metric처럼 표시하지 않는다.
- Search Entrance는 Search Demand와 별도 Evidence로 표시한다.
- Source와 Collection Date를 추적할 수 있어야 한다.
- UI Table은 Canonical Data의 Projection이며 저장 Schema 자체가 아니다.
- 동일 Seed의 재수집은 기존 Collection 수정이 아니라 새로운 Collection 생성이다.
- Export와 Strategy Converter Handoff를 구분한다.
- Collector UI에서는 Keyword 추천 Ranking이나 Knowledge Node 판단을 수행하지 않는다.
- Desktop First와 Table 가독성을 우선한다.
## 99. Review Selection UI

Review UI는 Pack Candidate별 Decision Control을 제공한다. 기본 Decision은 UNDECIDED이며 Reviewer가 직접 SELECTED 또는 EXCLUDED로 변경한다. Reviewer Note, 선택/제외/미결정 개수, Review Version 조회와 저장을 제공한다.

UI는 Pack을 수정하지 않으며, 저장은 Application과 ReviewSelectionRepository를 통해 수행한다. 자동 선택, Ranking, Recommendation, SEO/GEO Score, Competition Ratio 계산은 제공하지 않는다.
