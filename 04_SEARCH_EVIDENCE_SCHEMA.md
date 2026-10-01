# GEO SEARCH EVIDENCE COLLECTOR
## SEARCH EVIDENCE SCHEMA

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: Search Evidence Data Schema

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`가 수집·저장·가공·Export하는 Search Evidence의 표준 데이터 구조를 정의한다.

`03_DATA_SOURCE_STANDARD.md`가

> 어디에서 데이터를 가져오는가?

를 정의한다면,

본 문서는

> 가져온 데이터를 어떤 구조로 저장하는가?

를 정의한다.

본 Schema의 목적은 다음과 같다.

- Source가 달라도 동일한 구조로 Evidence를 저장한다.
- RAW / NORMALIZED / DERIVED를 구분한다.
- Keyword와 Evidence를 분리한다.
- 검색량과 Trend를 분리한다.
- Search Entrance와 Search Demand를 분리한다.
- Missing과 0을 구분한다.
- Source와 Collection Date를 추적한다.
- Historical Snapshot을 보존한다.
- Strategy Converter가 사용할 수 있는 표준 데이터를 만든다.

---

# 2. Schema 최상위 원칙

모든 데이터는 다음 원칙을 따른다.

1. Keyword 자체와 Keyword에 대한 Evidence를 분리한다.
2. Source가 없는 Evidence를 생성하지 않는다.
3. RAW 값을 가능한 한 보존한다.
4. NORMALIZED 값은 RAW의 의미를 변경하지 않는다.
5. DERIVED 값은 계산값임을 명확하게 표시한다.
6. AI가 만든 값은 실제 Search Evidence와 분리한다.
7. Missing을 0으로 변환하지 않는다.
8. 수집 실패를 데이터 없음으로 처리하지 않는다.
9. Collection Date를 기록한다.
10. Provider를 기록한다.
11. 동일 Keyword에 여러 Source Evidence를 연결할 수 있어야 한다.
12. 과거 Snapshot을 최신 데이터로 덮어쓰지 않는다.

---

# 3. 최상위 데이터 구조

하나의 Search Evidence Collection은 다음 구조를 가진다.

Collection Job

→ Seed

→ Keywords

→ Evidence

→ Derived Metrics

→ Source Status

→ Errors

→ Export Metadata

개념적으로 다음과 같이 구성한다.

- collection
- seed
- keywords
- evidence
- derived_metrics
- sources
- errors
- export

---

# 4. Collection Job Schema

하나의 조사 실행은 하나의 `Collection Job`이다.

필수 필드:

| Field | Type | Required | Description |
|---|---|---:|---|
| collection_id | string | YES | Collection Job 고유 ID |
| seed_keyword | string | YES | 사용자가 입력한 Hub Seed Keyword |
| started_at | datetime | YES | 조사 시작 시각 |
| completed_at | datetime/null | NO | 조사 완료 시각 |
| status | enum | YES | Job 상태 |
| schema_version | string | YES | 사용 Schema Version |
| app_version | string/null | NO | 실행 Application Version |

Job Status:

- PENDING
- RUNNING
- SUCCESS
- PARTIAL_SUCCESS
- FAILED

---

# 5. Collection ID

모든 조사 실행에는 고유한 `collection_id`를 부여한다.

예:

`col_20260928_001`

실제 구현에서는 UUID 등을 사용할 수 있다.

중요한 것은 사람이 동일 Seed를 여러 번 조사했을 때 서로 다른 Collection을 구분할 수 있어야 한다는 것이다.

예:

달러 — 2026-09-28  
달러 — 2026-10-28

두 조사는 서로 다른 Collection이다.

---

# 6. Seed Schema

Seed는 사용자가 조사를 시작할 때 입력한 Keyword다.

필드:

| Field | Type | Required | Description |
|---|---|---:|---|
| raw_seed | string | YES | 사용자 입력 원문 |
| normalized_seed | string | YES | 시스템 정규화 값 |
| locale | string/null | NO | 검색 Locale |
| language | string/null | NO | Keyword 언어 |
| country | string/null | NO | 조사 국가 |
| provider_scope | array | NO | 조사 대상 Provider |

예:

raw_seed: 달러  
normalized_seed: 달러  
language: ko  
country: KR  
provider_scope: NAVER

---

# 7. Keyword Entity

Keyword는 Search Evidence의 중심 Entity다.

Keyword Entity 필드:

| Field | Type | Required | Description |
|---|---|---:|---|
| keyword_id | string | YES | Keyword 고유 ID |
| raw_keyword | string | YES | Source에서 발견된 원문 |
| normalized_keyword | string | YES | 정규화 Keyword |
| seed_keyword | string | YES | 출발 Seed |
| first_seen_at | datetime | YES | 최초 발견 시각 |
| discovery_sources | array | YES | Keyword 발견 Source |
| collection_id | string | YES | Collection 연결 |

---

# 8. Keyword 정규화

Keyword Normalization은 검색어 의미를 바꾸기 위한 작업이 아니다.

허용 가능한 기본 처리:

- 앞뒤 공백 제거
- 연속 공백 정리
- Unicode 정규화
- 시스템 비교를 위한 Canonical Form 생성

다음을 임의로 수행하지 않는다.

- 맞춤법 자동 수정
- 유사어 치환
- 띄어쓰기 의미 변경
- 단어 삭제
- Search Intent 변경
- AI 재작성

원문은 항상 보존한다.

---

# 9. Keyword 중복 판정

동일한 `normalized_keyword`가 여러 Source에서 발견될 수 있다.

예:

달러 환율

Search Ads Related  
Autocomplete  
Related Search

이 경우 Keyword Entity를 Source마다 새로 만드는 대신 하나의 Keyword에 여러 Discovery Evidence를 연결한다.

단, Source 원문이 다른 경우 RAW 값은 각각 보존한다.

---

# 10. Evidence Entity

모든 Search Evidence는 기본적으로 하나의 Evidence Entity로 저장한다.

공통 필드:

| Field | Type | Required | Description |
|---|---|---:|---|
| evidence_id | string | YES | Evidence 고유 ID |
| collection_id | string | YES | Collection Job |
| keyword_id | string | YES | 연결 Keyword |
| evidence_type | enum | YES | Evidence 종류 |
| evidence_layer | enum | YES | RAW/NORMALIZED/DERIVED 등 |
| source_id | string | YES | Source Identifier |
| source_type | enum | YES | Source Category |
| provider | string | YES | Provider |
| collection_method | enum | YES | 수집 방식 |
| collected_at | datetime | YES | 수집 시각 |
| status | enum | YES | Evidence 상태 |
| value | any/null | NO | 표준화 값 |
| raw_value | any/null | NO | Source 원본 값 |
| unit | string/null | NO | 단위 |
| metadata | object/null | NO | 추가 정보 |

## 10.1 Evidence ID Contract

`evidence_id`는 Canonical Evidence Record가 생성되는 시점에 발급한다.

- 필드명은 `evidence_id`를 사용한다.
- ID는 `ev_<collection_id>_<sequence>` 형태의 불투명 식별자로 한다.
- `<sequence>`는 해당 Collection 안에서 Evidence Record 생성 순서로 부여한다.
- 고유한 `collection_id`와 Collection 내부 순번의 조합으로 프로젝트 Canonical Storage 전체에서 고유해야 한다.
- 한 번 발급된 ID는 재수집·재처리 시 재사용하지 않는다.
- `collection_id`로 Collection과 연결한다.
- `keyword_id`와 `evidence_type`으로 Keyword와 Evidence 종류를 식별한다.
- Provider명이나 Provider 외부 ID를 ID 문자열에 포함하지 않는다.
- Credential, Secret, Signature 등 민감정보를 포함하지 않는다.

PC Search Volume과 Mobile Search Volume은 각각 별도의 Evidence Record와
별도의 `evidence_id`를 가진다. Evidence Type은 ID 문자열이 아니라
Evidence Record의 `evidence_type`으로 구분한다.

---

# 11. Evidence Layer

`evidence_layer`는 다음 값 중 하나를 사용한다.

## RAW

외부 Source가 제공한 원본 데이터.

## NORMALIZED

RAW 값을 GEO 공통 구조로 변환한 데이터.

## DERIVED

RAW 또는 NORMALIZED 값을 이용해 계산한 데이터.

## USER_PROVIDED

사용자가 직접 제공한 데이터.

## AI_DERIVED

AI가 Evidence를 기반으로 생성한 분류 또는 해석.

Search Evidence 판단에서는 RAW와 NORMALIZED가 핵심이다.

---

# 12. Source Type

`source_type`은 `03_DATA_SOURCE_STANDARD.md`와 일치시킨다.

허용 값:

- OFFICIAL_API
- OFFICIAL_PLATFORM_DATA
- SERP_OBSERVATION
- CALCULATED
- USER_PROVIDED
- AI_DERIVED

새로운 Source Type을 임의로 추가하지 않는다.

필요하면 Schema Version을 갱신한다.

---

# 13. Collection Method

기본 Collection Method:

- API
- OFFICIAL_UI
- SERP_OBSERVATION
- MANUAL_IMPORT
- FILE_IMPORT
- CALCULATION
- AI_PROCESSING

Source Type과 Collection Method는 서로 다른 개념이다.

예:

source_type: OFFICIAL_API  
collection_method: API

또는:

source_type: USER_PROVIDED  
collection_method: FILE_IMPORT

---

# 14. Evidence Type

기본 Evidence Type은 다음과 같다.

Search Demand:

- RELATED_KEYWORD
- MONTHLY_SEARCH_VOLUME_PC
- MONTHLY_SEARCH_VOLUME_MOBILE
- MONTHLY_SEARCH_VOLUME_TOTAL

Competition:

- SEARCH_RESULT_TOTAL
- PROVIDER_COMPETITION_VALUE
- COMPETITION_RATIO

Search Entrance:

- AUTOCOMPLETE
- RELATED_SEARCH
- CO_SEARCHED_KEYWORD

Trend:

- SEARCH_TREND

Discovery:

- KEYWORD_DISCOVERY

System:

- SOURCE_STATUS
- COLLECTION_ERROR

필요한 Evidence Type은 향후 추가할 수 있으나 기존 의미를 변경하지 않는다.

---

# 15. Search Volume Schema

PC 검색량:

evidence_type: MONTHLY_SEARCH_VOLUME_PC

필드:

- value
- raw_value
- unit
- provider
- source_id
- collected_at
- status

Mobile 검색량:

evidence_type: MONTHLY_SEARCH_VOLUME_MOBILE

동일 구조를 사용한다.

기본 단위는 Source 정의에 따른다.

임의로 `회`라는 단위를 부여하지 않는다.

---

# 16. Total Search Volume

Total Search Volume은 Source가 직접 제공할 수도 있고 시스템이 계산할 수도 있다.

Source 제공값인 경우:

evidence_layer: RAW 또는 NORMALIZED

시스템 계산값인 경우:

evidence_layer: DERIVED  
source_type: CALCULATED  
collection_method: CALCULATION

계산식:

`monthly_search_volume_total = monthly_search_volume_pc + monthly_search_volume_mobile`

기본 Formula Version:

`total_search_volume_v1`

계산 결과는 PC와 Mobile이 모두 유효한 정확한 Numeric 값일 때만 생성한다.
두 입력 Evidence의 `input_evidence_ids`를 Derived Metric에 연결하고,
`formula`, `formula_version`, `calculated_at`, `status`를 함께 기록한다.

두 입력이 모두 Numeric이면:

- `value`: PC + Mobile
- `status`: `EXACT`

여기서 `EXACT`와 `NOT_CALCULABLE`은 Total Search Volume Derived Metric의
계산 결과 상태다. 전체 Evidence Status 목록을 대체하지 않는다.

PC 또는 Mobile 중 하나라도 Provider 원본 값 `<10` 또는 `< 10`이면:

- `value`: `null`
- `status`: `NOT_CALCULABLE`
- 0, 5, 9, 10 또는 임의 대표값으로 변환하지 않는다.
- BOUNDED 결과를 생성하지 않는다.
- RAW와 NORMALIZED Evidence의 원문을 보존한다.

`<10`은 Missing, null, invalid와 같은 의미로 취급하지 않는다.

---

# 17. Search Volume Missing 처리

예:

PC = 500  
Mobile = Missing

이 경우 Total을 500으로 계산하지 않는다.

Total:

status: NOT_AVAILABLE  
value: null

필요하면 metadata에 이유를 기록한다.

예:

`mobile_volume_missing`

Missing 또는 null은 기존 `NOT_AVAILABLE` 규칙을 따른다.
Invalid 값은 Validation 실패로 처리하며 정상 Numeric으로 강제 변환하지 않는다.
Missing, null, invalid는 `<10` 특수값과 구분한다.

---

# 18. Search Volume 특수값

Source가 숫자가 아닌 특수값을 제공할 수 있다.

예:

- 미만값
- 범위값
- 비공개
- 제공 안 함

이 경우:

raw_value에 원문을 보존한다.

normalized value는 검증된 Rule이 있을 때만 생성한다.

임의로 숫자를 추정하지 않는다.

Total Search Volume 계산에서 `<10` 또는 `< 10` 특수값은
`NOT_CALCULABLE`로 처리한다. 범위값 또는 BOUNDED Metric은 사용하지 않는다.

---

# 19. Related Keyword Schema

Related Keyword는 Keyword Discovery Evidence다.

예:

Seed: 달러  
Discovered Keyword: 달러 환율

필드 후보:

- parent_keyword_id
- discovered_keyword_id
- position
- source_id
- collected_at
- raw_value
- status

Search Volume과 분리한다.

Related Keyword로 발견됐다고 해서 Search Demand가 높은 것으로 판단하지 않는다.

---

# 20. Autocomplete Schema

Autocomplete Evidence 필드:

| Field | Description |
|---|---|
| parent_keyword_id | 입력 Keyword |
| suggested_keyword_id | 자동완성 Keyword |
| position | 표시 순서 |
| provider | Search Provider |
| source_id | Source |
| collected_at | 수집 시각 |
| raw_value | 실제 표시 문자열 |
| status | 상태 |

Evidence Type:

`AUTOCOMPLETE`

---

# 21. Related Search Schema

Related Search Evidence 필드:

- parent_keyword_id
- related_keyword_id
- position
- provider
- source_id
- collected_at
- raw_value
- status

Evidence Type:

`RELATED_SEARCH`

자동완성과 Related Search를 동일 Type으로 합치지 않는다.

---

# 22. Co-searched Keyword Schema

함께 많이 찾는 검색어와 유사한 Search UI Evidence는 별도 Type으로 관리한다.

Evidence Type:

`CO_SEARCHED_KEYWORD`

필드:

- parent_keyword_id
- related_keyword_id
- position
- raw_label
- provider
- source_id
- collected_at
- status

UI의 실제 명칭은 `raw_label`로 보존할 수 있다.

---

# 23. Search Trend Schema

Trend Evidence는 Search Volume과 별도 구조로 저장한다.

기본 필드:

- keyword_id
- period_start
- period_end
- time_unit
- device
- gender
- age
- trend_points
- provider
- source_id
- collected_at

`trend_points`는 시계열 Array 형태를 사용할 수 있다.

각 Point:

- date
- ratio

Trend Ratio를 절대 검색량으로 변환하지 않는다.

---

# 24. Trend Time Unit

허용 가능한 기본 값:

- DATE
- WEEK
- MONTH

실제 Provider 지원 범위를 따른다.

Source가 지원하지 않는 Time Unit을 시스템에서 임의 생성하지 않는다.

---

# 25. Device

기본 Device 값:

- PC
- MOBILE
- ALL
- UNKNOWN

Provider가 Device를 구분하지 않는 경우 임의로 ALL이라고 가정하지 않는다.

의미가 불분명하면 UNKNOWN 또는 null을 사용한다.

---

# 26. Search Result Total Schema

검색결과 수 Evidence:

evidence_type: SEARCH_RESULT_TOTAL

필드:

- keyword_id
- provider
- search_vertical
- value
- raw_value
- source_id
- collected_at
- status

Canonical 기본 Search Result Total 계약:

- provider: `NAVER`
- product: `NAVER API HUB Web Document Search`
- search_vertical: `WEB`
- endpoint: `/search/v1/webkr`
- response_field: `total`

`value`는 특정 Query에 대한 NAVER Web Document Search의 총 검색 결과 수다.
Provider 원본 응답과 Source Provenance를 함께 보존한다.

이 기본값은 기존 GEO 정책의 복원이 아니라 2026-09-29부터 적용하는
`NEW_POLICY`다.

`BLOG`, `NEWS` 등 다른 Search Vertical의 `total`은 Canonical Document Count에
합산하지 않는다. 다른 Vertical이 필요하면 별도 `SEARCH_RESULT_TOTAL`
Evidence로 확장한다.

---

# 27. Search Vertical

Search Result Total을 저장할 경우 `search_vertical`을 필수로 한다.

예:

- BLOG
- NEWS
- CAFE
- WEB
- OTHER

Provider마다 지원 Vertical이 다를 수 있다.

Provider 원문 값도 필요하면 metadata에 보존한다.

---

# 28. Provider Competition Value

외부 Source가 자체 Competition 값을 제공하는 경우 별도 Evidence로 저장한다.

Evidence Type:

`PROVIDER_COMPETITION_VALUE`

필드:

- value
- raw_value
- provider
- source_id
- provider_metric_name
- collected_at

Provider의 Competition과 GEO의 `competition_ratio`를 같은 값으로 취급하지 않는다.

---

# 29. Competition Ratio

`competition_ratio`는 GEO Derived Metric이다.

기존 GEO Workflow와의 호환을 위해 기본 계산 구조는 다음과 같이 정의한다.

`competition_ratio = search_result_total / monthly_search_volume_total`

단, 실제 운영에서 기존 GEO 계산식이 다른 것으로 확인될 경우 기존 Source of Truth를 우선하고 Formula Version을 갱신한다.

위 구조는 계산 후보를 설명하는 계약이며, 기존 GEO Formula의 실제 Source of Truth가
확인되기 전까지 활성 계산식으로 확정하지 않는다. 현재 활성 상태는 다음과 같다.

```text
formula: NOT_CONFIGURED
formula_version: NOT_CONFIGURED
```

필수 조건:

- Search Result Total이 숫자여야 한다.
- Total Search Volume이 숫자여야 한다.
- Total Search Volume이 0보다 커야 한다.
- 두 값의 Provider와 조사 조건을 확인할 수 있어야 한다.

---

# 30. Competition Ratio Metadata

Competition Ratio에는 최소 다음 Metadata를 연결한다.

- numerator_metric
- numerator_value
- denominator_metric
- denominator_value
- formula
- formula_version
- calculated_at

예:

numerator_metric: SEARCH_RESULT_TOTAL  
denominator_metric: MONTHLY_SEARCH_VOLUME_TOTAL  
formula_version: v1

계산 결과만 단독 저장하지 않는다.

---

# 31. Formula Version

모든 중요한 Derived Metric은 Formula Version을 가질 수 있다.

예:

competition_ratio_v1

향후 공식이 변경되면:

competition_ratio_v2

과거 Snapshot을 새로운 공식으로 조용히 덮어쓰지 않는다.

필요하면 재계산 결과를 새로운 Derived Record로 생성한다.

---

# 32. Evidence Status

Evidence별 상태는 다음을 기본으로 한다.

- SUCCESS
- NO_RESULT
- NOT_PROVIDED
- NOT_SUPPORTED
- NOT_REQUESTED
- COLLECTION_FAILED
- PARSE_FAILED
- VALIDATION_FAILED

0은 Status가 아니다.

0이라는 실제 값이 Source에서 제공되면:

status: SUCCESS  
value: 0

으로 저장한다.

---

# 33. Null 원칙

`null`은 값이 없다는 의미다.

그러나 이유는 Status를 통해 설명해야 한다.

예:

value: null  
status: COLLECTION_FAILED

또는:

value: null  
status: NOT_PROVIDED

두 상황을 동일하게 취급하지 않는다.

---

# 34. Source Entity

각 Source는 별도의 Source Registry로 관리할 수 있다.

기본 필드:

| Field | Type | Description |
|---|---|---|
| source_id | string | Source 고유 ID |
| provider | string | Provider |
| product | string | API/Product |
| source_type | enum | Source Type |
| status | enum | Source 상태 |
| collection_method | enum | 수집 방식 |
| collector_version | string | Collector Version |
| official | boolean | 공식 Source 여부 |
| last_verified_at | datetime/null | 마지막 명세 확인일 |

---

# 35. Source ID

Source ID는 구체적으로 정의한다.

예:

- NAVER_SEARCH_ADS
- NAVER_API_HUB_SEARCH
- NAVER_API_HUB_SEARCH_TREND
- NAVER_SERP_AUTOCOMPLETE
- NAVER_SERP_RELATED

단순히 `NAVER`라고 저장하지 않는다.

---

# 36. Source Status

Source Registry 상태:

- ACTIVE
- EXPERIMENTAL
- LEGACY
- DEPRECATED
- DISABLED

과거 Collection의 Source Status를 현재 상태 때문에 수정하지 않는다.

---

# 37. Collector Status

하나의 Collection Job 안에서 Collector별 실행 상태를 저장한다.

필드:

- collector_id
- collector_version
- source_id
- started_at
- completed_at
- status
- result_count
- error_count

Status:

- PENDING
- RUNNING
- SUCCESS
- PARTIAL_SUCCESS
- FAILED
- SKIPPED

---

# 38. Error Schema

Error Record 기본 필드:

| Field | Required | Description |
|---|---:|---|
| error_id | YES | 오류 ID |
| collection_id | YES | Collection |
| collector_id | YES | Collector |
| source_id | YES | Source |
| error_type | YES | 오류 유형 |
| message | YES | 오류 내용 |
| occurred_at | YES | 발생 시각 |
| retryable | YES | 재시도 가능 여부 |
| keyword_id | NO | 관련 Keyword |
| raw_error | NO | 원본 오류 |

---

# 39. Error Type

기본 Error Type:

- AUTH_ERROR
- RATE_LIMIT
- TIMEOUT
- NETWORK_ERROR
- SOURCE_CHANGED
- PARSE_ERROR
- NO_RESULT
- VALIDATION_ERROR
- CONFIG_ERROR
- UNKNOWN_ERROR

`NO_RESULT`를 실제 시스템 오류와 구분할 필요가 있는 경우 Status와 Error Type의 역할을 구현 단계에서 세분화할 수 있다.

---

# 40. RAW Data Schema

RAW Data는 가능한 경우 별도 저장한다.

필드 후보:

- raw_id
- collection_id
- source_id
- collector_id
- request_reference
- response_status
- content_type
- payload
- collected_at

민감한 Credential은 저장하지 않는다.

---

# 41. Request Metadata

재현성을 위해 필요한 경우 요청 Metadata를 저장한다.

예:

- query
- parameters
- search_vertical
- device
- period
- locale

다음은 저장하지 않는다.

- Secret Key
- Client Secret
- Access Token
- Password

---

# 42. Derived Metric Schema

Derived Metric 기본 필드:

- metric_id
- collection_id
- keyword_id
- metric_type
- value
- unit
- formula
- formula_version
- input_evidence_ids
- calculated_at
- status

`input_evidence_ids`를 통해 어떤 Evidence에서 계산되었는지 추적할 수 있도록 한다.

Evidence Record는 기존 `metadata` 안의 `RAW_REFERENCE` 또는 RAW Record
참조를 통해 원본 Snapshot으로 연결할 수 있어야 한다. Evidence의
`provider`, `source_id`, `collected_at`과 RAW Reference를 함께 보존하여
다음 경로를 유지한다.

`Derived Metric → input_evidence_ids → Evidence → RAW_REFERENCE → RAW Snapshot → Source Provenance`

## 42.1 Derived Metric Repository Contract

Derived Metric은 RAW Evidence나 Export 결과가 아닌 Snapshot의 Canonical
Derived Metric Record로 저장한다.

- Repository 책임: `DerivedMetricRepository`
- Snapshot 연결 책임: `SnapshotRepository`
- 기존 단일 Source Snapshot 저장 위치: `data/snapshots/<collection_id>.json`
- 새 Multi-Source Collection Snapshot 저장 위치: `data/snapshots/<collection_id>/v<snapshot_version>.json`
- 저장 형식: JSON
- 저장 단위: Collection Snapshot 1개 파일 안의 `derived_metrics` 배열
- RAW는 `data/raw/`에 그대로 보존한다.
- Export는 `data/exports/`에 별도 Projection으로 저장하며 Canonical 저장소로 사용하지 않는다.

`metric_id`는 `metric_<collection_id>_<sequence>` 형태의 불투명 식별자로
한다. `<sequence>`는 해당 Collection 안에서 Derived Metric Record 생성
순서로 부여한다. `metric_id`는 Snapshot 전체에서 고유해야 하며,
`collection_id`와 `keyword_id`를 Record 필드로 함께 저장한다.

하나의 Collection Snapshot에 같은 `metric_id`를 덮어쓰지 않는다.
동일 Seed의 새로운 조사 실행은 기존 Snapshot을 수정하지 않고 새로운 Collection과
Snapshot을 생성한다. 동일 Collection에서 실패한 Source만 Retry하는 경우에는
기존 `collection_id`를 유지하고 83.5와 83.7의 규칙에 따라 새로운 Snapshot Version을
생성한다.

하나의 Keyword 또는 Metric Record 저장 실패가 같은 Collection의 다른
정상 Derived Metric Record 저장을 중단시키지 않도록 한다. 실패 원인은
기존 Error Record로 Snapshot의 `errors`에 보존한다.

### Derived Metric Record 저장 상태

정상 Numeric + Numeric 계산은 다음 Record로 저장한다.

- `value`: 계산 결과
- `status`: `EXACT`
- `input_evidence_ids`: PC Evidence ID, Mobile Evidence ID

`<10` 또는 `< 10`이 포함되어 계산할 수 없는 경우에도 계산 불가능하다는
사실과 입력 Lineage를 보존하기 위해 Derived Metric Record를 저장한다.

- `value`: `null`
- `status`: `NOT_CALCULABLE`
- `input_evidence_ids`: 해당 PC/Mobile Evidence ID

Missing 또는 null은 기존 `NOT_AVAILABLE` 정책을 따른다. Invalid는
Validation Failure와 Error Record로 처리하며 정상 Derived Metric으로
강제 저장하지 않는다.

---

# 43. Provenance Chain

중요한 Derived Metric은 다음 Chain을 추적할 수 있어야 한다.

DERIVED METRIC

→ NORMALIZED EVIDENCE

→ RAW EVIDENCE

→ SOURCE

예:

competition_ratio

→ total_search_volume + search_result_total

→ PC volume + Mobile volume + Search API result

→ NAVER Search Ads + NAVER Search API

이 연결이 끊어지지 않도록 한다.

---

# 44. Snapshot Schema

하나의 Collection Job 자체가 기본 Snapshot 역할을 한다.

필요한 경우 별도 Snapshot Entity를 둘 수 있다.

필드:

- snapshot_id
- collection_id
- seed_keyword
- captured_at
- keyword_count
- evidence_count
- source_summary
- status

초기 구현에서는 Collection과 Snapshot을 불필요하게 중복 생성하지 않아도 된다.

---

# 45. Historical Comparison

Historical Comparison은 기존 Snapshot을 수정하지 않고 두 Collection을 비교하여 생성한다.

예:

Collection A  
2026-09-28

Collection B  
2026-10-28

비교 결과:

- Search Volume Change
- Keyword Added
- Keyword Removed
- Search Entrance Change
- Competition Ratio Change

Comparison 결과는 새로운 DERIVED 데이터다.

---

# 46. Search Evidence Pack Schema

Strategy Converter에 전달하는 `SEARCH EVIDENCE PACK`의 기본 구조는 다음과 같다.

## METADATA

- pack_version
- collection_id
- generated_at
- schema_version

## HUB SEED

- raw_seed
- normalized_seed

## COLLECTION

- started_at
- completed_at
- status

## KEYWORDS

각 Keyword:

- keyword
- discovery_sources

## SEARCH DEMAND

- PC Search Volume
- Mobile Search Volume
- Total Search Volume

## COMPETITION

- Search Result Total
- Search Vertical
- Provider Competition Value
- Competition Ratio

## SEARCH ENTRANCE

- Autocomplete
- Related Search
- Co-searched Keyword

## TREND

- Period
- Time Unit
- Trend Points

## SOURCES

- Source ID
- Provider
- Source Type
- Collection Method
- Collector Version

## ERRORS

- Failed Source
- Error Type
- Message

---

# 47. Search Evidence Pack 원칙

Evidence Pack은 원본 Database 전체 Dump가 아니다.

Strategy Converter가 필요한 Search Evidence를 전달하는 Handoff Format이다.

그러나 다음 정보는 잃지 않는다.

- Source
- Collection Date
- Status
- RAW/DERIVED 구분
- Missing
- Error

---

# 48. Strategy Converter Input

Strategy Converter용 Markdown Export에서는 사람이 읽기 쉬운 Table을 생성할 수 있다.

대표 Table:

| Keyword | PC | Mobile | Total | Documents | Competition Ratio | Autocomplete | Related |
|---|---:|---:|---:|---:|---:|---|---|

그러나 Table만 전달하지 않는다.

함께 전달:

- Hub Seed
- Collection Date
- Provider
- Source Status
- Search Vertical
- Formula Version
- Missing Data
- Collection Errors

숫자의 맥락을 잃지 않는다.

---

# 49. JSON Export Schema

JSON Export는 내부 데이터 전달과 향후 자동 Pipeline을 위한 표준 형식이다.

최상위 구조 예:

collection  
seed  
keywords  
evidence  
derived_metrics  
sources  
errors

JSON의 실제 Field Naming Convention은 구현 단계에서 하나로 통일한다.

권장:

`snake_case`

---

# 50. CSV Export

CSV는 Keyword 중심의 Flat View를 제공한다.

대표 Column:

- keyword
- monthly_search_pc
- monthly_search_mobile
- monthly_search_total
- search_result_total
- search_vertical
- competition_ratio
- autocomplete
- related_search
- source
- collected_at
- status

Nested Evidence는 CSV에서 완벽하게 표현하기 어렵다.

따라서 CSV는 Convenience Export로 사용하고 Canonical Data Format으로 사용하지 않는다.

---

# 51. XLSX Export

XLSX는 기존 GEO Workflow와 사람 검토를 위한 Export다.

권장 Sheet:

## SUMMARY

Keyword별 핵심 지표

## EVIDENCE

Evidence별 상세 데이터

## SOURCES

Source Registry 정보

## ERRORS

수집 오류

## RAW_REFERENCE

필요한 경우 Raw Data Reference

MVP에서는 단순화할 수 있다.

---

# 52. Markdown Export

Markdown은 ChatGPT 및 GEO GPT Workflow에 전달하기 위한 핵심 Export 형식이다.

권장 구성:

- Collection Metadata
- Hub Seed
- Keyword Data
- Search Entrance
- Search Trend
- Source Summary
- Error Summary
- Derived Metric Notes

Markdown 생성 과정에서 원본 값을 임의로 요약하거나 해석하지 않는다.

---

# 53. Boolean Evidence

Autocomplete 또는 Related Search 존재 여부를 Table에서 Boolean으로 표현할 수 있다.

예:

autocomplete: true

그러나 내부에는 가능하면 실제 Evidence Record를 보존한다.

즉 단순히:

autocomplete = true

만 저장하지 않는다.

다음 정보도 보존한다.

- 어떤 Seed에서 발견됐는가
- 몇 번째 위치였는가
- 언제 발견됐는가
- 어떤 Source였는가

---

# 54. Position

Search Entrance Evidence는 가능한 경우 `position`을 저장한다.

예:

Autocomplete Position: 3

Position은 검색량을 의미하지 않는다.

단지 해당 수집 시점의 UI 위치 Evidence다.

---

# 55. Date / Time Standard

모든 시스템 Timestamp는 일관된 형식으로 저장한다.

권장:

ISO 8601

예:

`2026-09-28T20:30:00+09:00`

Database 내부 UTC 저장 여부는 구현 단계에서 결정할 수 있다.

그러나 Export 시 시간대가 불분명한 Timestamp를 만들지 않는다.

---

# 56. Numeric Type

검색량, Result Count 등 숫자는 가능한 경우 Numeric Type으로 저장한다.

문자열 `"1000"`과 숫자 `1000`을 혼합하지 않는다.

단, Source가 특수 문자열을 제공하면:

raw_value = 원문  
value = null 또는 검증된 Normalized Value

형태로 처리한다.

---

# 57. Precision

Derived Metric의 소수점 자릿수는 계산과 표시를 분리한다.

Database:

가능한 원 계산값 보존

UI / Export:

정해진 표시 자릿수 적용

표시를 위해 원 계산값 자체를 잘라 저장하지 않는다.

---

# 58. Data Validation

Normalization 이후 최소 Validation을 수행한다.

예:

- Keyword가 비어 있지 않은가
- Search Volume이 음수가 아닌가
- Collection Date가 존재하는가
- Source ID가 존재하는가
- Search Result Total에 Vertical이 있는가
- Derived Metric에 Input Evidence가 있는가
- Trend Ratio가 Search Volume Type으로 저장되지 않았는가

Validation 실패 시 원본 RAW는 삭제하지 않는다.

---

# 59. Schema Validation Failure

Schema Validation 실패 시:

RAW Evidence: 보존

Normalized Evidence: 실패 처리

Status:

`VALIDATION_FAILED`

Error Record:

생성

잘못된 데이터를 정상값으로 강제 변환하지 않는다.

---

# 60. Backward Compatibility

Schema Version이 변경되어도 기존 Snapshot을 읽을 수 있도록 한다.

예:

schema_version: 1.0

향후:

schema_version: 1.1  
schema_version: 2.0

기존 데이터를 무조건 최신 Schema로 덮어쓰지 않는다.

Migration이 필요하면 별도 과정으로 처리한다.

---

# 61. Schema Version 변경 기준

다음은 Minor 변경 후보:

- Optional Field 추가
- 새로운 Evidence Type 추가
- Metadata 확장

다음은 Major 변경 후보:

- 기존 Field 의미 변경
- Core Entity 관계 변경
- 기존 Evidence Type 의미 변경
- 호환되지 않는 구조 변경

---

# 62. Manual Import Schema

기존 Excel 또는 사용자 제공 데이터를 Import할 경우 가능한 한 동일한 공통 Schema로 변환한다.

예:

기존 Column:

연관키워드  
월간검색수_PC  
월간검색수_모바일  
총검색수  
총문서수  
경쟁정도_ratio

Mapping:

연관키워드  
→ normalized_keyword

월간검색수_PC  
→ MONTHLY_SEARCH_VOLUME_PC

월간검색수_모바일  
→ MONTHLY_SEARCH_VOLUME_MOBILE

총검색수  
→ MONTHLY_SEARCH_VOLUME_TOTAL

총문서수  
→ SEARCH_RESULT_TOTAL

경쟁정도_ratio  
→ COMPETITION_RATIO

단, Source를 확인할 수 없는 기존 값은 `USER_PROVIDED`로 유지한다.

---

# 63. Legacy Data 주의

기존 Excel의 `총문서수`가 어떤 Search Vertical에서 수집됐는지 확인할 수 없는 경우:

search_vertical: UNKNOWN

으로 저장할 수 있다.

이를 새로운 공식 API의 BLOG Search Result Total과 동일한 데이터라고 가정하지 않는다.

---

# 64. Preferred Value

동일 Metric에 여러 Source가 있을 경우 UI에서 대표값 하나를 보여줄 필요가 있을 수 있다.

이 경우:

`preferred_value`

개념을 둘 수 있다.

그러나 Preferred Value는 원본 Evidence를 삭제하거나 대체하지 않는다.

Preferred Rule에는 다음을 기록한다.

- selected_evidence_id
- selection_rule
- rule_version

MVP에서 필요하지 않으면 구현을 미룬다.

---

# 65. Data Lineage

최종적으로 사용자는 특정 숫자를 클릭하거나 추적했을 때 다음 질문에 답할 수 있어야 한다.

이 숫자는 무엇인가?

↓

어떤 Metric인가?

↓

RAW인가 DERIVED인가?

↓

어느 Source에서 왔는가?

↓

언제 수집됐는가?

↓

어떤 Collector가 가져왔는가?

↓

계산값이면 어떤 Evidence로 계산했는가?

이 구조를 `Data Lineage`의 기본 요구사항으로 한다.

---

# 66. Schema에서 금지하는 것

다음을 금지한다.

- Keyword Row 하나에 모든 Source 데이터를 출처 없이 덮어쓰기
- Missing을 0으로 저장
- API 실패를 검색량 0으로 저장
- PC와 Mobile 중 하나가 없는데 Total을 임의 계산
- Trend Ratio를 Search Volume으로 저장
- Search Result Total에 Vertical 미기록
- Provider Competition과 GEO Competition Ratio 혼합
- AI 추정값을 RAW로 저장
- Derived Metric의 계산 근거 삭제
- Source Identifier 없는 Evidence 저장
- Collection Date 없는 동적 Evidence 저장
- 최신 Snapshot으로 과거 Snapshot 덮어쓰기
- Raw Data 삭제 후 Normalized 값만 보존

---

# 67. MVP 최소 Schema

MVP 1에서는 전체 Schema 중 다음을 우선 구현한다.

## Collection

- collection_id
- seed_keyword
- started_at
- completed_at
- status
- schema_version

## Keyword

- keyword_id
- raw_keyword
- normalized_keyword
- discovery_sources

## Search Demand

- monthly_search_pc
- monthly_search_mobile
- monthly_search_total

## Competition

- search_result_total
- search_vertical
- competition_ratio

## Provenance

- provider
- source_id
- collected_at
- collector_version

## Status

- evidence_status
- collector_status

## Error

- error_type
- message

## Raw

- raw_response 또는 raw_reference

이 구조로 실제 End-to-End 수집을 먼저 완성한다.

---

# 68. Phase 2 Schema 확장

Phase 2에서 추가:

- AUTOCOMPLETE
- RELATED_SEARCH
- CO_SEARCHED_KEYWORD
- position
- raw_label
- Search Entrance 관계

---

# 69. Phase 3 Schema 확장

Phase 3에서 추가:

- SEARCH_TREND
- period_start
- period_end
- time_unit
- device
- gender
- age
- trend_points

---

# 70. Phase 4 Schema 확장

Phase 4에서 추가:

- Historical Comparison
- Snapshot Comparison
- Search Demand Change
- Search Entrance Change
- Strategy Converter Handoff Metadata

---

# 71. Phase 5 Schema 확장

새 Provider가 추가될 경우 기존 Core Schema를 최대한 유지한다.

추가되는 핵심 정보:

- provider
- source_id
- search_surface

Provider-specific 값은 metadata 또는 별도 Provider Extension에 저장한다.

Core Schema에 Provider 전용 필드를 무분별하게 추가하지 않는다.

---

# 72. Schema와 Architecture 관계

Schema는 Architecture의 중앙 계약 역할을 한다.

Collector

→ Schema

Storage

→ Schema

UI

→ Schema

Exporter

→ Schema

Strategy Converter Adapter

→ Schema

각 Module이 서로의 내부 구현을 직접 의존하지 않고 공통 Schema를 통해 연결되도록 한다.

---

# 73. Schema와 Workflow 관계

`05_WORKFLOW.md`는 본 Schema를 사용해 다음 과정을 정의한다.

Seed 입력

→ Collection 생성

→ Keyword 발견

→ Evidence 수집

→ RAW 저장

→ Normalization

→ Validation

→ Derived Metric 계산

→ Snapshot 저장

→ Review

→ Export

Workflow에서 새로운 데이터가 필요해지면 먼저 기존 Schema로 표현 가능한지 확인한다.

---

# 74. Search Evidence Record 예시

개념 예시:

Keyword:

달러 환율

Search Demand:

PC Search Volume  
→ Official Source Evidence

Mobile Search Volume  
→ Official Source Evidence

Total Search Volume  
→ DERIVED

Competition:

Search Result Total  
→ Official Search Source

Competition Ratio  
→ DERIVED

Search Entrance:

Autocomplete  
→ SERP Observation

Related Search  
→ SERP Observation

Trend:

Search Trend  
→ Official Trend Source

각 값은 하나의 거대한 Row가 아니라 서로 출처를 가진 Evidence로 존재한다.

UI에서는 이를 한 Row로 조합해 보여줄 수 있다.

---

# 75. UI Projection

Database Schema와 화면 Table은 동일할 필요가 없다.

내부:

여러 Evidence Record

↓

UI Projection

↓

Keyword 한 줄

예:

| Keyword | PC | Mobile | Total | Documents | Ratio |
|---|---:|---:|---:|---:|---:|
| 달러 환율 | X | Y | X+Y | Z | Z/(X+Y) |

UI가 한 줄이라고 해서 내부 데이터까지 하나의 Flat Row로 저장하지 않는다.

---

# 76. Export Projection

CSV나 XLSX 역시 내부 Canonical Schema의 Projection이다.

Canonical Data:

Collection + Keyword + Evidence + Derived Metrics

↓

Export Projection

↓

CSV / XLSX / Markdown

Export 형식 때문에 Core Schema를 단순화하지 않는다.

---

# 77. Canonical Data

GEO Search Evidence Collector의 Canonical Data는 Excel 파일이 아니다.

Canonical Data는 다음 관계 구조다.

Collection

→ Keyword

→ Evidence

→ Source

→ Derived Metric

→ Error

Excel, Markdown, CSV는 모두 이 Canonical Data에서 생성되는 Output이다.

---

# 78. Strategy Converter Boundary

Schema는 Strategy Converter가 Search Evidence를 해석할 수 있도록 충분한 정보를 제공한다.

그러나 다음 Field를 Search Evidence의 확정값으로 만들지 않는다.

- Final Search Intent
- Final User Question
- Evergreen Knowledge
- Knowledge Node
- Hub Decision
- Article Title
- Content Priority

이 판단은 Strategy Converter 및 후속 GEO Layer의 역할이다.

## Research Artifact와 Evidence Artifact의 분리

Canonical Evidence Schema는 기존 Evidence의 수집·정규화·검증·Provenance
계약을 유지한다. 08의 다음 구조는 Canonical Evidence와 구분되는
Research Artifact로 취급한다.

- Research Context
- Research Direction
- Research Seed
- Gate Decision
- Deep Research Target
- Grounded Question Link
- Search Demand Cluster
- Hypothesis Verification
- Evidence Compression Projection
- Final Planner Handoff

Research Artifact는 기존 RAW, Canonical Evidence, Derived Metric, Snapshot을
대체하거나 삭제하지 않으며, 가능한 경우 기존 Evidence ID와 Source Provenance를
참조한다.

현재 Review Selection 기반 Handoff는 Intermediate Handoff다. 08의 Final
Planner Handoff는 별도의 최종 Planner용 Projection이며, 기존 Handoff Artifact의
의미를 소급 변경하지 않는다.

---

# 79. AI Boundary

Schema에는 향후 AI 분석 결과를 저장할 수 있다.

그러나 반드시 다음을 구분한다.

Search Evidence

vs

AI Interpretation

AI 결과 예:

- intent_candidate
- duplicate_candidate
- anomaly_flag
- classification_candidate

이 값은 `AI_DERIVED` Layer에 저장한다.

---

# 80. Schema 완료 기준

본 Schema를 사용하면 `달러` 조사 결과에서 다음 질문에 모두 답할 수 있어야 한다.

- 조사 Seed는 무엇이었는가?
- 언제 조사했는가?
- 어떤 Keyword가 발견됐는가?
- 각 Keyword는 어디에서 발견됐는가?
- PC 검색량은 얼마인가?
- Mobile 검색량은 얼마인가?
- Total은 Source 값인가 계산값인가?
- 검색결과 수는 어떤 Vertical인가?
- Competition Ratio는 어떤 공식으로 계산했는가?
- 자동완성에 있었는가?
- 관련검색어에 있었는가?
- Trend는 어떤 기간의 값인가?
- Source는 무엇인가?
- Collector Version은 무엇인가?
- 실패한 Source가 있는가?
- Missing인지 실제 0인지 구분되는가?
- 과거 Snapshot을 다시 확인할 수 있는가?

하나라도 구조적으로 추적할 수 없다면 Schema를 보완한다.

---

# 81. 최종 정의

`GEO Search Evidence Schema`는 단순 Keyword Table 규격이 아니다.

이 Schema는

**Keyword와 Search Evidence의 관계**

**Evidence와 Source의 관계**

**RAW와 DERIVED의 관계**

**현재 데이터와 Historical Snapshot의 관계**

를 보존하는 GEO Search Intelligence의 기본 데이터 계약이다.

핵심 구조는 다음과 같다.

COLLECTION

→ KEYWORD

→ EVIDENCE

→ SOURCE

→ DERIVED METRIC

→ SNAPSHOT

→ SEARCH EVIDENCE PACK

그리고 모든 데이터는 최종적으로 다음 질문에 답할 수 있어야 한다.

> 이 값은 어디에서 왔는가?

> 언제 수집됐는가?

> 원본인가 계산값인가?

> 계산값이라면 무엇으로 계산했는가?

> 실패와 0을 구분할 수 있는가?

> 나중에 다시 검증할 수 있는가?

이 질문에 답할 수 있는 구조만 GEO Search Evidence로 인정한다.

---

# FACT CHECK LIST

- Keyword와 Evidence를 분리한다.
- RAW / NORMALIZED / DERIVED를 분리한다.
- Source ID와 Collection Date를 보존한다.
- 검색량과 Search Trend를 별도 Evidence Type으로 관리한다.
- PC와 Mobile 검색량이 모두 유효할 때만 Derived Total을 계산한다.
- Missing과 실제 0을 구분한다.
- Search Result Total에는 Search Vertical을 연결한다.
- Provider가 제공하는 Competition 값과 GEO Derived Competition Ratio를 분리한다.
- Derived Metric에는 계산식과 Formula Version을 연결한다.
- Derived Metric에서 원본 Evidence까지 Provenance Chain을 추적할 수 있게 한다.
- Search Entrance Evidence에는 가능한 경우 Position과 수집시점을 저장한다.
- Historical Collection은 최신 Collection으로 덮어쓰지 않는다.
- CSV, XLSX, Markdown은 Canonical Data가 아니라 Export Projection으로 취급한다.
- Strategy Converter의 판단 결과를 Search Evidence 원본 Schema에 혼합하지 않는다.
- AI가 생성한 값은 AI_DERIVED로 분리한다.

---

# 83. Multi-Source Collection Contract

## 83.1 Collection의 의미와 생성 책임

`Collection`은 하나의 Hub Seed Keyword에 대한 하나의 Hub Research Session이자
하나의 `Collection Job`이다.

- Collection ID는 상위 Application / Collection Orchestrator가 조사 시작 시 한 번만 생성한다.
- Collector는 Collection ID를 생성하지 않는다.
- 모든 Source Collector는 Orchestrator가 전달한 동일한 `collection_id`를 사용한다.
- 동일 Seed를 새로 조사하면 새로운 Collection과 새로운 Snapshot을 생성한다.
- 기존 Historical Collection과 Snapshot은 수정하거나 재사용하지 않는다.

별도의 Research Session, Batch, Parent Run Entity는 현재 추가하지 않는다.
Collection 자체가 Hub Research Session의 실행 단위다.

## 83.2 Source Run

Source별 실제 실행 시도는 Collection 내부의 Source Run 기록으로 구분한다.
Source Run은 별도의 상위 Entity가 아니다.

최소 필드:

- `source_run_id`
- `collection_id`
- `source_id`
- `provider`
- `product`
- `search_vertical`
- `started_at`
- `collected_at`
- `status`
- `raw_reference`
- `error_reference`

Source Run ID의 권장 형식은 다음과 같다.

```text
sr_<collection_id>_<sequence>
```

`source_run_id`는 Collection Orchestrator가 Collection 내부 순서에 따라 발급한다.

## 83.3 Multi-Source RAW Storage

새로 생성되는 Collection부터 RAW Physical Storage는 다음 구조를 사용한다.

```text
data/raw/<collection_id>/<source_run_id>.json
```

- Source Run별 RAW를 독립 저장한다.
- Source 간 RAW를 overwrite하지 않는다.
- Retry RAW도 기존 RAW를 overwrite하지 않는다.
- Provider Original RAW Response와 Source Provenance를 보존한다.
- `source_run_id`, `collection_id`, `collected_at`, `status`를 추적할 수 있어야 한다.
- Credential, Secret, Signature, Authorization Header 값은 저장하지 않는다.
- RAW Payload 자체는 RAW Repository에만 저장한다.
- Snapshot에는 RAW Payload를 복제하지 않고 `raw_reference`와 Provenance로 연결한다.

기존 `data/raw/<collection_id>.json` 파일은 Historical RAW로 취급하며 이동·수정·병합·이름 변경·Migration하지 않는다.

## 83.4 Partial Failure

Source Run status는 다음 값을 사용한다.

- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILED`

