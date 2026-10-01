# GEO SEARCH EVIDENCE COLLECTOR
## PROJECT CONSTITUTION

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System Role: Search Evidence Collection Layer

---

# 0. 문서의 지위

본 문서는 `GEO Search Evidence Collector` 프로젝트의 최상위 운영 헌법이다.

본 프로젝트의 기획, 설계, 개발, 수정, 리팩터링, 기능 추가는
모두 본 헌법을 기준으로 수행한다.

구현 편의를 이유로 본 헌법의 핵심 역할과 데이터 원칙을 변경해서는 안 된다.

본 프로젝트는 독립적인 콘텐츠 시스템이 아니라
`GEO PROJECT`의 하위 시스템이다.

따라서 상위 GEO PROJECT의 원칙을 따른다.

문서 간 충돌이 발생할 경우 다음 우선순위를 적용한다.

1. GEO PROJECT CONSTITUTION
2. GEO Search Evidence Collector PROJECT CONSTITUTION
3. PROJECT BRIEF
4. DATA SOURCE STANDARD
5. SEARCH EVIDENCE SCHEMA
6. WORKFLOW
7. SYSTEM ARCHITECTURE
8. UI REQUIREMENTS
9. DEVELOPMENT RULES

하위 문서는 상위 문서의 원칙을 변경할 수 없다.

---

# 1. 프로젝트 정체성

`GEO Search Evidence Collector`는

**Hub Seed Keyword를 출발점으로 실제 검색시장에서 관찰 가능한 Search Evidence를 수집·정규화·보존하여 GEO Strategy Converter와 후속 Knowledge System이 사용할 입력 자료를 생성하는 시스템이다.**

이 시스템의 핵심 질문은 다음과 같다.

> 사람들이 실제로 무엇을 찾고 있는가?

이 시스템은 다음 질문에 직접 답하지 않는다.

> 어떤 글을 써야 하는가?

> 어떤 Knowledge Node를 만들어야 하는가?

> 어떤 Hub를 구축해야 하는가?

이 판단은 GEO의 후속 시스템이 담당한다.

---

# 2. 프로젝트 목적

현재 GEO Search Demand 조사 과정에는 다음과 같은 반복 작업이 존재한다.

- Hub Keyword 직접 검색
- 연관키워드 확인
- 자동완성 확인
- 관련검색어 확인
- 함께 많이 찾는 검색어 확인
- PC 검색량 확인
- 모바일 검색량 확인
- 총 검색량 계산
- 문서수 확인
- 경쟁도 계산
- 검색 추이 확인
- 데이터를 Excel 또는 문서로 정리
- Strategy Converter 입력자료 작성

본 프로젝트의 목적은 이러한 반복 작업을 가능한 범위에서 자동화하여

**한 개의 Hub Seed Keyword 입력만으로 구조화된 Search Evidence Pack을 생성하는 것**이다.

---

# 3. GEO 전체 시스템에서의 위치

본 시스템은 GEO Knowledge Pipeline의 Search Evidence Layer에 위치한다.

기존 MVP / Compatibility Workflow의 기본 흐름은 다음과 같다.

Hub Seed Keyword

→ Keyword Discovery

→ Search Evidence Collection

→ Search Evidence Normalization

→ Search Evidence Pack

→ Strategy Converter

→ Hub Planner

→ Research

→ Writer

본 시스템은 `Strategy Converter` 이전 단계에 위치한다.

본 시스템은 Strategy Converter와 Planner의 역할을 침범하지 않는다.

현재 Target Architecture의 전체 GEO Workflow는 다음과 같다.

Hub Story Architect
→ Network Planner 1차
→ Strategy Planner Reviewer
→ GEO Search Evidence Collector
→ Final Planner Handoff
→ Network Planner 최종
→ Final Hub Knowledge Map

기존 Strategy Converter 경로는 Historical / Compatibility 경로로 보존하며,
Current Target Workflow의 필수 단계로 정의하지 않는다.

---

# 4. Search Evidence First

본 프로젝트의 가장 중요한 원칙은

**Search Demand를 추측하지 않는 것**이다.

검색수요가 존재한다고 판단하려면 가능한 경우 실제 검색 데이터를 확인한다.

다음과 같은 정보는 서로 구분한다.

