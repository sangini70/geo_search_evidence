# GEO SEARCH EVIDENCE COLLECTOR
## DATA SOURCE STANDARD

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: Search Evidence Source Standard

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`가 Search Evidence를 수집할 때 사용할 데이터 Source의 기준을 정의한다.

본 문서의 목적은 단순히 API 목록을 만드는 것이 아니다.

다음을 명확하게 결정한다.

- 어떤 Source를 사용할 것인가
- 각 Source에서 무엇을 수집할 것인가
- 어떤 데이터를 공식 Evidence로 취급할 것인가
- 어떤 데이터를 Observation으로 취급할 것인가
- Source가 제공하지 않는 값을 어떻게 처리할 것인가
- Source별 신뢰 수준을 어떻게 구분할 것인가
- Source가 변경되거나 종료될 경우 어떻게 대응할 것인가
- 수집 실패를 어떻게 기록할 것인가
- RAW / NORMALIZED / DERIVED를 어떻게 구분할 것인가

이 문서는 `04_SEARCH_EVIDENCE_SCHEMA.md`보다 먼저 적용한다.

Schema는 본 문서에서 확정한 Source와 Evidence Type을 기준으로 설계한다.

---

# 2. 최상위 원칙

Search Evidence Collector는 다음 원칙을 따른다.

> Source가 없는 데이터는 만들지 않는다.

> 공식 제공값과 계산값을 구분한다.

> 검색량과 검색추이를 구분한다.

> 검색결과 수와 실제 경쟁도를 동일하게 취급하지 않는다.

> SERP 화면에서 관찰된 정보와 공식 API 데이터를 동일한 등급으로 취급하지 않는다.

> AI가 추정한 값은 Search Evidence가 아니다.

> 수집 실패를 0으로 기록하지 않는다.

> Source가 변경되면 기존 데이터를 조작하지 않고 Collector를 수정한다.

---

# 3. Evidence Source 분류

모든 데이터 Source는 다음 Category 중 하나로 분류한다.

## A. OFFICIAL_API

검색 플랫폼 또는 서비스 운영자가 공식적으로 제공하는 API.

예:

- NAVER Search Ads API
- NAVER API HUB
- 공식 Search Trend API

가장 우선적으로 사용한다.

---

## B. OFFICIAL_PLATFORM_DATA

공식 웹서비스에서 직접 제공되지만 API가 아닐 수 있는 데이터.

예:

- 검색광고 Keyword Tool 화면
- 공식 DataLab 화면
- 공식 검색 서비스가 표시하는 데이터

API와 동일한 자동화 안정성을 보장하지 않는다.

---

## C. SERP_OBSERVATION

실제 Search Result Page 또는 Search UI에서 관찰되는 데이터.

예:

- 자동완성
- 관련검색어
- 함께 많이 찾는 검색어
- 특정 검색결과 UI 요소

이 데이터는 실제 Search Entrance를 이해하는 데 중요하지만 UI 변경에 취약하다.

---

## D. CALCULATED

공식 또는 관찰 Source에서 수집한 값을 이용해 GEO 시스템이 계산한 데이터.

예:

- Total Search Volume
- competition_ratio
- Mobile Search Share
- 기타 파생 지표

반드시 원본 값과 분리한다.

---

## E. USER_PROVIDED

사용자가 직접 입력하거나 업로드한 데이터.

예:

- 기존 Excel Keyword Data
- 과거 조사 결과
- 수동으로 확보한 검색량
- 사람이 캡처하거나 기록한 SERP Evidence

Source와 Collection Date를 가능한 범위에서 기록한다.

---

## F. AI_DERIVED

AI가 Evidence를 정리하거나 분류한 결과.

예:

- Keyword 의미 분류
- Intent 후보
- 중복 후보
- Search Entrance 해석 후보

AI_DERIVED는 Search Evidence 원본으로 사용하지 않는다.

---

# 4. Source 신뢰 계층

기본 Source 우선순위는 다음과 같다.

Tier 1  
OFFICIAL_API

Tier 2  
OFFICIAL_PLATFORM_DATA

Tier 3  
SERP_OBSERVATION

Tier 4  
USER_PROVIDED

Tier 5  
AI_DERIVED

단, 이 순위는 데이터의 목적에 따라 달라질 수 있다.

예를 들어 자동완성 자체를 조사하는 경우 실제 검색 UI의 `SERP_OBSERVATION`이 해당 Evidence의 직접 Source가 될 수 있다.

따라서 Tier는 데이터의 진실성에 대한 절대 점수가 아니라 기본적인 Provenance 기준이다.

---

# 5. 현재 핵심 Provider

MVP의 핵심 Search Provider는 NAVER로 한다.

이유:

- 현재 GEO Search Demand 조사에서 NAVER Keyword Data를 사용하고 있다.
- PC / Mobile 검색수요를 분리해서 활용하고 있다.
- 한국어 Search Entrance 분석이 중요하다.
- 기존 GEO Workflow와 직접 연결된다.

그러나 Core Architecture를 NAVER 전용 시스템으로 만들지 않는다.

향후 다음 Provider가 추가될 수 있다.

- Google
- YouTube
- Bing
- 기타 Search Provider

---

# 6. NAVER Search Ads API

NAVER Search Ads API는 초기 Search Demand 수집의 핵심 Source 후보로 사용한다.

현재 공식 Search Ads API는 별도 서비스 URL과 API 인증 구조를 제공한다.

검색광고 계정을 기반으로 API License와 Secret Key 등을 발급받아 사용하는 구조를 전제로 한다.

이 Source는 일반 Search API와 구분한다.

Search Ads API의 목적은 광고 운영 시스템이지만, GEO에서는 Keyword 관련 공식 데이터를 Search Demand Evidence로 활용한다.

---

# 7. Search Ads Keyword Evidence

Search Ads Keyword 관련 Source에서 확보 가능한 데이터가 실제 응답에서 확인될 경우 다음 Evidence 후보를 수집한다.

- Related Keyword
- Monthly PC Search Volume
- Monthly Mobile Search Volume
- Competition 관련 제공값
- 기타 Keyword Tool 제공 지표

단, 실제 필드와 의미는 현재 API 응답 및 공식 명세를 기준으로 구현 시 검증한다.

과거 문서나 블로그에서 본 필드명을 그대로 하드코딩하지 않는다.

---

# 8. 월간 검색량

월간 검색량은 GEO Search Demand 판단의 핵심 Evidence다.

가능한 경우 다음을 분리하여 저장한다.

- Monthly PC Search Volume
- Monthly Mobile Search Volume

그리고 PC와 Mobile이 모두 유효한 정확한 Numeric 값인 경우에만
시스템에서 다음 값을 계산할 수 있다.

Total Search Volume  
= PC Search Volume + Mobile Search Volume

Provider 특수값(`<10` 또는 `< 10`)이 포함되면 정확한 Total을 계산하지 않는다.
세부 상태와 Missing/null/invalid 처리 규칙은
`04_SEARCH_EVIDENCE_SCHEMA.md`와 `05_WORKFLOW.md`의 Total Search Volume
계약을 따른다.

Total이 Source에서 직접 제공되지 않고 시스템에서 계산된 경우:

`CALCULATED`

또는

`DERIVED`

로 기록한다.

Source가 직접 제공한 값처럼 표시하지 않는다.

---

# 9. 검색량 특수값 처리

외부 Source가 정확한 숫자 대신 특정 범위 또는 특수 표현을 반환할 수 있다.

이 경우 임의의 숫자로 변환하지 않는다.

예:

정확한 검색량 미제공  
→ 원본 표현 보존

필요하다면 별도 Normalization Rule을 정의한다.

예:

raw_value  
normalized_value  
normalization_method

정확하지 않은 값을 정확한 숫자처럼 만들어서는 안 된다.

---

# 10. Related Keyword

Seed Keyword를 기반으로 공식 Keyword Source가 반환하는 Related Keyword는 중요한 Keyword Discovery Evidence다.

예:

Seed:

달러

Related Keyword 후보:

- 달러 환율
- 원달러 환율
- 달러 투자
- 달러 환전

Related Keyword가 발견됐다는 사실과 검색량이 존재한다는 사실을 분리한다.

즉:

RELATED_KEYWORD Evidence

와

SEARCH_VOLUME Evidence

는 서로 다른 Evidence다.

---

# 11. NAVER Search Trend

Search Trend는 절대 검색량과 다른 Evidence다.

Trend Source는 특정 Keyword 또는 Keyword Group이 시간에 따라 어떻게 움직였는지를 확인하는 용도로 사용한다.

수집 후보:

- Period
- Time Unit
- Device
- Gender
- Age
- Relative Search Ratio

Trend 값은 절대 검색 횟수로 해석하지 않는다.

---

# 12. Trend Evidence 원칙

다음 두 값은 절대 혼동하지 않는다.

Search Volume  
= 특정 기간의 검색량 관련 값

Search Trend  
= 시간에 따른 상대적인 검색 관심도 변화

Trend가 100이라고 해서 검색량이 100회라는 의미로 저장해서는 안 된다.

Schema에서도 별도 Evidence Type으로 분리한다.

---

# 13. NAVER API HUB 이관 대응

2026년 현재 NAVER의 Search API 및 Search Trend API 계열은 기존 NAVER Developers 제공 구조에서 NAVER Cloud Platform의 `NAVER API HUB`로 이관되는 과정에 있다.

따라서 신규 시스템은 과거 Developers Endpoint를 영구적인 기본 Architecture로 가정하지 않는다.

Provider 구현은 다음과 같이 분리한다.

NAVER

- Search Ads Adapter
- API HUB Search Adapter
- API HUB Search Trend Adapter
- SERP Observation Adapter

기존 API를 사용하는 환경이 존재하더라도 Legacy Adapter로 격리한다.

---

# 14. Legacy API 원칙

기존 NAVER Developers API를 이미 사용할 수 있는 환경이 존재할 수 있다.

그러나 신규 개발에서는 다음 원칙을 따른다.

- 신규 공식 경로 우선
- Legacy Endpoint 하드코딩 금지
- Provider Version 기록
- Legacy와 Current Adapter 분리
- Migration 가능 구조 유지

Legacy API가 동작한다는 이유만으로 장기 Core Dependency로 채택하지 않는다.

---

# 15. NAVER Search API / API HUB

NAVER Search API 계열은 검색결과 데이터를 조회하는 Source로 사용할 수 있다.

GEO에서는 Search Demand의 절대 검색량 Source와 동일하게 취급하지 않는다.

활용 후보:

- 검색 결과 존재 여부
- 특정 Search Vertical의 결과 수
- SERP 관련 보조 Evidence
- Content Competition Observation

검색 API가 반환하는 `total`과 같은 값이 존재하더라도 해당 값의 의미를 명확하게 기록한다.

---

# 16. Document Count

기존 GEO Workflow에서는 `총문서수`를 활용해 Competition 관련 지표를 계산해왔다.

Search Evidence Collector에서도 해당 데이터가 필요할 수 있다.

그러나 `총문서수`라는 명칭만으로 Source와 의미가 불분명해지는 것을 금지한다.

반드시 다음을 기록한다.

- Provider
- Search Vertical
- Query
- Count
- Collected At
- Source Type

## 16.1 Canonical Search Surface Policy (NEW_POLICY)

기존 GEO에서 실제 사용한 Document Count Source 또는 Search Surface는
확인되지 않았다. 따라서 다음 정책은 기존 정책의 복원이 아니라
2026-09-29부터 적용하는 `NEW_POLICY`다.

GEO의 Canonical `SEARCH_RESULT_TOTAL` / Document Count 기본 Search Surface는
`WEB`으로 한다.

- search_vertical: `WEB`
- provider: `NAVER`
- product: `NAVER API HUB Web Document Search`
- endpoint: `/search/v1/webkr`
- response_field: `total`

의미:

특정 Query에 대한 NAVER Web Document Search의 총 검색 결과 수를
GEO의 Canonical `SEARCH_RESULT_TOTAL`로 사용한다.

`BLOG`, `NEWS` 등 다른 Search Vertical의 `total`은 Canonical Document Count에
합산하지 않는다. 향후 다른 Vertical이 필요하면 별도 Evidence로 확장한다.

---

# 17. 검색결과 수와 Competition

검색결과 수가 많다는 사실은 하나의 Evidence다.

그러나 이것을 곧바로 실제 SEO 경쟁 난이도라고 정의하지 않는다.

따라서 다음을 구분한다.

RAW:

Search Result Total

DERIVED:

competition_ratio

ANALYSIS:

Competition Interpretation

Collector는 RAW와 DERIVED까지만 처리한다.

최종 해석은 후속 시스템이 담당한다.

---

# 18. Competition Ratio

기존 GEO Workflow에서 사용한 `competition_ratio`는 DERIVED Metric으로 관리한다.

원칙:

- Source 직접 제공값으로 표시하지 않는다.
- 계산에 사용한 검색량을 기록한다.
- 계산에 사용한 문서수를 기록한다.
- Formula Version을 기록한다.
- 분모가 0 또는 Missing인 경우 임의 계산하지 않는다.

정확한 계산식은 `04_SEARCH_EVIDENCE_SCHEMA.md`에서 정의한다.

단, 기존 GEO Formula의 실제 Source of Truth가 확인되기 전까지
활성 Formula와 Formula Version은 다음 상태를 유지한다.

```text
formula: NOT_CONFIGURED
formula_version: NOT_CONFIGURED
```

---

# 19. NAVER Search API의 Vertical

검색결과 수를 사용할 경우 Search Vertical을 반드시 기록한다.

Canonical 기본값은 `WEB`이다. `BLOG`, `NEWS`, `CAFE` 및 기타 Vertical은
각각의 `search_vertical`을 보존하는 별도 Evidence로만 취급한다.

서로 다른 Vertical의 `total` 값을 같은 의미로 혼합하지 않는다.

예를 들어 BLOG 결과 수를 NAVER 전체 문서수라고 표시하지 않는다.

---

# 20. Search API 호출량

공식 API에는 호출 한도가 존재할 수 있다.

따라서 Source Metadata에 가능한 경우 다음을 관리한다.

- Provider
- API Product
- Daily Limit
- Request Count
- Rate Limit Status

호출 제한은 코드에 영구 상수로 고정하지 않는 것을 원칙으로 한다.

Provider 정책 변경 가능성을 고려한다.

---

# 21. Autocomplete

자동완성은 Search Entrance Evidence로 중요하다.

그러나 공식 Search Demand API와 같은 성격으로 취급하지 않는다.

Evidence Type:

`AUTOCOMPLETE`

Source Type:

`SERP_OBSERVATION`

또는 공식 API가 확인될 경우 해당 공식 Source Type

자동완성 수집 시 최소 다음을 기록한다.

- Seed Keyword
- Suggested Keyword
- Position
- Provider
- Collected At
- Collection Method

---

# 22. Related Searches

검색 결과 화면에서 제공되는 관련 검색어는 Search Entrance Evidence로 사용할 수 있다.

Evidence Type:

`RELATED_SEARCH`

수집 시 기록:

- Seed Keyword
- Related Keyword
- Position
- Provider
- Collected At
- Collection Method

검색 UI 변경 가능성이 높으므로 별도 Collector로 격리한다.

---

# 23. 함께 많이 찾는 검색어

NAVER Search UI에서 특정 시점에 제공되는 관련 검색 기능이 확인될 경우 Search Entrance Evidence로 저장할 수 있다.

Evidence Type 예:

`CO_SEARCHED_KEYWORD`

또는 Schema에서 확정하는 표준 명칭

중요:

UI 명칭과 기능은 변경될 수 있다.

따라서 내부 데이터 구조를 화면 문구 자체에 종속시키지 않는다.

Raw Label은 별도 저장할 수 있다.

---

# 24. SERP Observation 원칙

SERP 기반 Collector는 다음 원칙을 따른다.

1. 공식 API Collector와 분리한다.
2. DOM 변경 가능성을 전제로 한다.
3. 실패해도 전체 Job을 중단하지 않는다.
4. 수집 시점을 기록한다.
5. 검색 Device 조건을 기록한다.
6. 검색 Locale 조건을 가능한 경우 기록한다.
7. Position을 기록할 수 있다.
8. Raw Observation을 가능한 범위에서 보존한다.

---

# 25. SERP Scraping 의존 최소화

본 시스템은 핵심 Search Demand 수집을 Scraping에 의존하지 않는다.

우선순위:

Official API  
→ Official Platform Data  
→ SERP Observation

Scraping이 필요한 기능은 Optional Collector로 격리한다.

Scraping Collector가 중단되어도 Search Demand Core 기능은 유지되어야 한다.

---

# 26. 이용약관 및 접근정책 준수

외부 서비스에서 데이터를 수집할 때 다음을 준수한다.

- 공식 API 이용약관
- Provider 사용 정책
- 인증 정책
- Rate Limit
- 허용된 데이터 사용 범위
- 접근 제한
- 자동화 관련 제한

기술적으로 접근 가능하다는 이유만으로 수집을 허용하지 않는다.

특히 웹 UI 자동 수집 기능은 개발 전에 해당 시점의 Provider 정책을 다시 확인한다.

---

# 27. Source Provenance

모든 Evidence에는 가능한 범위에서 Provenance를 기록한다.

필수 후보:

- source_provider
- source_product
- source_type
- source_identifier
- collection_method
- collected_at
- collector_version

필요 시:

- request_parameters
- response_status
- raw_reference
- provider_version

을 추가한다.

---

# 28. Source Identifier

Source를 단순히 `NAVER`라고만 기록하지 않는다.

가능한 경우 더 구체적으로 구분한다.

예:

NAVER_SEARCH_ADS  
NAVER_API_HUB_SEARCH  
NAVER_API_HUB_SEARCH_TREND  
NAVER_SERP_AUTOCOMPLETE  
NAVER_SERP_RELATED

이를 통해 동일 Provider 내부의 서로 다른 Source를 구분한다.

---

# 29. Collection Method

Collection Method를 기록한다.

예:

API  
OFFICIAL_UI  
SERP_OBSERVATION  
MANUAL_IMPORT  
FILE_IMPORT

향후 새로운 방식이 추가될 수 있다.

---

# 30. RAW Response 보존

API Source에서 받은 원본 Response는 가능한 한 RAW 형태로 보존한다.

예:

- JSON
- XML
- Text Response
- Response Metadata

Normalization 이후 원본을 삭제하지 않는다.

외부 Source 구조가 변경되었을 때 과거 데이터 검증에 사용할 수 있어야 한다.

---

# 31. UI Observation Raw Data

SERP Observation은 API Response와 달리 Raw Data 보존 방식이 다를 수 있다.

가능한 경우 다음을 보존한다.

- Observed Text
- Position
- UI Section
- Collection Timestamp
- Collector Version

HTML 전체 저장 또는 Screenshot 저장은 필요성과 정책을 검토한 후 결정한다.

MVP에서 무조건 저장하지 않는다.

---

# 32. Freshness

Search Evidence는 시간에 따라 변한다.

따라서 모든 동적 Evidence에는 `collected_at`이 필요하다.

예:

검색량  
검색추이  
자동완성  
관련검색어  
검색결과 수

과거 수집값을 현재값처럼 표시하지 않는다.

---

# 33. Freshness 상태

향후 필요하면 다음 상태를 사용할 수 있다.

FRESH  
STALE  
HISTORICAL

Freshness 기준 기간은 Evidence Type별로 다르게 설정할 수 있다.

MVP에서는 복잡한 자동 판정보다 Collection Date 표시를 우선한다.

---

# 34. Missing Data

Source가 값을 반환하지 않은 경우 다음 중 하나로 구분한다.

- NOT_PROVIDED
- NO_RESULT
- NOT_SUPPORTED
- COLLECTION_FAILED
- PARSE_FAILED
- NOT_REQUESTED

`0`과 Missing을 구분한다.

검색량 0과 검색량 수집 실패는 완전히 다른 상태다.

---

# 35. Partial Data

한 Keyword에서 일부 데이터만 확보될 수 있다.

예:

Keyword: 달러 환율

PC Search Volume: SUCCESS  
Mobile Search Volume: SUCCESS  
Autocomplete: SUCCESS  
Related Search: FAILED  
Trend: NOT_REQUESTED

이 상태를 정상적으로 저장한다.

완전한 데이터만 저장하는 구조로 만들지 않는다.

---

# 36. Source Conflict

서로 다른 Source가 서로 다른 값을 제공할 수 있다.

이 경우 하나의 값을 임의로 선택하여 덮어쓰지 않는다.

예:

Source A Search Volume  
Source B Search Volume

각각 별도 Evidence로 저장한다.

후속 시스템 또는 사람이 어떤 Source를 우선할지 판단한다.

---

# 37. Source Priority와 Data Merge

동일 Metric에 여러 Source가 존재하는 경우 기본적으로 공식 Source를 우선 표시할 수 있다.

그러나 원본 Evidence는 모두 보존한다.

즉:

Preferred Value

와

Available Evidence

를 분리한다.

Preferred Value를 선택하는 Rule이 있다면 Rule Version을 기록한다.

---

# 38. AI 사용 제한

AI에게 다음 값을 생성하게 하지 않는다.

- 검색량
- 문서수
- Trend Index
- 자동완성 존재 여부
- Related Search 존재 여부
- Competition Source Value

AI가 해당 값을 추정하더라도 Search Evidence DB에는 공식 Evidence로 저장하지 않는다.

AI가 생성한 결과는 반드시 `AI_DERIVED`로 분리한다.

---

# 39. Search Evidence와 Knowledge Evidence 분리

본 프로젝트는 Search Evidence Collector다.

따라서 다음은 기본 수집 범위가 아니다.

- 정부 정책 사실
- 법률 조항
- 금융상품 조건
- 경제 통계 원문
- 기업 공식 발표
- 학술 논문 Evidence

이 데이터는 GEO Research Layer의 영역이다.

Search Evidence Collector는 사람들이 무엇을 검색하는지 관찰한다.

Research는 그 질문에 대한 사실을 조사한다.

두 Evidence System을 혼합하지 않는다.

---

# 40. MVP 1 Source

MVP 1에서는 가장 먼저 Search Demand Core를 구축한다.

우선 Source:

## Primary

NAVER Search Ads API

목적:

- Related Keyword
- PC Monthly Search Volume
- Mobile Monthly Search Volume
- Search Demand 관련 공식 제공값

## Secondary

NAVER Search API / NAVER API HUB에서 실제 사용 가능한 Search Vertical

목적:

- Search Result Count 관련 Evidence
- Competition 계산용 보조 데이터

단, 실제 사용할 Vertical은 구현 전에 검증한다.

---

# 41. MVP 1에서 제외 가능한 Source

다음 Source는 MVP 1 Core 완료 후 추가할 수 있다.

- Autocomplete
- Related Search UI
- 함께 많이 찾는 검색어
- 기타 SERP Observation
- Google
- YouTube
- Bing

MVP 1의 성공을 이 Source들에 의존시키지 않는다.

---

# 42. Phase 2 Source

Phase 2에서는 Search Entrance Layer를 강화한다.

추가 후보:

NAVER Autocomplete  
NAVER Related Searches  
NAVER Co-searched Keywords  
기타 NAVER SERP Observation

각 기능은 별도 Collector로 구현한다.

---

# 43. Phase 3 Source

Phase 3에서는 Trend Layer를 추가한다.

Primary 후보:

NAVER Search Trend 계열 공식 API

수집 후보:

- Date
- Period
- Ratio
- Device
- Gender
- Age

GEO에서 필요한 최소 범위부터 구현한다.

초기에는 모든 demographic dimension을 수집할 필요가 없다.

---

# 44. Phase 4 Source

Phase 4에서는 새로운 Source 추가보다 기존 Evidence의 Historical Value를 높이는 것을 우선한다.

예:

- 동일 Keyword 반복 Snapshot
- 검색량 변화
- Trend 변화
- Search Entrance 변화
- Competition Evidence 변화

즉 새로운 Provider를 계속 붙이는 것보다 기존 Evidence의 시간축을 확보한다.

---

# 45. Phase 5 Provider Expansion

NAVER 기반 Workflow가 안정화된 후 필요성이 확인되면 다른 Provider를 추가한다.

Provider 후보:

Google  
YouTube  
Bing

추가 조건:

1. GEO에 실제 가치가 있는가
2. 합법적이고 안정적인 수집 방법이 있는가
3. Source Provenance를 기록할 수 있는가
4. 기존 Evidence와 의미를 구분할 수 있는가
5. 유지보수 비용보다 가치가 큰가

---

# 46. Google Source 원칙

Google Source를 향후 추가하더라도 NAVER 데이터를 대체하는 방식으로 사용하지 않는다.

NAVER Search Demand와 Google Search Demand는 서로 다른 Search Ecosystem의 Evidence다.

따라서 Provider를 반드시 구분한다.

잘못된 구조:

Keyword  
Search Volume = 10000

권장 구조:

Keyword  
Provider = NAVER  
Search Volume = X

Keyword  
Provider = GOOGLE  
Search Volume = Y

---

# 47. YouTube Source 원칙

YouTube Keyword Evidence가 향후 필요해질 수 있다.

그러나 일반 Web Search와 Video Search Demand를 동일한 Metric으로 합산하지 않는다.

Provider뿐 아니라 Search Surface를 구분한다.

예:

Provider: YOUTUBE  
Surface: VIDEO_SEARCH

---

# 48. Source Versioning

외부 Source는 변경될 수 있다.

따라서 중요한 Collector에는 Version을 둔다.

예:

naver_search_ads_collector_v1  
naver_api_hub_search_collector_v1  
naver_serp_autocomplete_collector_v1

Source 구조가 크게 변경될 경우 Collector Version을 올린다.

---

# 49. Source 변경 감지

다음 상황은 Source Change로 간주할 수 있다.

- API Endpoint 변경
- Authentication 변경
- Response Field 변경
- Data Definition 변경
- Search UI 변경
- DOM 구조 변경
- Rate Limit 변경
- 서비스 종료
- 새로운 API HUB 이관

Source Change가 감지되면 기존 RAW Data를 수정하지 않는다.

Collector를 수정하거나 새 Version을 만든다.

---

# 50. Deprecated Source

사용 중이던 Source가 종료되거나 대체될 경우 다음 상태를 사용할 수 있다.

ACTIVE  
LEGACY  
DEPRECATED  
DISABLED

과거 Snapshot에는 당시 사용한 Source Identifier를 그대로 유지한다.

---

# 51. API Credential 관리

API Credential은 Source Data가 아니다.

다음 정보는 Evidence DB에 저장하지 않는다.

- Secret Key
- Client Secret
- Access Token
- Password

Credential은 Environment Variable 또는 별도 Secret 관리 방식으로 처리한다.

---

# 52. Source Configuration

Source별 설정은 가능한 한 코드와 분리한다.

예:

- Enabled
- Provider
- API Base
- Timeout
- Retry Count
- Rate Limit Setting
- Collector Version

환경에 따라 변경 가능한 값은 Configuration으로 관리한다.

---

# 53. Manual Import

초기 운영 또는 API 미지원 데이터는 Manual Import를 허용할 수 있다.

예:

기존 Excel:

- 연관키워드
- 월간검색수_PC
- 월간검색수_모바일
- 총검색수
- 총문서수
- 경쟁정도_ratio

Import 시 Source Type:

`USER_PROVIDED`

또는

`MANUAL_IMPORT`

로 기록한다.

자동 API 수집 데이터처럼 위장하지 않는다.

---

# 54. Existing GEO Excel Compatibility

기존 GEO Workflow에서 사용하는 Excel 구조는 초기 Migration Source로 활용할 수 있다.

대표 필드:

- 연관키워드
- 월간검색수_PC
- 월간검색수_모바일
- 총검색수
- 총문서수
- 경쟁정도_ratio

새 시스템은 기존 데이터를 Import할 수 있도록 고려한다.

그러나 내부 Schema 자체를 기존 Excel Column에 종속시키지 않는다.

---

# 55. Data Source Registry

시스템에는 Source Registry 개념을 둔다.

각 Source에 대해 다음 정보를 관리할 수 있다.

- Source ID
- Provider
- Product
- Source Type
- Status
- Collection Method
- Collector Version
- Official 여부
- Documentation Reference
- Last Verified At

예:

Source ID: NAVER_SEARCH_ADS  
Provider: NAVER  
Type: OFFICIAL_API  
Status: ACTIVE

---

# 56. Documentation Reference

Official API Source는 가능한 경우 공식 Documentation Reference를 관리한다.

목적:

- 개발자가 Source 정의를 확인
- API 변경 확인
- Collector 유지보수
- 데이터 의미 검증

문서 URL 자체를 Evidence Value로 취급하지 않는다.

---

# 57. Last Verified At

외부 Source의 기술 사양은 변경될 수 있다.

따라서 Source Registry에 다음 값을 둘 수 있다.

`last_verified_at`

이는 해당 Source의 API 명세 또는 접근 가능성을 마지막으로 확인한 시점을 의미한다.

Search Evidence의 `collected_at`과는 다른 값이다.

---

# 58. Source 선택 기준

새로운 Source를 추가하기 전에 다음을 평가한다.

## 1. Relevance

GEO Search Demand 판단에 필요한가?

## 2. Reliability

안정적으로 데이터를 제공하는가?

## 3. Provenance

출처를 명확히 기록할 수 있는가?

## 4. Repeatability

같은 방식으로 다시 수집할 수 있는가?

## 5. Maintainability

변경 시 수정 가능한가?

## 6. Compliance

공식 정책과 이용조건을 준수할 수 있는가?

## 7. Cost

API 비용 또는 유지보수 비용이 합리적인가?

---

# 59. Source 추가 금지 기준

다음 Source는 기본적으로 추가하지 않는다.

- 출처가 불명확한 Keyword 사이트
- 검색량 생성 방식을 공개하지 않는 데이터
- AI가 추정한 검색량
- 무단 복제된 Keyword DB
- 유지보수가 불가능한 임시 Scraper
- GEO와 관계없는 Traffic Metric
- Provider 정책상 사용이 명확하게 허용되지 않은 자동수집 방식

---

# 60. Search Evidence Pack의 Source 정보

최종 `SEARCH EVIDENCE PACK`에는 최소한 다음 Source 정보를 포함한다.

- Provider
- Source
- Collection Date
- Collection Status

필요한 경우:

- Source Type
- Collector Version
- Missing Data
- Error Summary

를 포함한다.

Strategy Converter가 데이터의 출처와 상태를 확인할 수 있어야 한다.

---

# 61. Strategy Converter 전달 원칙

Strategy Converter에 전달할 때 Source가 다른 데이터를 하나의 숫자로 무조건 합치지 않는다.

예:

NAVER Search Volume  
NAVER Trend  
NAVER Autocomplete  
NAVER Related Search

각각 별도 Evidence로 전달한다.

Strategy Converter가 Search Demand와 Search Entrance를 구분해서 해석할 수 있어야 한다.

---

# 62. Current Source Map

현재 목표 Source Map은 다음과 같다.

Hub Seed Keyword

↓

NAVER Search Ads
- Related Keywords
- PC Search Volume
- Mobile Search Volume

↓

NAVER Search / API HUB
- Search Result Evidence
- Search Vertical Total

↓

NAVER Search Trend
- Relative Search Trend
- Time Series

↓

NAVER SERP
- Autocomplete
- Related Searches
- Co-searched Keywords

↓

GEO Derived Metrics
- Total Search Volume
- Competition Ratio
- 기타 파생 지표

↓

SEARCH EVIDENCE PACK

---

# 63. MVP Source Map

MVP 1에서는 구조를 단순화한다.

Hub Seed Keyword

↓

NAVER Search Ads

↓

Related Keywords

↓

PC / Mobile Search Volume

↓

필요한 Search Result Evidence

↓

Derived Metrics

↓

Result Table

↓

Export

Search Entrance와 Trend가 아직 없어도 MVP 1은 작동해야 한다.

---

# 64. Source와 Phase 관계

MVP 1

Search Demand Core

Phase 2

Search Entrance

Phase 3

Search Trend

Phase 4

Historical Evidence + GEO Handoff 강화

Phase 5

Provider Expansion

이 순서를 기본으로 한다.

---

# 65. Source 관련 개발 우선순위

Source 개발 우선순위는 다음과 같다.

1. 공식성
2. Search Demand 가치
3. 데이터 의미 명확성
4. 반복 수집 가능성
5. Source Provenance
6. 안정성
7. 유지보수성
8. 자동화 가치
9. 추가 기능
10. 화면 장식

---

# 66. 2026 Source Transition Note

본 프로젝트 시작 시점에는 NAVER API 환경의 이관이 진행 중이다.

따라서 Leo가 실제 구현을 시작할 때 다음을 다시 확인한다.

- 현재 NAVER Search Ads API 명세
- 현재 Keyword 관련 Endpoint
- 현재 NAVER API HUB Search API 명세
- 현재 Search Trend API 명세
- 인증 방식
- 호출 제한
- 사용 가능 Vertical
- 이용약관
- Legacy API 종료 일정

본 문서에 적힌 기술 세부사항보다 **구현 시점의 공식 Documentation을 우선한다.**

단, 공식 Documentation 변경으로 인해 본 프로젝트의 Evidence 원칙 자체를 변경하지 않는다.

---

# 67. Source Verification Gate

새 Collector를 Production Source로 활성화하기 전에 다음을 확인한다.

- 공식 Source인가
- 데이터의 의미를 확인했는가
- 실제 Response를 확인했는가
- RAW Response를 저장할 수 있는가
- Source Identifier가 정의됐는가
- Missing 처리 방식이 있는가
- Error 처리 방식이 있는가
- Rate Limit을 확인했는가
- 이용정책을 확인했는가
- Test Data가 있는가

검증되지 않은 Collector는 Experimental 상태로 둔다.

---

# 68. Experimental Collector

새로운 Source를 시험할 때 다음 상태를 사용할 수 있다.

`EXPERIMENTAL`

Experimental Collector의 데이터는 저장할 수 있지만 공식 Core Evidence와 구분한다.

충분히 검증되면:

`ACTIVE`

로 변경한다.

---

# 69. Data Source Standard에서 금지하는 것

다음을 금지한다.

- 검색량 추정
- Source 없는 숫자 생성
- 실패값을 0으로 저장
- Trend Ratio를 검색량으로 저장
- Search Result Total을 전체 웹 문서수라고 단정
- SERP Observation을 공식 API 데이터로 표시
- AI 결과를 RAW Evidence로 저장
- 서로 다른 Provider의 검색량을 무조건 합산
- Legacy API를 영구 Source로 하드코딩
- Source 변경 시 과거 Snapshot 수정
- Raw Data 삭제 후 계산값만 보존
- 출처 없는 Excel Data를 공식 API Data로 변환
- Scraping을 Core Search Demand Source로 의존

---

# 70. Data Source 완료 기준

본 문서의 Source 구조는 다음 질문에 명확하게 답할 수 있어야 한다.

`달러 환율`이라는 Keyword가 있을 때:

- 이 Keyword는 어디에서 발견됐는가?
- 월간 PC 검색량은 어디에서 왔는가?
- 모바일 검색량은 어디에서 왔는가?
- Total은 Source 값인가 계산값인가?
- 문서수는 어떤 Search Vertical의 값인가?
- competition_ratio는 어떻게 만들어졌는가?
- Trend는 절대값인가 상대값인가?
- 자동완성에 실제로 나타났는가?
- 언제 수집했는가?
- 어떤 Collector Version이 수집했는가?
- 일부 Source가 실패했는가?

이 질문에 답할 수 없다면 Evidence 구조가 충분하지 않은 것으로 본다.

---

# 71. 최종 원칙

`GEO Search Evidence Collector`의 Source Layer는 많은 데이터를 모으는 시스템이 아니다.

목표는 다음과 같다.

**어디에서 왔는지 알 수 있는 데이터**

**언제 수집했는지 알 수 있는 데이터**

**원본과 계산값이 구분되는 데이터**

**다시 수집할 수 있는 데이터**

**Source가 바뀌어도 유지할 수 있는 데이터**

**Strategy Converter가 신뢰하고 사용할 수 있는 데이터**

최종 Source Flow는 다음과 같다.

OFFICIAL SOURCE  
→ RAW EVIDENCE  
→ NORMALIZATION  
→ DERIVED METRIC  
→ SEARCH EVIDENCE PACK  
→ STRATEGY CONVERTER

Search Evidence Collector는 검색 플랫폼이 제공하지 않은 사실을 만들어내지 않는다.

**Evidence를 수집한다.**

**출처를 보존한다.**

**계산값을 구분한다.**

**판단은 다음 시스템으로 넘긴다.**

---

# FACT CHECK LIST

- 2026년 현재 NAVER Search API와 Search Trend API는 기존 NAVER Developers 체계에서 NAVER Cloud Platform의 NAVER API HUB로 이관되는 과정에 있다.
- 기존 NAVER Developers의 해당 API는 신규 이용 신청이 중단되었으며, 기존 이용자에 대한 유예기간이 별도로 존재한다.
- NAVER API HUB는 Search API를 제공하며 Blog Search 등에서 검색 결과의 `total` 값을 반환한다.
- NAVER API HUB Search API에는 공식 호출 한도가 존재하므로 구현 시 최신 공식 명세를 다시 확인해야 한다.
- NAVER Search Ads API는 NAVER Search Advertiser 계정 및 API Manager를 통한 API 인증 구조를 제공한다.
- Search Trend 데이터는 절대 검색횟수와 동일하게 취급해서는 안 된다.
- Autocomplete, Related Search, 함께 많이 찾는 검색어의 안정적인 공식 API 제공 여부는 구현 시점에 별도로 검증해야 하며, 검증 전에는 SERP Observation 계층으로 취급한다.
- API Endpoint, 인증 방식, 호출 제한, 제공 필드는 변경될 수 있으므로 Leo의 실제 구현 직전에 공식 Documentation을 다시 확인한다.