Collection status는 기존 상태 모델을 유지하며 다음 의미를 갖는다.

- 모든 필수 Source 성공: `SUCCESS`
- 일부 Source 성공 및 일부 Source 실패: `PARTIAL_SUCCESS`
- 모든 필수 Source 실패: `FAILED`

Source 하나가 실패해도 성공한 Source의 RAW와 Evidence는 폐기하지 않는다.
실패 Source는 Error Registry에 기록하며 fallback 값이나 임의 Evidence를 생성하지 않는다.

## 83.5 Retry

실패한 Source만 Retry할 수 있다.

- 기존 `collection_id`를 유지한다.
- 새로운 `source_run_id`를 발급한다.
- 기존 Source Run과 Error Record를 보존한다.
- 기존 RAW를 overwrite하지 않는다.
- Retry RAW는 별도 Source Run RAW로 저장한다.
- Retry 성공 결과는 새로운 Evidence ID를 발급한다.
- 기존 실패 Evidence를 임의 수정하지 않는다.

Retry는 새로운 Hub 조사 실행이 아니라 동일 Collection의 미완성 Source를 다시 실행하는 것이다.

## 83.6 Evidence와 Derived Metric Sequence

Evidence와 Derived Metric Sequence는 Collection 단위로 관리한다.

- Collection Orchestrator가 Collection 단위 ID Generator를 소유한다.
- Evidence Sequence와 Metric Sequence는 독립적으로 관리한다.
- Source별 Collector는 Sequence를 초기화하지 않는다.
- 모든 Source는 동일 Collection Sequence 공간을 사용한다.
- Retry 결과도 기존 Sequence 이후부터 계속 발급한다.
- Provider 외부 ID를 내부 ID에 포함하지 않는다.