- 실제 검색량
- 검색 추이
- 검색광고 연관키워드
- 자동완성
- 관련검색어
- SERP에서 관찰되는 검색어
- 문서수
- 계산된 경쟁지표
- AI가 생성한 후보
- 사람이 입력한 후보

AI가 생성한 키워드가 존재한다고 해서
실제 Search Demand가 존재한다고 기록해서는 안 된다.

---

# 5. Search Keyword ≠ Knowledge

검색어는 Knowledge Node가 아니다.

다음 구조를 기본 원칙으로 한다.

Search Demand

→ Search Entrance

→ User Question

→ Evergreen Knowledge

→ Knowledge Node

예를 들어

`원달러 환율 전망`

이라는 검색어가 존재한다고 해서

`2026년 원달러 환율 전망`

이라는 Article 또는 Node를 자동 생성해서는 안 된다.

검색어는 사용자의 Knowledge 접근 경로를 발견하기 위한 Evidence다.

Knowledge 구조로의 변환은 Strategy Converter와 Planner가 담당한다.

---

# 6. Search Demand와 Knowledge Value 분리

Search Demand와 Knowledge Value는 서로 다른 축이다.

검색량이 높다고 해서 반드시 중요한 Knowledge인 것은 아니다.

검색량이 낮다고 해서 Knowledge 가치가 없는 것도 아니다.

따라서 본 시스템은 검색량이 낮거나 0인 키워드를 자동 삭제하지 않는다.

Search Evidence는 그대로 보존한다.

후속 GEO 시스템이 다음을 판단할 수 있어야 한다.

- Search Demand가 높은 Knowledge
- Search Demand는 낮지만 구조적으로 필요한 Knowledge
- Search Entrance 역할을 하는 Keyword
- Relationship 설명에 필요한 Question
- Current Issue
- Evergreen Knowledge

본 시스템은 이 판단을 대신하지 않는다.

---

# 7. Hub Seed Keyword 원칙

사용자는 조사의 출발점으로 `Hub Seed Keyword`를 입력한다.

예:

- 환율
- 달러
- 엔화
- 로보어드바이저
- ETF

Hub Seed Keyword는 최종 Hub 확정을 의미하지 않는다.

`달러`를 입력했다고 해서
자동으로 `달러 Hub`를 생성하지 않는다.

Seed Keyword는 Search Evidence 탐색의 출발점일 뿐이다.

---

# 8. Evidence Layer

Search Evidence는 최소한 다음 Layer로 구분한다.

## 8.1 RAW

외부 Source에서 수집한 원본 데이터.

가능한 한 변형하지 않고 보존한다.

예:

- API Response
- 검색량
- 연관키워드
- 검색 추이
- 자동완성 결과
- SERP Observation

## 8.2 NORMALIZED

Source마다 다른 형식을
GEO 공통 Schema에 맞게 변환한 데이터.

예:

- keyword
- monthly_search_pc
- monthly_search_mobile
- document_count
- source
- collected_at

## 8.3 DERIVED

RAW 또는 NORMALIZED 데이터를 기반으로
시스템이 계산한 값.

예:

- total_search
- competition_ratio
- trend_change
- mobile_ratio

DERIVED 값은 원본 데이터와 구분한다.

---

# 9. Source Separation

모든 Evidence에는 출처 유형을 기록한다.

최소 Source Type은 다음과 같이 구분한다.

## OFFICIAL_API

공식 API에서 직접 제공된 데이터.

## SEARCH_PLATFORM_DATA

검색 플랫폼이 검색 화면 또는 공식 기능에서 제공하는 데이터.

## SERP_OBSERVATION

검색결과 화면에서 관찰한 데이터.

## CALCULATED

수집된 데이터를 이용해 시스템이 계산한 데이터.

## USER_PROVIDED

사용자가 직접 입력하거나 제공한 데이터.

## AI_DERIVED

AI가 분석·생성·추론한 데이터.

이 Source Type들은 서로 동일한 신뢰 수준으로 취급하지 않는다.

특히 `AI_DERIVED`를 실제 Search Demand Evidence처럼 표시해서는 안 된다.

---

# 10. Source Provenance

가능한 모든 Evidence에 다음 정보를 기록한다.

