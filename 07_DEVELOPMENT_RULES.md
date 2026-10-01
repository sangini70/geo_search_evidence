# GEO SEARCH EVIDENCE COLLECTOR
## DEVELOPMENT RULES

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: Development & Coding Rules

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`를 실제 개발할 때 따라야 할 개발 원칙과 코딩 규칙을 정의한다.

이 문서는 특히 개발 담당자 Leo가 다음 질문에 일관되게 답할 수 있도록 한다.

- 무엇을 먼저 구현하는가
- 어떤 구조를 유지해야 하는가
- 무엇을 하드코딩하면 안 되는가
- 외부 Source를 어떻게 격리하는가
- RAW Evidence를 어떻게 보호하는가
- 실패를 어떻게 처리하는가
- 테스트는 무엇을 기준으로 하는가
- 기능 추가 시 무엇을 확인해야 하는가
- 언제 Refactoring하고 언제 하지 않는가
- 무엇을 임의로 변경해서는 안 되는가

본 문서는 단순 Style Guide가 아니다.

프로젝트의 Evidence Integrity를 코드 수준에서 지키기 위한 실행 규칙이다.

---

# 2. 상위 문서

개발자는 다음 문서를 함께 기준으로 사용한다.

1. `00_PROJECT_CONSTITUTION.md`
2. `01_PROJECT_BRIEF.md`
3. `03_DATA_SOURCE_STANDARD.md`
4. `04_SEARCH_EVIDENCE_SCHEMA.md`
5. `05_WORKFLOW.md`
6. `02_SYSTEM_ARCHITECTURE.md`
7. `06_UI_REQUIREMENTS.md`
8. `07_DEVELOPMENT_RULES.md`

충돌 시 상위 원칙을 우선한다.

특히 다음은 개발 편의를 이유로 변경하지 않는다.

- Evidence First
- RAW Preservation
- Source Provenance
- Missing ≠ 0
- Search Evidence ≠ Interpretation
- Snapshot Preservation
- Provider Independence
- Partial Failure Isolation

---

# 3. 개발의 최우선 목표

이 프로젝트의 개발 목표는 많은 기능을 만드는 것이 아니다.

최우선 목표는 다음이다.

> 하나의 Hub Seed Keyword를 입력하면 신뢰 가능한 Search Evidence가 수집되고, 출처와 원본을 추적할 수 있으며, Strategy Converter가 사용할 수 있는 형태로 Export되는 End-to-End 시스템을 만든다.

기능 수보다 End-to-End 완성도를 우선한다.

---

# 4. 개발 우선순위

개발 우선순위는 다음과 같다.

1. 정확성
2. Source Provenance
3. RAW Preservation
4. Reproducibility
5. Failure Isolation
6. Data Validation
7. End-to-End 동작
8. 유지보수성
9. GEO Integration
10. 자동화
11. UI 편의성
12. 추가 기능
13. 시각적 장식

하위 항목 때문에 상위 항목을 희생하지 않는다.

---

# 5. MVP First

처음부터 완성형 Keyword Platform을 만들지 않는다.

MVP 목표:

Seed

→ Keyword Discovery

→ Search Demand Collection

→ RAW Save

→ Normalize

→ Validate

→ Derived Metrics

→ Result Table

→ Export

이 흐름을 먼저 완성한다.

Autocomplete, Trend, Historical Comparison 등은 Core Flow가 안정화된 후 추가한다.

---

# 6. Vertical Slice 개발

개발은 기능별 대형 Module을 모두 먼저 만드는 방식보다 작은 End-to-End Vertical Slice를 우선한다.

권장 첫 번째 Slice:

`달러`

→ Search Ads 호출

→ Related Keyword 수집

→ RAW 저장

→ PC/Mobile 검색량 Normalization

→ Total 계산

→ 저장

→ Table 표시

→ Markdown Export

이 흐름이 실제로 작동한 뒤 확장한다.

---

# 7. 실제 데이터로 조기 검증

Mock만으로 전체 개발을 진행하지 않는다.

초기 단계에서 실제 Source를 이용한 작은 End-to-End Test를 수행한다.

이유:

- 실제 API Response 확인
- 특수값 확인
- Missing 확인
- 인증 구조 확인
- Rate Limit 확인
- 문서와 실제 Response 차이 확인

Mock은 실제 Response를 확인한 뒤 만든다.

---

# 8. 공식 문서 재확인

외부 API는 변경될 수 있다.

따라서 구현 시작 전에 다음을 최신 공식 Documentation으로 다시 확인한다.

- Endpoint
- Authentication
- Request Parameters
- Response Fields
- Rate Limit
- Quota
- Error Codes
- Terms
- Migration Notice
- Deprecated API

프로젝트 문서에 과거 Endpoint가 적혀 있다는 이유만으로 그대로 구현하지 않는다.

---

# 9. Source Adapter 원칙

외부 Provider의 구조를 Core Domain에 직접 노출하지 않는다.

권장 흐름:

External Source

→ Provider Adapter

→ Common Evidence Schema

금지:

UI Component

→ NAVER API 직접 호출

또는:

Exporter

→ Provider Response 직접 Parsing

모든 외부 Source 차이는 Adapter 또는 Collector Layer에서 처리한다.

---

# 10. Provider Independence

Core Logic은 특정 Provider Field Name에 의존하지 않는다.

잘못된 예:

Core Logic이 NAVER Response Field를 직접 참조

권장:

NAVER Adapter

→ Common Evidence

→ Core Logic

향후 Google이나 YouTube를 추가해도 Core Workflow를 다시 작성하지 않는 구조를 목표로 한다.

---

# 11. Collector 독립성

각 Source Collector는 가능한 한 독립적으로 실행한다.

예:

Search Ads Collector

Search API Collector

Autocomplete Collector

Related Search Collector

Trend Collector

하나의 Collector 실패가 다른 Collector까지 연쇄 실패시키지 않도록 한다.

---

# 12. Collector 책임

Collector의 책임:

- Source 호출
- Response 수신
- RAW 전달
- Source-specific Parsing
- 기본 오류 분류

Collector의 책임이 아닌 것:

- Keyword 가치 판단
- Search Intent 판단
- Knowledge Node 결정
- Article 작성
- 최종 Strategy 판단

---

# 13. RAW First Rule

외부 Response를 받은 후 가능한 한 먼저 RAW를 보존한다.

기본 순서:

Response

→ RAW Save

→ Parse

→ Normalize

→ Validate

→ Derived Calculation

Parse 실패 때문에 원본 Response까지 잃어서는 안 된다.

---

# 14. RAW 불변성

저장된 RAW Evidence는 기본적으로 Immutable로 취급한다.

다음 작업을 하지 않는다.

- 원본 Response 수정
- 과거 RAW 값 덮어쓰기
- Normalized 값을 RAW에 다시 기록
- Derived 값을 RAW에 삽입

필요하면 새로운 Record를 만든다.

---

# 15. Canonical Schema 우선

Module 간 데이터 교환은 `04_SEARCH_EVIDENCE_SCHEMA.md`를 기준으로 한다.

Collector별 임의 Object 구조가 Application 전체로 퍼지지 않게 한다.

Provider Response

→ Adapter

→ Canonical Schema

이후 Module은 Canonical Data를 사용한다.

---

# 16. Schema Version

저장되는 Collection에는 Schema Version을 기록한다.

예:

schema_version: 1.0

Schema가 변경될 경우 기존 데이터를 조용히 변경하지 않는다.

필요하면 Migration을 별도로 수행한다.

---

# 17. Type Safety

가능하면 핵심 Domain Data는 명확한 Type을 사용한다.

특히 다음은 자유 문자열 남용을 피한다.

- Collection Status
- Evidence Status
- Evidence Type
- Source Type
- Collection Method
- Source Status
- Error Type

Enum 또는 이에 준하는 구조를 사용한다.

---

# 18. Numeric Data

검색량, Result Count, Ratio 등 Numeric Data는 가능한 한 Numeric Type으로 관리한다.

문자열 숫자를 Core Logic에서 직접 계산하지 않는다.

예:

잘못된 값:

"1000"

정규화 후:

1000

단, Source 특수 문자열은 `raw_value`에 보존한다.

---

# 19. Missing ≠ Zero

이 규칙은 코드 전체에서 강제한다.

다음은 서로 다르다.

value = 0

value = null

실제 0:

status = SUCCESS

Missing:

status = NOT_PROVIDED 또는 기타 Missing 상태

개발 편의를 위해 null을 0으로 치환하지 않는다.

---

# 20. Derived Metric Rule

Derived Metric은 검증된 입력값으로만 계산한다.

예:

Total Search Volume

조건:

PC valid

AND

Mobile valid

그렇지 않으면 계산하지 않는다.

Competition Ratio 역시 필요한 입력값이 모두 유효할 때만 계산한다.

---

# 21. Derived Metric Lineage

계산값은 어떤 Evidence로 계산했는지 추적할 수 있어야 한다.

최소한 다음을 연결한다.

- input_evidence_ids
- formula
- formula_version
- calculated_at

계산 결과만 저장하지 않는다.

---

# 22. Formula 하드코딩

Formula 자체는 코드로 구현할 수 있다.

그러나 Version 없이 의미를 변경하지 않는다.

예:

competition_ratio_v1

공식이 바뀌면:

competition_ratio_v2

로 구분한다.

과거 결과를 새로운 공식으로 조용히 덮어쓰지 않는다.

---

# 23. Error를 정상값으로 변환 금지

API 오류가 발생했다고 다음처럼 처리하지 않는다.

search_volume = 0

또는:

documents = 0

대신:

value = null

status = COLLECTION_FAILED

error record = 생성

을 사용한다.

---

# 24. Error Classification

오류는 가능한 범위에서 분류한다.

기본:

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

무조건 `ERROR` 하나로 처리하지 않는다.

---

# 25. Retry Rule

Retry는 일시적 오류에만 제한적으로 사용한다.

후보:

- TIMEOUT
- NETWORK_ERROR
- 일부 RATE_LIMIT

자동 Retry를 신중히 해야 하는 오류:

- AUTH_ERROR
- CONFIG_ERROR
- SOURCE_CHANGED
- PARSE_ERROR
- VALIDATION_ERROR

무한 Retry를 금지한다.

---

# 26. Retry 횟수

Retry Count는 Provider별 Configuration으로 관리할 수 있다.

코드 곳곳에 숫자를 반복해서 하드코딩하지 않는다.

Retry 실패 후 Error를 숨기지 않는다.

최종 실패 상태를 기록한다.

---

# 27. Rate Limit

Provider Rate Limit을 존중한다.

금지:

- 의도적인 제한 우회
- 과도한 Parallel Request
- 실패 후 즉시 무한 반복
- 여러 Credential을 이용한 비정상 우회

가능하면 Batch API를 활용한다.

---

# 28. Batch Processing

Provider가 Batch 요청을 지원하는 경우 효율적으로 사용할 수 있다.

그러나 Batch 처리 때문에 Keyword별 Evidence Provenance를 잃지 않는다.

하나의 Response에서 여러 Keyword가 왔더라도 각 Keyword Evidence를 정확히 Mapping한다.

---

# 29. Concurrency

초기 MVP에서는 과도한 병렬화를 피한다.

우선:

정확하게 작동하는 Sequential 또는 제한된 Concurrency

를 구현한다.

실제 성능 병목이 확인된 후 병렬성을 높인다.

---

# 30. Timeout

외부 API 호출에는 적절한 Timeout을 둔다.

외부 Source 응답이 없다고 Application 전체가 무기한 대기해서는 안 된다.

Timeout은 Source별 Configuration으로 조정 가능하게 한다.

---

# 31. Cache

Cache는 성능과 API 호출 절감을 위해 사용할 수 있다.

그러나 Cache와 Evidence Snapshot을 혼동하지 않는다.

Cache:

성능 최적화

Snapshot:

Historical Evidence

Cache 삭제가 Historical Evidence 삭제로 이어져서는 안 된다.

---

# 32. Snapshot 불변성

완료된 Collection Snapshot은 기본적으로 수정하지 않는다.

같은 Seed를 다시 조사하면:

기존 Snapshot 수정

이 아니라:

새 Collection 생성

방식을 사용한다.

---

# 33. Manual Correction

향후 사용자가 데이터를 수정할 필요가 있어도 Original Evidence를 덮어쓰지 않는다.

권장:

Original Evidence

+

Correction Record

또는:

Override Record

원본과 수정 이력을 모두 추적할 수 있게 한다.

---

# 34. Storage Repository

Application Logic이 Storage 구현에 직접 종속되지 않게 Repository Layer를 둔다.

예:

CollectionRepository

EvidenceRepository

SourceRepository

SnapshotRepository

실제 저장 방식이 바뀌어도 Core Logic 변경을 최소화한다.

---

# 35. Local First

초기 프로젝트는 Local First를 우선한다.

이유:

- 단일 운영자
- 빠른 개발
- 비용 최소화
- 인증 불필요
- Debug 용이
- 데이터 직접 검토 용이

Cloud Infrastructure는 실제 필요성이 생긴 후 도입한다.

---

# 36. Monolith First

초기에는 하나의 Application 안에서 Module을 분리한다.

Microservice로 시작하지 않는다.

권장:

Modular Monolith

구조적으로는 역할을 나누되 배포 구조는 단순하게 유지한다.

---

# 37. 권장 Module Boundary

기본 Module:

- app
- core
- collectors
- providers
- normalizers
- metrics
- repositories
- exporters
- ui

필요한 경우:

- config
- tests
- utils

를 추가한다.

---

# 38. 권장 프로젝트 구조

예:

geo_search_evidence/

docs/

- 00_PROJECT_CONSTITUTION.md
- 01_PROJECT_BRIEF.md
- 02_SYSTEM_ARCHITECTURE.md
- 03_DATA_SOURCE_STANDARD.md
- 04_SEARCH_EVIDENCE_SCHEMA.md
- 05_WORKFLOW.md
- 06_UI_REQUIREMENTS.md
- 07_DEVELOPMENT_RULES.md

src/

- app/
- core/
- collectors/
- providers/
- normalizers/
- metrics/
- repositories/
- exporters/
- ui/

data/

- raw/
- snapshots/
- exports/

tests/

output/

README.md

실제 Framework에 맞게 세부 구조는 조정할 수 있다.

상위 역할 구분은 유지한다.

---

# 39. Naming Rule

파일명과 Module명은 역할을 알 수 있게 작성한다.

좋은 예:

naver_search_ads_collector

search_volume_normalizer

competition_ratio_calculator

markdown_evidence_exporter

나쁜 예:

helper1

processor2

temp

final_final

기능과 책임이 이름에서 드러나게 한다.

---

# 40. Provider Naming

Provider-specific Code에는 Provider를 명확히 표시한다.

예:

naver_search_ads

naver_api_hub_search

naver_search_trend

naver_serp_autocomplete

Provider-specific Code를 generic 이름으로 숨기지 않는다.

---

# 41. Secret 관리

다음 값을 Source Code에 직접 넣지 않는다.

- API Key
- Secret Key
- Client Secret
- Access Token
- Password

Environment Variable 또는 안전한 Secret 관리 방식을 사용한다.

---

# 42. Git Secret Rule

Credential 파일을 Git에 Commit하지 않는다.

필요하면:

`.env.example`

을 제공한다.

예제에는 실제 Secret을 넣지 않는다.

---

# 43. Log Secret Rule

Log에도 Credential을 출력하지 않는다.

금지:

Authorization Header 전체 출력

Secret Key 출력

Token 출력

Debug 편의를 위해 Secret을 노출하지 않는다.

---

# 44. Logging

최소한 다음 Event를 Log로 추적할 수 있어야 한다.

- Collection 시작
- Collection 종료
- Collector 시작
- Collector 종료
- Source 오류
- Retry
- Validation Failure
- Export 생성
- Fatal Error

Log는 Debug 가능성을 높이되 Evidence 자체를 대체하지 않는다.

---

# 45. Structured Logging

가능하면 구조화된 Log를 사용한다.

예시 정보:

timestamp  
collection_id  
collector  
source_id  
keyword  
status  
error_type

긴 자연어 문자열만 남기는 방식보다 추적하기 쉽도록 한다.

---

# 46. 개인정보 최소화

본 시스템은 기본적으로 Search Keyword Evidence Tool이다.

불필요한 개인정보를 수집하지 않는다.

사용자 계정이나 방문자 분석 기능을 초기 버전에 추가하지 않는다.

---

# 47. External Source Compliance

기술적으로 수집할 수 있다는 이유만으로 구현하지 않는다.

새 Source를 추가하기 전에 확인한다.

- 공식 API 존재 여부
- 이용약관
- 자동화 허용 범위
- Rate Limit
- 인증 방식
- 데이터 사용 제한

특히 SERP Observation Collector는 별도로 검토한다.

---

# 48. SERP Collector 격리

Autocomplete나 Related Search처럼 UI 변화에 취약한 기능은 별도 Module로 격리한다.

Stable Layer:

- Official API
- Search Demand
- Trend API

Change-sensitive Layer:

- Autocomplete
- Related Search
- Co-searched UI
- 기타 SERP Observation

SERP 변경 때문에 Core Search Demand 기능이 중단되어서는 안 된다.

---

# 49. DOM Selector Rule

SERP Collector에서 DOM Selector가 필요한 경우 한곳에서 관리한다.

여러 파일에 동일 Selector를 복사하지 않는다.

Source UI 변경 시 수정 범위를 최소화한다.

---

# 50. HTML 구조 의존 최소화

가능하면 특정 CSS Class Name 하나에 전체 Parser가 의존하지 않도록 한다.

Source 구조가 바뀌면 실패를 감지할 수 있게 한다.

잘못 Parsing한 데이터를 정상 Evidence로 저장하는 것보다 명확히 실패하는 편이 낫다.

---

# 51. Fail Loudly, Continue Safely

외부 Source 구조가 예상과 다르면:

조용히 잘못된 값 생성

금지

권장:

해당 Collector 실패

→ Error 기록

→ RAW 보존

→ 다른 Collector 계속

즉:

Fail Loudly

but

Continue Safely

를 따른다.

---

# 52. Validation Layer

Provider Parsing과 Data Validation을 분리한다.

Parser:

Source Response를 읽는다.

Validator:

공통 Schema 기준으로 값이 유효한지 확인한다.

Parser가 성공했다고 Evidence가 자동으로 유효한 것은 아니다.

---

# 53. Validation Rule 중앙화

동일한 Validation Rule을 여러 Component에 복사하지 않는다.

예:

Search Volume >= 0

Search Result Total >= 0

Source ID required

Collected At required

등은 공통 Validation Layer에서 관리한다.

---

# 54. Normalizer 책임

Normalizer는 형식을 통일한다.

예:

Provider Field

→ Common Field

String Numeric

→ Numeric

특수값

→ Raw 보존 + Normalized Status

Normalizer는 Search Intent를 판단하지 않는다.

---

# 55. AI Dependency 금지

Core Search Collection Pipeline이 AI Model 호출에 의존해서는 안 된다.

다음 흐름은 AI 없이 작동해야 한다.

Seed

→ Search Evidence

→ Storage

→ Export

AI가 중단되어도 Search Evidence Collector의 Core 기능은 작동해야 한다.

---

# 56. AI 사용 위치

향후 AI가 필요하면 Optional Layer로 둔다.

예:

Evidence

→ AI Processor

→ AI_DERIVED

AI는 다음을 수정하지 않는다.

- RAW
- Official Search Volume
- Official Trend
- Search Result Total
- Source Metadata

---

# 57. AI 추정 금지

AI에게 Missing Search Volume을 추정하게 하지 않는다.

예:

실제 검색량 없음

→ AI 추정 1,200

금지

Missing은 Missing으로 유지한다.

---

# 58. UI와 Business Logic 분리

UI Component 안에 다음 Logic을 직접 구현하지 않는다.

- API 호출
- Search Volume 계산
- Competition Ratio 계산
- Snapshot 저장
- Evidence Validation
- Export Business Logic

UI는 Application Layer를 호출하고 결과를 표시한다.

---

# 59. Exporter 분리

각 Export Format은 별도 책임으로 분리한다.

예:

MarkdownExporter

JsonExporter

CsvExporter

XlsxExporter

Exporter가 외부 Source를 다시 호출하지 않는다.

---

# 60. Exporter Source Rule

Exporter는 저장된 Canonical Data만 사용한다.

금지:

Export 버튼 클릭

→ API 재호출

Export는 이미 수집된 Snapshot을 표현하는 과정이다.

---

# 61. Strategy Converter Adapter

Strategy Converter용 Handoff는 일반 Markdown Export와 별도 Adapter 또는 Builder로 둘 수 있다.

책임:

Canonical Evidence

→ SEARCH EVIDENCE PACK

→ Strategy Converter Input

판단이나 분석을 추가하지 않는다.

---

# 62. Search Evidence Pack Version

Pack 구조에는 Version을 둘 수 있다.

예:

pack_version: 1.0

Pack Format이 변경되면 Version을 갱신한다.

---

# 63. Test 우선순위

테스트 우선순위:

1. Normalization
2. Validation
3. Derived Metrics
4. Error Handling
5. Collector Parsing
6. Repository
7. Export
8. End-to-End
9. UI 핵심 Flow

시각적 세부사항보다 Evidence Integrity를 먼저 테스트한다.

---

# 64. Unit Test

Unit Test가 특히 필요한 영역:

- Keyword Normalization
- Search Volume Parsing
- 특수값 처리
- Total Search Volume
- Competition Ratio
- Status Mapping
- Error Classification
- Schema Validation
- Export Formatting

---

# 65. Fixture

실제 API Response를 기반으로 Sanitized Fixture를 만든다.

Fixture에는 실제 Secret을 포함하지 않는다.

가능하면 다음 유형을 확보한다.

- 정상 Response
- Empty Response
- Missing Field
- 특수값
- Error Response
- Unexpected Response

---

# 66. Mock 원칙

Mock은 실제 Provider의 이상적인 Response만 흉내 내서는 안 된다.

현실적인 Edge Case를 포함한다.

예:

- Field Missing
- null
- 특수 문자열
- Empty Array
- HTTP Error
- Rate Limit
- Unexpected Structure

---

# 67. Integration Test

Integration Test에서는 Module 간 연결을 검증한다.

예:

Collector

→ RAW Repository

→ Normalizer

→ Validator

→ Metric Calculator

→ Snapshot Repository

실제 저장 결과까지 확인한다.

---

# 68. End-to-End Test

MVP 완료 전에 실제 사용자 Flow를 테스트한다.

Seed:

달러

→ 수집

→ 저장

→ Table

→ Export

최소 하나의 실제 Hub Seed로 End-to-End 성공을 확인한다.

---

# 69. Failure Test

정상 Test만으로 완료 처리하지 않는다.

반드시 다음을 검증한다.

- Credential 없음
- Authentication 실패
- Timeout
- Rate Limit
- Empty Result
- Partial Keyword Failure
- Parsing Failure
- Missing PC
- Missing Mobile
- Search Result Missing
- Export Failure

---

# 70. Missing Test

특히 다음 Case를 자동 Test한다.

PC = 100  
Mobile = null

Expected:

Total = null

PC = null  
Mobile = 500

Expected:

Total = null

PC = 0  
Mobile = 0

둘 다 실제 유효한 0인 경우:

Total = 0

Status와 값의 의미를 구분한다.

---

# 71. Derived Metric Test

Competition Ratio는 Formula Version별 Test를 둔다.

Input:

Search Result Total  
Total Search Volume

Expected:

정확한 Ratio

다음도 테스트한다.

- denominator = 0
- denominator = null
- numerator = null
- invalid type

---

# 72. Regression Test

외부 Source Adapter를 수정할 경우 기존 Fixture를 이용해 Regression Test를 수행한다.

Source 변경 대응 중 기존 정상 데이터 Parsing을 깨뜨리지 않았는지 확인한다.

---

# 73. Source Contract Test

가능하면 Source Adapter마다 Contract 수준의 Test를 둔다.

확인:

- 필수 Field Mapping
- Error Mapping
- Special Value Handling
- Source ID
- Collection Timestamp
- RAW Preservation

---

# 74. Export Test

Markdown, JSON, CSV, XLSX Export는 최소한 다음을 검증한다.

- Seed 존재
- Keyword 존재
- Search Demand 존재
- Source 존재
- Missing 유지
- Error 유지
- Unicode 정상
- 한국어 Keyword 정상

---

# 75. Korean Text

한국어 Keyword가 핵심이므로 Encoding 문제를 반드시 테스트한다.

특히:

- CSV
- JSON
- Markdown
- XLSX
- File Name

에서 한글이 깨지지 않아야 한다.

---

# 76. Timezone

Timestamp는 명확한 Timezone을 포함하도록 한다.

내부 UTC를 사용할 수 있다.

Export에서 한국 시간으로 표시할 수도 있다.

어떤 방식이든 시간대가 불분명한 Timestamp를 만들지 않는다.

---

# 77. Date Formatting

Storage Format과 Display Format을 분리한다.

Storage:

표준 DateTime

UI:

사람이 읽기 쉬운 Format

파일명:

Filesystem-safe Format

을 사용할 수 있다.

---

# 78. Configuration

환경에 따라 변경될 수 있는 값은 Configuration으로 관리한다.

예:

- API Base URL
- Timeout
- Retry
- Max Keywords
- Discovery Depth
- Search Vertical
- Export Path

코드 여러 곳에 같은 값을 하드코딩하지 않는다.

---

# 79. Default Configuration

Default는 보수적으로 설정한다.

특히:

- Keyword Expansion
- Request Count
- Retry
- Concurrency

를 공격적으로 설정하지 않는다.

실제 운영 데이터를 보고 조정한다.

---

# 80. Feature Flag

불안정한 기능은 Feature Flag 또는 Enabled 설정으로 끌 수 있게 할 수 있다.

예:

autocomplete_enabled

related_search_enabled

trend_enabled

Experimental 기능 때문에 Core Application을 수정하지 않아도 되게 한다.

---

# 81. Experimental Feature

새 Collector는 처음부터 Production Core로 간주하지 않는다.

권장 단계:

EXPERIMENTAL

→ 실제 Test

→ Validation

→ ACTIVE

Source가 불안정하면 다시 DISABLED할 수 있다.

---

# 82. Code Comment

Comment는 코드가 무엇을 하는지 그대로 번역하는 용도로 남발하지 않는다.

Comment가 필요한 경우:

- 왜 이 Rule이 필요한가
- Source의 특이사항
- 데이터 의미
- 중요한 제한
- 비정상적으로 보이지만 의도된 처리

를 설명한다.

---

# 83. TODO Rule

TODO를 남길 경우 구체적으로 작성한다.

나쁜 예:

TODO fix

좋은 예:

TODO: NAVER API HUB migration 완료 후 Legacy Search Adapter 제거 여부 검토

의도와 조건이 드러나게 한다.

---

# 84. Temporary Code

임시 코드가 Production Path에 남지 않도록 한다.

특히 금지:

- 테스트용 API Key
- 임시 Keyword
- 달러 하드코딩
- 임시 JSON
- Debug Print
- Fake Search Volume

개발 완료 전 제거한다.

---

# 85. Fake Data 표시

UI 개발용 Fake Data를 사용할 경우 명확하게 Mock 또는 Fixture임을 표시한다.

실제 Search Evidence처럼 보이게 하지 않는다.

Production Mode에서 Fake Data가 나타나지 않도록 한다.

---

# 86. README

README에는 최소한 다음을 포함한다.

- 프로젝트 목적
- 실행 방법
- 환경 설정
- 필요한 Credential
- 기본 Collection 방법
- 테스트 실행 방법
- Export 위치
- 주요 문서 위치

README가 Constitution을 복제할 필요는 없다.

실행 중심으로 작성한다.

---

# 87. Documentation as Code

`docs/` 문서는 코드와 함께 Version Control한다.

Architecture 또는 Schema가 실제 구현과 달라지면 문서를 갱신한다.

문서와 코드가 장기간 서로 다른 상태가 되지 않게 한다.

---

# 88. Change Log

중요한 구조 변경은 기록한다.

예:

- Source 변경
- Schema 변경
- Formula 변경
- Workflow 변경
- Collector 교체
- API Migration

작은 UI 문구 변경까지 모두 기록할 필요는 없다.

---

# 89. Architecture Decision

중요한 기술 결정은 이유를 남긴다.

예:

왜 Local First인가

왜 SQLite를 선택했는가

왜 특정 Framework를 선택했는가

왜 특정 Source를 제외했는가

향후 개발자가 맥락 없이 결정을 뒤집지 않도록 한다.

필요하면 ADR 형식을 사용할 수 있다.

---

# 90. Dependency 추가 원칙

새 Library를 추가하기 전에 확인한다.

- 정말 필요한가
- 표준 기능으로 가능한가
- 유지보수가 활발한가
- 보안 문제가 없는가
- 프로젝트 복잡도를 크게 높이지 않는가

작은 기능 하나 때문에 대형 Dependency를 추가하지 않는다.

---

# 91. Framework 선택

Framework는 프로젝트 목적에 맞게 선택한다.

기준:

- Local 실행 편의성
- API Integration
- Table UI
- Export
- 유지보수
- 개발 속도

유행하는 기술이라는 이유만으로 선택하지 않는다.

---

# 92. Premature Optimization 금지

실제 병목이 확인되기 전에 다음을 먼저 만들지 않는다.

- Distributed Queue
- Microservices
- Kubernetes
- Complex Event Bus
- Multiple Databases
- 대규모 Cache Cluster

초기에는 단순한 구조를 유지한다.

---

# 93. Premature Abstraction 금지

Provider가 하나뿐인데 미래의 모든 Provider를 예상해 지나치게 추상화하지 않는다.

그러나 Provider-specific Code와 Core Logic의 경계는 유지한다.

즉:

필요한 추상화는 한다.

상상 속 미래를 위한 과도한 추상화는 하지 않는다.

---

# 94. Refactoring Rule

다음 상황에서 Refactoring을 고려한다.

- 동일 Logic이 반복됨
- Source 추가가 어려움
- Test가 어려움
- Module 책임이 섞임
- 변경 시 연쇄 오류 발생
- Schema와 구현이 어긋남

단순히 코드가 마음에 들지 않는다는 이유로 전체 구조를 자주 다시 쓰지 않는다.

---

# 95. Minimal Change Principle

기존 기능이 정상 작동하는 상태에서 수정할 때 필요한 범위만 변경한다.

특히 외부 Source 대응 수정 시:

해당 Adapter

→ Test

→ 필요한 최소 연결부

를 우선한다.

Source 하나가 변경됐다고 전체 Application을 재작성하지 않는다.

---

# 96. Backward Compatibility

Schema나 Export Format 변경 시 기존 Snapshot을 고려한다.

새 Version에서 과거 Collection을 최소한 읽고 확인할 수 있도록 한다.

호환되지 않는 변경은 Version을 올린다.

---

# 97. Data Migration

Migration이 필요한 경우:

1. 원본 Backup
2. Migration Script
3. Dry Run
4. Validation
5. 실제 Migration
6. 결과 확인

직접 Database를 수동 수정하는 방식은 최소화한다.

---

# 98. Destructive Operation

삭제 또는 데이터 변형 작업은 보수적으로 처리한다.

특히:

- RAW 삭제
- Snapshot 삭제
- 전체 Database 초기화
- Migration

에는 명확한 확인 절차를 둔다.

---

# 99. Backup

실제 GEO Evidence가 축적되기 시작하면 정기적인 Backup 방법을 마련한다.

MVP 초기에는 단순 File Backup으로 시작할 수 있다.

Backup 구조도 복잡하게 시작하지 않는다.

---

# 100. Export는 Backup이 아니다

CSV나 XLSX Export를 Canonical Data Backup으로 간주하지 않는다.

Export는 Projection이다.

Canonical Collection과 Evidence Storage가 원본이다.

---

# 101. Source 변경 대응 절차

외부 Source가 변경된 경우 다음 순서를 따른다.

1. 문제 재현
2. RAW Response 확인
3. 공식 Documentation 확인
4. Source 변경 여부 판단
5. Adapter 수정
6. Fixture 갱신
7. Unit Test
8. Regression Test
9. 실제 Source Test
10. Collector Version 갱신 필요 여부 판단
11. Documentation 갱신

추측으로 Parser를 수정하지 않는다.

---

# 102. API Migration 대응

Provider가 새로운 API로 이관할 경우:

기존 Adapter 즉시 삭제

방식보다:

New Adapter 추가

→ 실제 검증

→ 기존 Adapter와 비교

→ Migration

→ Legacy 처리

순서를 우선한다.

과거 Snapshot의 Source ID는 그대로 유지한다.

---

# 103. Collector Version 변경

다음 경우 Collector Version 변경을 고려한다.

- Parsing Logic의 의미 있는 변경
- Source Endpoint 변경
- Mapping Rule 변경
- Special Value 처리 변경
- Evidence 의미 변경

단순 Code Cleanup은 Version 변경이 필요하지 않을 수 있다.

---

# 104. Observability

최소한 다음을 파악할 수 있어야 한다.

- 최근 Collection 성공 여부
- Source별 실패 여부
- Error Type
- Collection 시간
- Keyword 수
- Evidence 수

대형 Monitoring Platform은 MVP 필수가 아니다.

---

# 105. Performance Measurement

성능 개선 전에 측정한다.

예:

- Collection 총 소요시간
- API 호출 횟수
- Keyword 수
- Source별 응답시간
- Export 시간

느릴 것이라는 추측만으로 복잡한 최적화를 하지 않는다.

---

# 106. Cost Awareness

향후 유료 API가 추가될 경우 Collection별 비용을 추적할 수 있게 고려한다.

그러나 MVP에서 비용 관리 시스템을 먼저 만들 필요는 없다.

무료 또는 기존 사용 Source를 우선한다.

---

# 107. UI 개발 규칙

UI는 `06_UI_REQUIREMENTS.md`를 따른다.

특히:

- Desktop First
- Data-first
- Table 중심
- Missing 명확화
- Source 확인 가능
- Partial Success 표시
- Export 접근성

을 유지한다.

---

# 108. UI에서 Business Decision 금지

UI 개발자가 임의로 다음 기능을 추가하지 않는다.

- Best Keyword
- Opportunity Score
- SEO Score
- 추천 순위
- 공략 추천
- AI 자동 판단

이 기능은 현재 프로젝트 Scope가 아니다.

---

# 109. Sorting과 Ranking 구분

Numeric Column Sorting은 허용한다.

예:

Total Search Volume 내림차순

그러나 이를:

`추천 순위`

라고 부르지 않는다.

Evidence 정렬과 Strategy Ranking을 구분한다.

---

# 110. Search Evidence Boundary

개발 중 기능 요청이 들어오면 먼저 질문한다.

이 기능은:

Search Evidence Collection인가?

Search Evidence Processing인가?

Search Evidence Review인가?

Search Evidence Export인가?

아니면:

Strategy인가?

Planner인가?

Research인가?

Writer인가?

후자라면 Collector에 넣지 않는 것을 기본으로 한다.

---

# 111. Feature Addition Gate

새 기능 추가 전에 다음을 확인한다.

1. 프로젝트 목적에 필요한가
2. Search Evidence와 관련 있는가
3. 기존 Schema로 표현 가능한가
4. Source Provenance를 유지할 수 있는가
5. RAW를 보존할 수 있는가
6. Failure Isolation이 가능한가
7. MVP를 복잡하게 만들지 않는가
8. 유지보수 가치가 있는가

---

# 112. Done Definition — Collector

새 Collector는 다음 조건을 만족해야 완료다.

- Source 정의됨
- Source ID 존재
- 실제 Response 확인
- RAW 저장
- Parsing
- Normalization
- Validation
- Error Handling
- Test Fixture
- Unit Test
- 실제 호출 Test
- Documentation 반영

API 호출이 한 번 성공했다고 완료가 아니다.

---

# 113. Done Definition — Metric

새 Derived Metric 완료 조건:

- 목적 정의
- Input Evidence 정의
- Formula 정의
- Formula Version
- Missing 처리
- Zero 처리
- Unit Test
- Lineage 저장
- UI/Export 의미 확인

---

# 114. Done Definition — Export

새 Export 완료 조건:

- Canonical Data만 사용
- Source 유지
- Missing 유지
- Error 유지
- 한국어 정상
- Encoding 정상
- 실제 파일 또는 Output 검증
- 새로운 Evidence 생성 없음

---

# 115. Done Definition — MVP

MVP 완료는 화면이 만들어졌다는 뜻이 아니다.

다음 전체 흐름이 실제로 작동해야 한다.

Hub Seed 입력

→ Collection Job

→ Keyword Discovery

→ Search Demand

→ RAW Preservation

→ Normalization

→ Validation

→ Derived Metric

→ Storage

→ Result Table

→ Error Review

→ SEARCH EVIDENCE PACK

→ Export

최소 하나의 실제 Seed로 검증한다.

---

# 116. 개발 중 금지사항

다음을 금지한다.

- Source 없는 검색량 생성
- AI 검색량 추정
- Missing을 0으로 치환
- 오류를 정상값으로 저장
- RAW 삭제
- Snapshot 덮어쓰기
- Provider Field를 Core 전체에 노출
- UI에서 직접 API 호출
- Exporter에서 API 재호출
- Trend Ratio를 Search Volume으로 변환
- Search Result Vertical 제거
- Formula Version 없이 계산식 변경
- 무한 Retry
- 무제한 Recursive Discovery
- Secret Commit
- Secret Logging
- Fake Data를 Production Evidence로 사용
- SERP Scraper를 Core 전체와 강결합
- Optional Collector 실패로 전체 Job 폐기
- Collector에서 Strategy 판단
- Collector에서 Planner 실행
- Collector에서 최종 Knowledge Research 판단 수행
- Collector에서 Article 작성
- 초기부터 Microservice화
- 불필요한 회원·결제 시스템 추가

08_RESEARCH_ALGORITHM.md의 단계적 구현에서는 Evidence-based Search Research,
Search Demand Research, Broad Discovery, Directed Research, Deep Research,
Search Entrance Analysis, Evidence Validation 및 Evidence Compression을
허용한다. 단, 최종 Knowledge Node, Hub Architecture, Learning Flow,
Knowledge Relationship, Internal Link 및 Planner 최종 판단은 Collector가
수행하지 않는다.

Research Algorithm 구현은 다음 원칙을 따른다.

- Phase-by-Phase 최소 변경
- 기존 Evidence Infrastructure 및 Historical Artifact 보호
- 실제 Source 호출은 필요한 Phase에서만 수행
- 불필요한 `/collect` 실행과 API 호출 금지
- Configurable Operational Threshold 사용
- 근거 없는 AI 추정 및 임의 Refactoring 금지

초기 Demand Gate 운영값은 다음과 같다.

```text
DEEP_RESEARCH_DEMAND_THRESHOLD = 1000
default = 1000
classification = OPERATIONAL_THRESHOLD
```

이 값은 지식적 기준이나 절대 Search Demand 기준이 아니며, 변경되어도 기존
RAW Evidence를 변경하지 않는다.

---

# 117. Leo 작업 원칙

Leo는 코딩 전에 관련 문서를 먼저 읽는다.

작업 단위마다 다음 순서를 권장한다.

1. 요구사항 확인
2. 관련 Schema 확인
3. 관련 Source 확인
4. 기존 코드 확인
5. 최소 변경 설계
6. 구현
7. Test
8. 실제 실행
9. 결과 확인
10. 변경 내용 보고

코드부터 작성하고 나중에 문서에 맞추는 방식은 피한다.

---

# 118. Leo의 변경 보고

의미 있는 작업 완료 후 최소 다음을 보고한다.

- 무엇을 구현했는가
- 어떤 파일을 수정했는가
- 어떤 Source를 사용했는가
- 어떤 Test를 수행했는가
- 실제 실행 결과는 무엇인가
- 실패 또는 미완료 항목이 있는가
- 다음 작업은 무엇인가

성공 여부를 추측해서 보고하지 않는다.

---

# 119. 테스트하지 않은 경우

실제 Test를 하지 않았다면 명확히 말한다.

예:

`구현 완료, 실제 API 호출 테스트는 아직 하지 않음`

테스트하지 않은 기능을:

`정상 작동`

이라고 보고하지 않는다.

---

# 120. 오류 발생 시 보고

오류가 발생하면 숨기거나 임시 우회로 완료 처리하지 않는다.

보고:

- 오류 위치
- 오류 원인
- 확인된 Evidence
- 수정 내용
- 재테스트 결과

원인을 모르면 원인을 모른다고 기록한다.

---

# 121. 임의 범위 확장 금지

요청받은 기능 외에 대규모 Refactoring이나 새 기능을 임의로 추가하지 않는다.

예:

Autocomplete Collector 수정 요청

→ 전체 UI Framework 교체

금지

필요한 경우 먼저 이유를 설명하고 별도 작업으로 분리한다.

---

# 122. 기존 정상 기능 보호

수정 전 기존 Test 상태를 확인한다.

수정 후 Regression Test를 수행한다.

하나를 고치면서 기존 기능을 깨뜨리지 않는다.

---

# 123. E2E 우선

Module이 각각 완벽하지만 전체 Pipeline이 연결되지 않은 상태를 오래 유지하지 않는다.

작은 기능이라도 End-to-End로 연결한다.

예:

Search Ads 하나만으로 먼저:

Input

→ Collect

→ Save

→ View

→ Export

를 완성한다.

---

# 124. 개발 단계

권장 개발 단계는 다음과 같다.

## Stage 1 — Skeleton

- Project Structure
- Config
- Core Types
- Repository Interface
- Basic UI

## Stage 2 — First Real Source

- NAVER Search Demand Source
- RAW Storage
- Parsing
- Normalization

## Stage 3 — Core Evidence

- Keyword Entity
- Search Volume
- Validation
- Derived Total

## Stage 4 — Competition

- Search Result Evidence
- Competition Ratio

## Stage 5 — Storage & History

- Collection
- Snapshot
- History

## Stage 6 — Export

- Markdown
- JSON
- CSV/XLSX 필요 시

## Stage 7 — GEO Handoff

- SEARCH EVIDENCE PACK
- Strategy Converter Input

## Stage 8 — Search Entrance

- Autocomplete
- Related Search
- Co-searched

## Stage 9 — Trend

- Search Trend

## Stage 10 — Historical Comparison

- Snapshot Comparison

---

# 125. 첫 번째 개발 목표

첫 번째 실제 목표는 다음 하나로 제한한다.

사용자가:

`달러`

를 입력한다.

시스템이:

관련 Keyword와 Search Demand를 실제 Source에서 가져온다.

그리고:

- RAW 저장
- PC 검색량
- Mobile 검색량
- Total
- Source
- Collected At
- Status

를 확인할 수 있게 한다.

이 Vertical Slice가 안정적으로 작동한 뒤 다음 기능으로 넘어간다.

---

# 126. 두 번째 개발 목표

첫 번째 Slice 완료 후:

Search Result Evidence

→ Competition Ratio

를 추가한다.

이 단계에서도 Search Entrance와 Trend를 동시에 넣지 않는다.

---

# 127. 세 번째 개발 목표

Core Evidence가 안정화되면:

SEARCH EVIDENCE PACK

→ Markdown Export

→ Strategy Converter Input

까지 연결한다.

이 시점부터 실제 GEO Workflow에서 사용할 수 있는 최소 제품이 된다.

---

# 128. 이후 확장

그 다음 순서:

Search Entrance

→ Trend

→ Historical Comparison

→ Additional Providers

를 기본으로 한다.

실제 필요성이 다른 경우 순서를 조정할 수 있지만 Core Evidence를 희생하지 않는다.

---

# 129. 성공 기준

개발 성공 여부는 코드량으로 판단하지 않는다.

다음 질문으로 판단한다.

`달러`를 입력했을 때:

- 실제 Keyword Evidence가 수집되는가
- 검색량 출처를 알 수 있는가
- RAW를 확인할 수 있는가
- Missing과 0이 구분되는가
- 일부 실패해도 나머지가 남는가
- 계산값의 근거를 추적할 수 있는가
- 과거 Collection이 보존되는가
- 결과를 Export할 수 있는가
- Strategy Converter가 사용할 수 있는가

모두 YES에 가까워질수록 프로젝트가 완성된다.

---

# 130. 최종 개발 원칙

GEO Search Evidence Collector의 개발 원칙은 다음 문장으로 요약한다.

**작게 시작한다.**

**실제 Source로 빨리 검증한다.**

**RAW를 먼저 보존한다.**

**Source를 Core에서 분리한다.**

**Missing을 사실처럼 만들지 않는다.**

**검증된 값만 계산한다.**

**실패를 숨기지 않는다.**

**부분 실패를 전체 실패로 만들지 않는다.**

**과거 Evidence를 덮어쓰지 않는다.**

**AI를 Source로 사용하지 않는다.**

**UI와 Logic을 분리한다.**

**Evidence와 판단을 분리한다.**

**하나의 End-to-End Flow를 완성한 뒤 확장한다.**

최종 개발 흐름은 다음과 같다.

SOURCE

→ COLLECTOR

→ RAW

→ ADAPTER

→ NORMALIZER

→ VALIDATOR

→ DERIVED METRIC

→ REPOSITORY

→ UI

→ EXPORT

→ GEO HANDOFF

Leo의 목표는 Keyword Tool을 많이 만드는 것이 아니다.

**GEO 프로젝트가 반복해서 신뢰할 수 있는 Search Evidence Infrastructure를 만드는 것이다.**

---

# FACT CHECK LIST

- 개발 우선순위는 정확성·출처·RAW 보존·재현성을 기능 수보다 앞에 둔다.
- MVP는 하나의 실제 End-to-End Vertical Slice부터 완성한다.
- 외부 Provider는 Adapter와 Collector를 통해 Core Logic에서 분리한다.
- RAW Evidence는 Parsing과 Normalization보다 먼저 보존하는 것을 원칙으로 한다.
- Missing과 실제 0을 코드 수준에서 구분한다.
- Derived Metric은 검증된 입력값으로만 계산한다.
- Derived Metric에는 Formula Version과 Input Evidence Lineage를 남긴다.
- Source 오류를 정상값으로 변환하지 않는다.
- Collector별 실패를 격리하여 Partial Success를 허용한다.
- Core Search Evidence Pipeline은 AI Model 없이 동작해야 한다.
- UI Component에서 직접 외부 API를 호출하지 않는다.
- Exporter는 외부 Source를 다시 호출하지 않는다.
- 동일 Seed 재수집은 기존 Snapshot 수정이 아니라 새로운 Collection을 생성한다.
- API Credential은 Source Code와 Log에 남기지 않는다.
- SERP 기반 Collector는 안정적인 공식 API Layer와 분리한다.
- 실제 API Response를 확인한 뒤 Fixture와 Mock을 만든다.
- 정상 Case뿐 아니라 Missing, Timeout, Rate Limit, Parse Failure 등을 테스트한다.
- 한국어 Keyword와 Export Encoding을 실제로 검증한다.
- 외부 API 구현 직전에는 최신 공식 Documentation을 다시 확인한다.
- Search Evidence Collector 안에서 Strategy, Planner 또는 최종 Knowledge Research,
  Writer의 역할을 수행하지 않는다. Evidence-based Research는 08의 단계적
  계약 범위에서 허용한다.