형식:

```text
ev_<collection_id>_<sequence>
metric_<collection_id>_<sequence>
```

## 83.7 Snapshot

하나의 Collection Snapshot에는 최소 다음을 연결한다.

- Collection metadata
- Hub Seed Keyword
- Source Runs
- Canonical Evidence
- Derived Metrics
- Errors
- RAW References
- Source Provenance

RAW Payload 자체는 Snapshot에 중복 저장하지 않는다.

Retry 등으로 Collection 상태가 변경되면 기존 Snapshot을 overwrite하지 않고
새 Snapshot Version을 생성한다.

새 Multi-Source Collection의 Snapshot Version은 다음 구조를 사용한다.

```text
data/snapshots/<collection_id>/v<snapshot_version>.json
```

Version 규칙:

- 최초 Snapshot은 `v1`이다.
- 같은 Collection의 후속 물질화는 `v2`, `v3`처럼 단조 증가하는 정수 Version을 사용한다.
- 이미 사용한 Version은 재사용하지 않는다.
- 기존 `data/snapshots/<collection_id>.json` 파일은 Historical Snapshot으로 보존한다.

## 83.8 SEARCH EVIDENCE PACK과 GEO Handoff

SEARCH EVIDENCE PACK은 서로 다른 Collection을 사후 병합해서 만들지 않는다.
하나의 Collection Snapshot을 기준으로 생성한다.