- Source Provider
- Source Type
- Query
- Collection Date
- Collection Method
- API / Interface Version
- Raw Value
- Normalized Value
- Verification Status
- Error Status

시간에 따라 변할 수 있는 데이터는
수집 시점을 반드시 보존한다.

---

# 11. Raw Data Preservation

원본 Evidence는 후속 계산 때문에 삭제하거나 덮어쓰지 않는다.

기본 원칙은 다음과 같다.

RAW

→ NORMALIZED

→ DERIVED

원본과 계산 결과를 분리해야 한다.

예:

월간검색수_PC = RAW 또는 NORMALIZED

월간검색수_모바일 = RAW 또는 NORMALIZED

총검색수 = DERIVED

경쟁정도_ratio = DERIVED

후속 계산식이 변경되더라도
원본 Evidence를 이용해 다시 계산할 수 있어야 한다.

---

# 12. Reproducibility

Search Evidence는 나중에 재검증할 수 있어야 한다.

따라서 동일한 Keyword라도

2026-09 수집 결과와
2027-03 수집 결과를
무조건 덮어쓰지 않는다.

가능한 경우 History를 보존한다.

이를 통해 다음을 확인할 수 있어야 한다.

- 언제 조사했는가
- 어떤 Source를 사용했는가
- 어떤 Query를 사용했는가
- 당시 어떤 값이 반환됐는가
- 이후 값이 어떻게 변했는가

Search Evidence는 Snapshot 성격을 가진다.

---

# 13. Failure Isolation

하나의 데이터 Source가 실패했다고 해서
전체 Search Evidence Collection을 실패 처리해서는 안 된다.

예:

자동완성 수집 실패

≠

검색량 수집 실패

≠

DataLab 수집 실패

각 Collector는 가능한 범위에서 독립적으로 동작한다.

결과는 다음과 같이 부분 성공할 수 있어야 한다.

SUCCESS

PARTIAL_SUCCESS

FAILED

수집하지 못한 Evidence는 임의 값으로 채우지 않는다.

`null`, `unavailable`, `error` 등 명확한 상태로 기록한다.

---

# 14. No Fabrication

데이터를 얻지 못했을 경우 추정값을 생성하지 않는다.

예:

검색량 API 실패

→ 이전 값을 현재 값으로 사용하지 않는다.

문서수 조회 실패

→ AI에게 문서수를 추정하게 하지 않는다.

자동완성 수집 실패

→ AI 생성 키워드를 자동완성 결과로 기록하지 않는다.

데이터가 없으면

`DATA NOT AVAILABLE`

상태로 남긴다.

---

# 15. Search Evidence Coverage

시스템은 가능한 범위에서 다음 Evidence를 수집할 수 있도록 설계한다.

## Search Demand

- PC 검색량
- 모바일 검색량
- 총 검색량
- 검색 추이

## Keyword Discovery

- 연관키워드
- 자동완성
- 관련검색어
- 함께 많이 찾는 검색어

## Competition

- 문서수
- 경쟁 관련 원본 데이터
- 계산된 경쟁지표

## Search Context

- 검색결과 유형
- 검색결과 구성
- 시점성 검색수요
- 검색어 간 관계

단, 실제 구현 여부는 DATA SOURCE STANDARD와 개발 단계에서 결정한다.

헌법은 특정 Source의 존재를 보장하지 않는다.

---

# 16. Official Source Preference

동일한 데이터를 공식적으로 얻을 수 있다면
공식 Source를 우선한다.

공식 API가 존재하는 데이터를
불필요하게 화면 Scraping으로 대체하지 않는다.

비공식 Source 또는 SERP Observation이 필요한 경우

- 왜 필요한지
- 어떤 데이터인지
- 안정성이 어느 정도인지

구분할 수 있어야 한다.

---

# 17. Scraping Independence

SERP 또는 웹 화면에서만 관찰 가능한 Evidence가 있을 수 있다.

그러나 이러한 수집 기능은
전체 시스템과 강하게 결합하지 않는다.

예:

NAVER 자동완성 Collector가 변경되어 작동하지 않아도

- Search Ads Data
- Search Volume
- DataLab
- 기존 저장 데이터
- Export

등 다른 기능은 정상 동작해야 한다.

웹 UI 변화에 취약한 Collector는
교체 가능한 Adapter 구조로 설계한다.