동일 Collection lineage 안에서 다음을 추적할 수 있어야 한다.

- Search Demand
- PC Search Volume
- Mobile Search Volume
- Total Search Volume
- Provider Competition Evidence
- `SEARCH_RESULT_TOTAL`
- 향후 Derived Metrics
- Source Provenance
- RAW References
- Partial Failure 정보

GEO Handoff는 이 Pack을 소비하며 새로운 Evidence를 임의 생성하지 않는다.

## 84. SEARCH EVIDENCE PACK Scope Contract

### 84.1 Keyword Scope

SEARCH EVIDENCE PACK은 하나의 Collection에 속한 Hub Seed Keyword 1개와 Search Ads Keyword Discovery에서 발견되고 Normalization과 Validation을 통과한 Related Keyword 전체를 포함한다. 이는 Hub Seed만 포함하는 모델이 아니라 Hub Seed와 Related Keyword 전체를 함께 보존하는 Model C이다.

Hub Seed와 Related Keyword는 같은 Keyword로 취급하지 않는다. Hub Seed는 Collection의 시작점이며, Related Keyword는 해당 Hub Seed에서 발견된 Keyword Discovery 결과다.

### 84.2 Canonical Keyword Record

Pack 구현을 위해 Collection 단위의 Canonical Keyword Record를 사용한다. 기존 Keyword Entity의 필드명을 우선 재사용하며, 기존 `raw_keyword`와 `normalized_keyword`가 있는 경우 의미가 같은 별도 `keyword` 필드를 중복 생성하지 않는다.

최소 의미는 다음과 같다.

- `keyword_id`
- `collection_id`
- `raw_keyword`
- `normalized_keyword`
- `keyword_role`: `HUB_SEED` 또는 `RELATED_KEYWORD`
- `discovered_from`: Related Keyword의 경우 발견을 시작한 Hub Seed Keyword의 `keyword_id`; Hub Seed는 null
- `discovery_sources` 또는 Source Run 참조
- `status`

Search Ads의 Hub Seed Record는 `HUB_SEED`이고, Search Ads에서 발견된 Record는 `RELATED_KEYWORD`이다. Related Keyword의 Discovery 관계와 Source Run을 추적할 수 있어야 한다.

기존 Evidence와 Derived Metric의 `keyword_id`는 이 Keyword Record를 참조한다. 기존 Evidence ID 또는 Metric ID를 버리거나 재생성하지 않는다.

### 84.3 Search Demand Pack Coverage

Search Demand 영역은 Search Ads에서 정상적으로 수집·정규화·검증된 모든 Keyword를 포함한다. 각 Keyword에 대해 가능한 범위에서 PC Search Volume, Mobile Search Volume, Provider Competition Evidence, Total Search Volume Derived Metric, Evidence/Metric status, Source Provenance, RAW Reference를 연결한다.