---

# 18. Provider Independence

초기 구현은 NAVER 중심으로 시작할 수 있다.

그러나 시스템의 핵심 Schema와 Architecture를
NAVER 전용 구조로 고정하지 않는다.

향후 다음 Source가 추가될 수 있다.

- Google
- YouTube
- Bing
- 기타 Search Platform
- 외부 Keyword Data Provider

Provider 추가 시 기존 Evidence Schema 전체를
재작성하지 않아도 되는 구조를 지향한다.

---

# 19. Human Reviewability

수집된 Evidence는 AI뿐 아니라
사람이 직접 검토할 수 있어야 한다.

사용자는 최소한 다음을 확인할 수 있어야 한다.

- 어떤 Keyword가 발견됐는가
- 검색량은 얼마인가
- 어디에서 발견됐는가
- 언제 수집됐는가
- 원본 데이터인가
- 계산된 데이터인가
- 오류가 발생했는가

Black Box 형태의 결과만 제공하지 않는다.

---

# 20. GEO Handoff

본 시스템의 최종 산출물은
단순 화면 또는 Excel 표가 아니다.

핵심 산출물은

`SEARCH EVIDENCE PACK`

이다.

Search Evidence Pack은 최소한 다음 두 목적을 동시에 충족해야 한다.

1. 사람이 검토할 수 있어야 한다.
2. Strategy Converter가 다시 해석하지 않고 입력자료로 사용할 수 있어야 한다.

가능한 Export 형식은 다음과 같다.

- JSON
- Markdown
- CSV
- XLSX

구체적인 Schema는
`04_SEARCH_EVIDENCE_SCHEMA.md`에서 정의한다.

---

# 21. Strategy Converter Boundary

본 시스템은 다음과 같은 문장을 자동 확정하지 않는다.

- 이 키워드를 공략해야 한다.
- 이 키워드가 최우선이다.
- 이 Keyword를 Node로 만들어야 한다.
- 이 Hub를 생성해야 한다.
- 이 Article을 작성해야 한다.

본 시스템은 Evidence를 제공한다.

Strategy Converter는 Search Evidence를 해석한다.

Planner는 Knowledge Architecture를 판단한다.

역할을 혼합하지 않는다.

---

# 22. Planner Boundary

본 시스템은 다음을 확정하지 않는다.

- HUB
- NODE
- SLUG
- USER QUESTION 최종본
- DIRECT ANSWER GOAL
- UNDERSTANDING GOAL
- Learning Path
- Relationship
- Internal Link
- PLANNER POST META

필요한 경우 후보 또는 Evidence를 전달할 수 있지만
최종 판단은 Planner가 수행한다.

---

# 23. Research Boundary

본 시스템은 최종 Knowledge Research와 Knowledge Architecture 판단을
수행하지 않는다.

단, 실제 Search Evidence에 근거한 다음 Evidence-based Research는
Collector의 책임 범위에 포함될 수 있다.

- Evidence-based Search Research
- Search Demand Research
- Broad Discovery
- Directed Research
- Deep Research
- Search Entrance Analysis
- Evidence Validation
- Evidence Compression

예:

`달러 인덱스`

라는 검색수요가 발견되었다고 해서

본 시스템이 달러 인덱스의 구성통화,
가중치,
공식 계산법을 Research하여 확정하지 않는다.

그 작업의 최종 판단은 Network Planner와 후속 Knowledge Layer가 담당한다.

Collector는 Evidence를 조사·검증·구조화·압축할 수 있지만 다음을 최종 결정하지 않는다.

- Knowledge Node
- Hub Architecture
- Learning Flow
- Knowledge Relationship
- Internal Link

---

# 24. Writer Boundary

본 시스템은 Article을 작성하지 않는다.

검색수요가 높다는 이유로
본문, 제목, 도입부, SEO 문구 등을 자동 생성하지 않는다.

Writer는 GEO Knowledge Pipeline의 후속 역할이다.

---

# 25. AI의 역할

AI는 Evidence Source가 아니라
Evidence Processing Assistant로 사용한다.

AI가 수행할 수 있는 역할의 예:

- 데이터 정리
- 중복 Keyword 후보 탐지
- 표기 정규화
- Evidence Pack 생성
- 사람이 검토할 후보 표시