Total Search Volume의 `EXACT` 및 `NOT_CALCULABLE` 정책은 기존 Derived Metric 계약을 그대로 따른다. Pack은 계산식을 새로 만들거나 원본 값을 추정하지 않는다.

### 84.4 WEB SEARCH_RESULT_TOTAL Scope

현재 Collection 계약에서 WEB `SEARCH_RESULT_TOTAL`은 Hub Seed Keyword에 대해서만 1건 수집한다. Related Keyword별 WEB `SEARCH_RESULT_TOTAL`은 현재 수집 범위에 포함하지 않으며, 이 상태를 실패나 Missing 값으로 바꾸지 않는다.

따라서 현재 Pack에서 Hub Seed의 WEB `SEARCH_RESULT_TOTAL` Coverage는 실제 수집 결과의 상태를 따르고, Related Keyword의 WEB `SEARCH_RESULT_TOTAL` Coverage는 `NOT_COLLECTED`이다. Related Keyword 1개마다 WEB API를 호출하거나 Blog/News/Web 결과를 합산하는 정책은 이 계약에 포함하지 않는다.

### 84.5 Pack Coverage Status

`NOT_COLLECTED`는 전역 Evidence Status 목록을 확장하는 값이 아니라 Pack이 Source Coverage를 표현하기 위한 `coverage_status` 값이다. 다음 값은 서로 구분한다.

- `AVAILABLE`: 해당 Evidence 또는 Metric이 존재하고 결과 상태를 표현할 수 있음
- `NOT_COLLECTED`: 현재 Collection Scope 밖이어서 수집하지 않음
- `NOT_AVAILABLE`: 수집 대상이었으나 값이 없거나 사용할 수 없음
- `NOT_CALCULABLE`: 입력 Evidence는 있으나 Derived Metric을 계산할 수 없음
- `FAILED`: 수집 또는 검증을 시도했으나 실패함

`NOT_CALCULABLE`은 Metric 상태의 의미를 유지하며 `NOT_COLLECTED`, `NOT_AVAILABLE`, `FAILED`와 동일한 의미로 취급하지 않는다. Pack은 Keyword별로 Search Demand, Provider Competition, Total Search Volume, WEB `SEARCH_RESULT_TOTAL`의 Coverage와 상태를 표현할 수 있어야 한다.

### 84.6 Pack Minimum Contents

Pack은 계산 결과만 담는 Export가 아니라 Strategy Converter가 원본 API를 다시 해석하지 않아도 되는 Collection 단위 Evidence Package다. 최소 다음을 연결한다.

- Collection Metadata 및 Hub Seed
- Hub Seed와 Related Keyword Record
- Search Demand Evidence
- Provider Competition Evidence
- Hub Seed의 `SEARCH_RESULT_TOTAL` Evidence
- Derived Metrics
- Source Provenance 및 RAW References
- Keyword별 Coverage와 Evidence/Metric Status
- Partial Failure 및 Error 정보

Provider Competition Evidence와 GEO Competition Ratio는 별도 개념이다. GEO Competition Ratio는 다음 상태를 유지한다.

```text
formula = NOT_CONFIGURED
formula_version = NOT_CONFIGURED
```

NAVER `compIdx`, Search Volume, `SEARCH_RESULT_TOTAL`을 결합하여 Competition Ratio를 생성하지 않는다.

---

## 85. Canonical Keyword Identity Contract

### 85.1 Canonical Identity 기준

동일 Collection 안에서 `normalized_keyword`가 동일하면 Canonical Keyword Record는 정확히 1개만 존재한다. Canonical Keyword Identity의 논리적 유일성 기준은 다음과 같다.

```text
collection_id + normalized_keyword
```

Source Run 또는 Provider는 Keyword Identity를 소유하지 않는다. NAVER Search Ads, NAVER WEB, Google 등 여러 Source가 동일 Keyword를 사용하거나 발견해도 Source별 Canonical Keyword를 추가 생성하지 않는다.

### 85.2 Hub Seed Identity

하나의 Collection에는 Hub Seed Canonical Keyword가 정확히 1개 존재한다. 동일 Hub Seed가 여러 Source에서 사용되면 모든 Source Evidence는 같은 Canonical Hub Seed `keyword_id`를 참조한다.

### 85.3 Related Keyword Identity

Source에서 발견된 Keyword는 기존 Collection Canonical Keyword Registry에서 `normalized_keyword`로 먼저 조회한다.

- 동일 Keyword가 있으면 기존 Canonical Keyword ID를 사용한다.
- 없으면 새로운 Canonical Keyword Record를 생성한다.
- 동일 Keyword가 여러 Source에서 발견된 사실은 `discovery_sources`와 Source Provenance에 보존한다.

이 과정에서 기존 `normalized_keyword` 정책 외의 추가 정규화를 수행하지 않는다. 공백 제거, 대소문자 통합, 특수문자 제거, 임의 Unicode 변환, 동의어·유사 Keyword 병합은 별도 SoT 없이는 수행하지 않는다.

### 85.4 Evidence 연결

Evidence는 각자의 `evidence_id`, `source_run_id`, Source Provenance, `raw_reference`를 유지한다. 신규 Collection에서 Evidence의 `keyword_id`는 해당 Collection Canonical Keyword Registry가 발급한 Canonical Keyword ID를 참조한다.

Evidence의 Provider와 Source Provenance는 Keyword Identity와 독립적으로 보존한다.

### 85.5 Historical Alias

`keyword_id_aliases`는 Canonical Identity를 대신하는 기본 모델이 아니다. 다음 Historical Compatibility 목적으로만 허용한다.

- 기존 Historical Evidence 연결
- 이미 생성된 Evidence의 legacy `keyword_id` 연결
- 기존 Snapshot을 Migration 없이 소비하기 위한 Compatibility Mapping

기존 RAW, Snapshot, Evidence를 이 계약에 맞추기 위해 Rewrite하거나 Migration하지 않는다. 신규 Collection에서는 동일 `normalized_keyword`에 대해 불필요한 Source별 Keyword ID Alias가 발생하지 않아야 한다.

### 85.6 Canonical Keyword Registry Ownership

신규 Multi-Source Collection에서 Collection Orchestrator는 Collection Scope의 Canonical Keyword Registry를 관리한다. 모든 Collector, Normalizer, Evidence 생성 과정은 이 Registry가 제공하는 Canonical Keyword ID를 사용한다. 구체적인 Registry 구현 방식은 후속 구현 단계에서 결정한다.

Competition Ratio는 이 Identity 계약과 별개이며 다음 상태를 유지한다.

```text
formula = NOT_CONFIGURED
formula_version = NOT_CONFIGURED
status = NOT_CONFIGURED
```

## 86. GEO Handoff Contract

### 86.1 Responsibility Boundary

Search Evidence Collector의 책임은 다음에서 종료된다.

- Source Evidence 수집
- RAW 보존
- Normalization
- Validation
- 허용된 Derived Metric 계산
- SEARCH EVIDENCE PACK 생성

GEO Handoff는 SEARCH EVIDENCE PACK을 Strategy Converter가 소비할 수 있는 계약 구조로 전달하는 Adapter 경계다. Handoff는 Evidence의 의미를 변경하거나 새로운 사실을 생성하지 않는다.

Strategy Converter는 다음을 판단하지 않는다.

- Keyword 중요도 및 Ranking
- Keyword 삭제
- Search Intent
- 의미적 Keyword Cluster
- 콘텐츠 주제
- Knowledge Node
- 질문 생성
- GEO 구조 및 Strategy
- 콘텐츠 작성

### 86.2 Handoff Structure

기존 Architecture와 Pack Schema에 따라 Model A를 사용한다.

```text
SEARCH EVIDENCE PACK
        ↓
GEO Handoff Adapter
        ↓
Strategy Converter Input
```

별도의 `geo-handoff-v1.json` 파일을 생성하거나 Pack 내부에 별도 분석 결과를 추가하지 않는다. Handoff Adapter는 전달 형식만 제공하며, Pack을 사후 재수집하거나 다른 Collection과 병합하지 않는다.

### 86.3 Handoff Field Contract

#### REQUIRED

- `collection_id`
- `hub_seed`
- `canonical_keywords`
- `source_runs`
- Keyword별 Search Demand Evidence 참조
- Keyword별 Provider Competition Evidence 참조
- Keyword별 Total Search Volume 및 Metric status
- Keyword별 `coverage`
- Hub Seed의 `SEARCH_RESULT_TOTAL` 및 status
- `source_provenance`
- `raw_references`
- `errors`
- `competition_ratio` 상태
- `schema_version`
- `handoff_version`

`canonical_keywords`의 각 Record는 기존 `keyword_id`, `raw_keyword`, `normalized_keyword`, `keyword_role`, `collection_id`, status를 유지한다. `HUB_SEED`와 `RELATED_KEYWORD`를 평탄화하지 않는다.

#### OPTIONAL

- `pack_version`
- Collection `started_at`, `captured_at`, `status`
- Evidence의 Provider field, raw value, Evidence status, Source Run 상세
- Derived Metric의 `formula`, `formula_version`, `input_evidence_ids`, `calculated_at`
- Source별 endpoint, search vertical, response field 등 Provenance 상세
- Partial Failure의 Source별 추가 Error metadata

#### NOT_INCLUDED

- Keyword 중요도, Ranking, 추천 여부
- Search Intent 또는 질문 추론
- 의미적 Cluster, Knowledge Node, 주제 분류
- GEO Strategy 또는 콘텐츠 작성 결과
- 임의의 Competition Ratio 계산값
- RAW Payload 자체의 복제
- Provider별 Evidence를 합산한 대표값

### 86.4 Keyword-Level Delivery

Handoff는 Collection의 Canonical Keyword ID를 그대로 전달한다. 새로운 Keyword ID를 만들거나 Source별 Keyword ID를 생성하지 않는다.

각 Keyword에서 다음 연결을 유지한다.

- Search Demand PC Evidence
- Search Demand Mobile Evidence
- Provider Competition Evidence
- Total Search Volume Derived Metric
- Evidence/Metric status
- Source Provenance
- RAW Reference
- Coverage

Hub Seed는 추가로 자신의 WEB `SEARCH_RESULT_TOTAL` Evidence를 연결한다. Related Keyword의 WEB Coverage는 현재 수집 범위에 따라 `NOT_COLLECTED`를 그대로 전달한다.

### 86.5 Status and Coverage Contract

Evidence status, Metric status, Coverage status는 서로 다른 계층으로 유지한다.

- `AVAILABLE`: 해당 Evidence 또는 Metric이 존재함
- `NOT_COLLECTED`: 현재 Collection Scope 밖이어서 수집하지 않음
- `NOT_AVAILABLE`: 수집 대상이었으나 사용할 수 있는 값이 없음
- `NOT_CALCULABLE`: 입력 Evidence는 있으나 정책상 Metric을 계산할 수 없음
- `FAILED`: Source 수집 또는 처리 시도가 실패함

`<10`이 포함된 Total Search Volume은 `value = null`, `status = NOT_CALCULABLE`로 전달한다. `<10`을 숫자로 변환하거나 추정하지 않는다.

WEB `SEARCH_RESULT_TOTAL`은 NAVER API HUB Web Document Search의 해당 Query에 대한 WEB vertical `total`이다. 이를 인터넷 전체 문서 수나 NAVER 전체 문서 수로 확대 해석하지 않는다.

### 86.6 Provenance and Lineage

Handoff는 다음 Trace Chain을 끊지 않는다.

```text
GEO Handoff
  → SEARCH EVIDENCE PACK
  → Collection
  → Source Run
  → Evidence
  → RAW Reference
  → RAW
```

Derived Metric은 다음 Lineage를 유지한다.

```text
GEO Handoff
  → Derived Metric
  → input_evidence_ids
  → Evidence
  → RAW Reference
  → RAW
```

### 86.7 Version Contract

Version은 다음 의미로 구분한다.

- `schema_version`: Canonical Evidence Schema 버전
- `pack_version`: SEARCH EVIDENCE PACK 구조 버전
- `handoff_version`: Strategy Converter에 전달하는 Handoff Contract 버전

초기 Handoff Contract는 `handoff_version: 1.0`을 사용한다. Version 변경은 필드 의미 또는 전달 구조가 호환되지 않게 변경될 때만 수행한다.

### 86.8 Partial Success

Collection이 `PARTIAL_SUCCESS`인 경우에도 성공한 Evidence를 폐기하지 않는다. Handoff는 다음을 함께 전달한다.

- Collection status
- Source Run별 status
- 성공한 Evidence
- 실패한 Source
- Error Records
- Keyword별 Coverage

실패한 Source를 성공값, 0, `NOT_AVAILABLE` 등으로 대체하지 않는다.

### 86.9 Competition Ratio

Handoff에서도 다음 상태만 전달한다.

```text
formula = NOT_CONFIGURED
formula_version = NOT_CONFIGURED
status = NOT_CONFIGURED
```

NAVER `compIdx`, Search Volume, Total Search Volume, `SEARCH_RESULT_TOTAL`을 결합하여 Competition Ratio를 생성하지 않는다.

---

## 87. SEARCH EVIDENCE PACK Contract

### 87.1 Pack 역할과 경계

`SEARCH EVIDENCE PACK`은 RAW Dump 또는 Snapshot 전체 복사본이 아니다.
Collection Snapshot을 입력으로 사용하는 Keyword Candidate 중심의 Projection이며,
Reviewer와 Strategy Converter가 Search Evidence를 소비하기 위한 전달 구조다.

```text
RAW
  → Canonical Evidence
  → Snapshot
  → SEARCH EVIDENCE PACK
  → GEO Handoff / Strategy Converter
```

Pack Builder는 외부 Source를 다시 호출하지 않으며, RAW 또는 Snapshot을 수정하지 않는다.
Pack은 Canonical Source of Truth를 대체하지 않는다.

### 87.2 Source Policy

현재 Pack의 Core Source는 다음과 같다.

- NAVER Search Ads Related Keywords
- `MONTHLY_SEARCH_VOLUME_PC`
- `MONTHLY_SEARCH_VOLUME_MOBILE`
- Total Search Volume Derived Metric
- `PROVIDER_COMPETITION_VALUE`
- Hub Seed의 NAVER WEB `SEARCH_RESULT_TOTAL`

NAVER DataLab Search Trend는 Optional Source다. Trend가 없어도 정상 Core Pack을 생성할 수
있으며, 초기 적용 범위는 Hub Seed 중심이다. 전체 Related Keyword Trend 수집은 기본 정책이 아니다.
DataLab `ratio`는 상대 관심도이며 Search Volume이 아니다.

현재 Production Pack에서 다음 Source는 DEFER한다.

- NAVER AutoComplete
- 함께 많이 찾는 검색어
- 일반 검색 UI Related Search
- Google Sources

### 87.3 Pack Metadata

Pack Metadata는 Projection 자체의 생성·추적 정보이며 원본 Collection Metadata를 재정의하지 않는다.
최소한 다음 의미를 제공한다.