AI가 단독으로 수행해서는 안 되는 역할의 예:

- 실제 검색량 생성
- 존재하지 않는 자동완성 생성
- 존재하지 않는 Related Search 생성
- 확인되지 않은 검색 추이 생성
- 추정값을 Official Data로 기록

AI 판단이 포함된 경우
`AI_DERIVED`임을 구분한다.

---

# 26. Minimal Automation, Maximum Reliability

자동화의 목적은
모든 판단을 기계에 맡기는 것이 아니다.

반복 작업을 줄이고
사람의 판단이 필요한 부분에 시간을 집중시키는 것이 목적이다.

따라서

불안정한 완전 자동화보다
검증 가능한 부분 자동화를 우선한다.

---

# 27. MVP 원칙

초기 버전에서는
가장 신뢰할 수 있고 반복 작업 절감 효과가 큰 기능부터 구현한다.

MVP의 성공 기준은 기능 개수가 아니다.

다음이 중요하다.

- 정확하게 수집되는가
- Source가 명확한가
- 다시 검증할 수 있는가
- 실패 상태를 알 수 있는가
- Export할 수 있는가
- GEO 후속 시스템에 바로 전달할 수 있는가

기능 추가는 이 기준을 훼손하지 않는 범위에서 수행한다.

---

# 28. Data Safety

API Key, Secret Key, Access Token 등
인증정보를 코드 또는 공개 Repository에 직접 저장하지 않는다.

인증정보는 환경변수 또는 별도의 안전한 Secret 관리 방식을 사용한다.

Log와 Export 파일에도
Secret이 포함되지 않도록 한다.

---

# 29. Change Management

외부 API, 검색 UI, 데이터 제공 방식은 변경될 수 있다.

따라서 Source 변경이 발생했을 때

전체 시스템을 다시 작성하지 않고
해당 Collector 또는 Adapter만 교체할 수 있어야 한다.

외부 Source 변경 때문에
기존 Historical Evidence를 삭제하지 않는다.

---

# 30. Version Principle

프로젝트는 Living System으로 운영한다.

새로운 Search Source가 발견되거나
수집 방식이 개선되더라도
기존 구조를 무조건 폐기하지 않는다.

필요한 부분만 수정한다.

중대한 Schema 변경 시에는
Version을 명시한다.

예:

Schema v1
Schema v2

기존 데이터의 해석 가능성을 보존한다.

---

# 31. 개발 판단 우선순위

개발 과정에서 선택이 필요한 경우
다음 우선순위를 따른다.

1. Evidence 정확성
2. Source 추적 가능성
3. 데이터 보존
4. 재현 가능성
5. 시스템 안정성
6. GEO Pipeline 연결성
7. 작업 자동화
8. 사용 편의성
9. 기능 수
10. 시각적 장식

화면을 예쁘게 만드는 것보다
Evidence가 정확하게 수집되는 것이 우선이다.

---

# 32. 프로젝트 성공 기준

이 프로젝트의 성공은
많은 Keyword를 생성하는 것이 아니다.

다음 작업이 가능해졌을 때 성공한 것이다.

사용자가 Hub Seed Keyword 하나를 입력한다.

↓

시스템이 가능한 Search Evidence를 자동 수집한다.

↓

Source와 수집 시점이 함께 저장된다.

↓

Raw / Normalized / Derived 데이터가 구분된다.

↓

사람이 결과를 검토한다.

↓

Search Evidence Pack이 생성된다.

↓

Strategy Converter가 이를 받아
Search Demand를 검증한다.

↓

Planner가 Knowledge Network를 설계한다.

---

# 33. 최종 원칙

본 프로젝트는

**Keyword Generator가 아니다.**

**Content Generator가 아니다.**

**SEO Article Generator가 아니다.**

**Knowledge Planner가 아니다.**

본 프로젝트는

> **GEO PROJECT가 실제 검색수요를 추측하지 않고 관찰할 수 있도록 Search Evidence를 수집하고 보존하는 기반 시스템이다.**

최종 명제:

> **Evidence를 먼저 수집한다.  
> 판단은 그 다음 시스템이 한다.  
> 원본은 보존한다.  
> 추정값을 사실로 만들지 않는다.**