- `pack_version`
- `schema_version`
- `generated_at`
- `collection_id`
- `snapshot_version`
- `hub_seed`
- `collection_status`
- `keyword_count`
- `evidence_count`
- `derived_metric_count`

기존 Pack의 `collection` 객체가 Collection ID, Snapshot Version, Seed, Collection Status를
권위 있게 보존하는 경우 Metadata에 의미가 중복되는 필드는 호환성을 제외하고 새로 만들지 않는다.

### 87.4 Source Summary

Pack은 Reviewer가 사용된 Source와 상태를 빠르게 확인할 수 있도록 `source_summary`를 제공할 수 있다.
이 값은 실제 Source Run과 Snapshot 상태에서 생성하며 가짜 성공 상태를 만들지 않는다.

Optional Source의 `NOT_COLLECTED`는 Core Pack 실패가 아니다.
상세 Source Run 기록은 `source_runs`가 권위 있는 원본이며 `source_summary`는 요약 Projection이다.

### 87.5 Keyword Candidate

Pack의 `keywords[]`는 Keyword Candidate 중심 배열이다. 기존 Canonical Keyword 필드를 재사용하며,
의미가 중복되는 별도의 `keyword` 필드를 만들지 않는다.

최소 필드와 관계는 다음과 같다.

- `keyword_id`
- `collection_id`
- `raw_keyword`
- `normalized_keyword`
- `keyword_role`: `HUB_SEED` 또는 `RELATED_KEYWORD`
- `discovered_from`
- `discovery_sources`
- `status`
- `evidence_ids`
- `metric_ids`
- `source_run_ids`
- `raw_references`
- Keyword별 `coverage`

정상 Collection에는 `HUB_SEED`가 정확히 1개 존재한다. 위 Reference 필드는 Payload 복사가
아니라 Evidence, Metric, Source Run, RAW를 가리키는 참조 목록이다.

### 87.6 Search Volume과 Provider Competition

Pack은 PC, Mobile, Total Search Volume과 상태를 그대로 전달한다.

```text
PC = Numeric AND Mobile = Numeric
→ Total = PC + Mobile
→ status = EXACT
```

PC 또는 Mobile 중 하나라도 `<10`이면:

```text
value = null
status = NOT_CALCULABLE
```

`<10`을 0, 5, 9, 10, midpoint, estimated 또는 bounded 값으로 변환하지 않는다.
Provider `raw_value`는 보존한다.

NAVER `compIdx`는 `PROVIDER_COMPETITION_VALUE`인 Provider Competition Evidence다.
GEO Competition Ratio, SEO Score, Search Volume 또는 `SEARCH_RESULT_TOTAL`로 변환하지 않는다.

Competition Ratio는 다음 상태만 유지한다.

```text
formula = NOT_CONFIGURED
formula_version = NOT_CONFIGURED
status = NOT_CONFIGURED
```

### 87.7 WEB와 Optional Trend Coverage

현재 WEB Scope:

- Hub Seed: 실제 `SEARCH_RESULT_TOTAL` Evidence가 있으면 `AVAILABLE`
- Related Keyword: 현재 Scope 밖이므로 `NOT_COLLECTED`

`NOT_COLLECTED`는 0, `NOT_AVAILABLE`, `FAILED`와 다르다.
WEB `total`은 NAVER API HUB Web Document Search가 해당 Query에 대해 수집 시점에 반환한 값이며,
인터넷 전체 문서수나 Competition Ratio를 의미하지 않는다.

Trend가 없는 Collection은 다음처럼 표현할 수 있다.

```text
coverage.trend = NOT_COLLECTED
```

Trend가 있으면 최소한 다음을 추적한다.

- provider
- product
- query 또는 group
- period
- `time_unit`
- device
- gender
- ages
- ratio 또는 `trend_points`
- collected_at
- `raw_reference`

Trend Derived Metric 공식은 이 Contract에서 정의하지 않는다.

### 87.8 Status와 Coverage

다음 상태는 서로 다른 의미로 보존한다.

- `SUCCESS`
- `PARSE_FAILED`
- `VALIDATION_FAILED`
- `NOT_AVAILABLE`
- `NOT_COLLECTED`
- `FAILED`
- `NOT_CONFIGURED`
- `NOT_CALCULABLE`

실제 숫자 0은 유효한 값일 수 있으므로 Status로 대체하지 않는다.

### 87.9 Provenance와 RAW Reference

다음 Trace가 가능해야 한다.

```text
Keyword Candidate → Evidence → Source Run → RAW Reference → RAW
Keyword Candidate → Metric → input_evidence_ids → Evidence → RAW Reference → RAW
```

Pack에 RAW Payload 전체를 복사하지 않는다. `source_provenance`, `raw_references`, Evidence Metadata,
Metric Lineage를 통해 원본까지 추적한다.

### 87.10 Sorting과 Reviewer Summary

Pack 배열은 Canonical Keyword ID 또는 Collection 생성 순서에 따른 결정론적 순서를 사용한다.
물리적 배열 순서는 추천 순위를 의미하지 않는다.

UI는 표시 목적으로 Total Search Volume 등을 정렬할 수 있으나 Pack에 다음 값을 생성하지 않는다.

- `rank`
- `recommendation_rank`
- `best_keyword`
- `SEO_SCORE`
- `GEO_SCORE`

Reviewer Summary는 선택적 Projection Summary이며 다음과 같은 집계만 허용한다.

- `total_keyword_candidates`
- `exact_search_volume_count`
- `not_calculable_count`
- `source_success_count`
- `source_failure_count`
- `optional_source_count`

Reviewer Summary는 추천 또는 Strategy 판단을 포함하지 않는다.

### 87.11 Pack Validation

Pack 생성 시 최소한 다음을 검증한다.

- Collection ID 일치
- `HUB_SEED` 정확히 1개
- Keyword 중복 없음
- Evidence ID 중복 없음
- Evidence `keyword_id` 참조 유효
- Source Run 참조 유효
- RAW Reference 추적 가능
- Provider와 Source ID 존재
- Metric ID 중복 없음
- Metric `keyword_id` 참조 유효
- `input_evidence_ids` 참조 유효
- Metric Collection ID 일치
- `EXACT`이면 Numeric value
- `NOT_CALCULABLE`이면 `value = null`
- `<10` 원문 보존
- Hub Seed WEB Coverage는 Evidence가 있으면 `AVAILABLE`
- Related Keyword WEB Coverage는 현재 Scope에서 `NOT_COLLECTED`
- Optional Source 실패가 Core Pack 실패로 전파되지 않음

### 87.12 Pack Generation Gate

- `SUCCESS`: 정상 Pack 생성 가능
- `PARTIAL_SUCCESS`: Core Search Ads Evidence, Canonical Keyword, 관계, 성공 Evidence/Metric이 유효하면 Partial Pack 생성 가능
- `FAILED`: 정상 분석용 Pack 생성 불가

`PARTIAL_SUCCESS`에서도 성공한 Evidence와 실패 Source Run/Error를 함께 보존한다.
Optional DataLab 실패만으로 Core Pack 생성을 막지 않는다. Core Evidence가 Keyword Candidate Contract를
만족하지 못하면 정상 Pack을 생성하지 않는다.

### 87.13 Pack Storage Boundary

Pack은 Snapshot Repository가 저장하는 Snapshot Payload의 일부가 아니다. Pack은 별도의 Pack Repository가
관리하는 Projection이다.

현재 구현과 Historical Compatibility를 위해 물리적 경로는 다음을 유지한다.

```text
data/snapshots/<collection_id>/pack-v<pack_version>.json
```

이는 `data/snapshots/<collection_id>/v<snapshot_version>.json` Snapshot 파일과 분리된 Pack 파일이며,
기존 `PackRepository` 경계를 변경하거나 Historical 파일을 이동하지 않는다. `data/exports/`는 별도
General Export Projection 용도로 유지한다.

### 87.14 책임 경계

```text
Snapshot Repository
  → Pack Builder / Pack Repository
  → Result / Review UI
  → GEO Handoff
  → Legacy / Intermediate Handoff 또는 Final Planner Handoff
```

Pack Builder는 Collector, Provider Adapter, Strategy Converter가 아니다. Pack은 Search Evidence를
전달하며 `RECOMMENDED`, `BEST_KEYWORD`, `AI_DECISION`, Search Intent, Knowledge Node를 생성하지 않는다.
## 88. Review Selection Artifact Contract

Review Selection은 SEARCH EVIDENCE PACK과 분리된 Human Review Artifact다. Pack, Snapshot, RAW, Evidence, Metric을 수정하지 않는다.

최소 필드:

- review_id
- collection_id
- pack_version
- review_version
- created_at
- updated_at
- reviewer_selection[]

각 선택 항목은 keyword_id, decision, reviewer_note를 가진다. decision은 SELECTED, EXCLUDED, UNDECIDED 중 하나이며 자동 선택은 허용하지 않는다. keyword_id는 Pack의 Canonical Keyword ID를 참조하고 Evidence/Metric 값을 복제하지 않는다.

Review Version은 overwrite하지 않고 새 Version으로 저장한다. Pack Version과 Review Version은 독립적인 Version 축이다.

## 89. Review Selection to GEO Handoff

GEO Handoff는 Pack과 Review Selection을 함께 참조하는 별도 Artifact다. SELECTED Candidate만 selected set으로 전달하며, HUB_SEED는 항상 별도 Context로 보존한다. EXCLUDED와 UNDECIDED Candidate는 선택 결과에는 보존하되 selected set에는 포함하지 않는다.

Handoff는 Candidate의 Canonical ID, Evidence/Metric Reference, Coverage, Status, Source Provenance, RAW Reference를 그대로 전달한다. RAW Payload 복제, Evidence 재계산, Recommendation, Ranking, Strategy 판단은 수행하지 않는다.

Core Pack이 유효하고 SELECTED Candidate가 하나 이상이면 Handoff 생성이 가능하다. UNDECIDED 전체 해소는 필수 조건이 아니다. PARTIAL_SUCCESS는 성공 Evidence와 실패 Source/Error를 함께 전달하며, Core Evidence가 유효한 경우에만 허용한다.
