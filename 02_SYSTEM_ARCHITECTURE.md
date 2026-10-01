# GEO SEARCH EVIDENCE COLLECTOR
## SYSTEM ARCHITECTURE

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector  
Document Role: Technical Architecture

---

# 1. 문서 목적

본 문서는 `GEO Search Evidence Collector`의 기술 구조와 구성 요소 간 책임을 정의한다.

본 문서는 다음을 결정한다.

- 시스템을 어떤 Layer로 분리하는가
- 외부 Search Source를 어떻게 연결하는가
- Collector를 어떻게 독립시킬 것인가
- RAW / NORMALIZED / DERIVED 데이터를 어떻게 흐르게 할 것인가
- 데이터를 어떻게 저장할 것인가
- UI와 수집 로직을 어떻게 분리할 것인가
- Export와 GEO Handoff를 어디에서 담당할 것인가
- 외부 Source 변경 시 어느 부분만 수정하면 되는가

구체적인 데이터 필드는 `04_SEARCH_EVIDENCE_SCHEMA.md`에서 정의한다.

구체적인 수집 순서는 `05_WORKFLOW.md`에서 정의한다.

---

# 2. Architecture 목표

본 시스템의 Architecture는 다음 원칙을 만족해야 한다.

1. Source별 Collector가 독립적이어야 한다.
2. 하나의 Collector 실패가 전체 시스템 실패로 이어지지 않아야 한다.
3. RAW Data를 보존해야 한다.
4. NORMALIZED Data와 DERIVED Data를 분리해야 한다.
5. UI가 외부 API 구조를 직접 알아서는 안 된다.
6. 외부 Source 변경 시 해당 Adapter 또는 Collector만 교체할 수 있어야 한다.
7. 동일 Keyword의 여러 Source Evidence를 통합할 수 있어야 한다.
8. Historical Snapshot을 보존할 수 있어야 한다.
9. Export 형식과 내부 저장 구조를 분리해야 한다.
10. 향후 다른 Search Provider를 추가할 수 있어야 한다.
11. 특정 AI 모델이나 GPT에 종속되지 않아야 한다.
12. GEO 후속 시스템으로 구조화된 데이터를 전달할 수 있어야 한다.

---

# 3. 전체 시스템 구조

전체 구조는 다음과 같다.

USER

↓

WEB UI

↓

COLLECTION ORCHESTRATOR

↓

SOURCE PREFLIGHT

↓

SOURCE COLLECTORS / COLLECTOR EXECUTION

↓

RAW EVIDENCE LAYER

↓

PROVIDER ADAPTER / PARSER

↓

NORMALIZATION LAYER

↓

VALIDATION LAYER

↓

KEYWORD MERGE / EVIDENCE AGGREGATION

↓

DERIVED METRICS LAYER

↓

EVIDENCE STORAGE

↓

RESULT VIEW

↓

EXPORT / GEO HANDOFF

각 Layer는 자신의 책임만 수행한다.

---

# 4. 기본 Architecture 원칙

본 프로젝트는 처음부터 거대한 통합 프로그램으로 만들지 않는다.

기능을 다음과 같이 분리한다.

- UI
- Orchestrator
- Collector
- Adapter
- Normalizer
- Validator
- Aggregator
- Calculator
- Repository
- Exporter

각 기능은 가능한 한 서로 독립적으로 유지한다.

예를 들어 NAVER 검색량 API 구조가 변경되더라도 UI, Exporter, Historical Data 전체를 수정해서는 안 된다.

---

# 5. Presentation Layer

Presentation Layer는 사용자가 직접 보는 영역이다.

주요 역할:

- Hub Seed Keyword 입력
- 조사 실행
- Collection 상태 표시
- Keyword Evidence Table 표시
- Source 표시
- 오류 표시
- 과거 Snapshot 조회
- Export 실행

Presentation Layer는 외부 API를 직접 호출하지 않는다.

잘못된 구조:

UI  
→ NAVER API

권장 구조:

UI  
→ Application Service / Orchestrator  
→ Collector  
→ External Source

UI와 데이터 수집 로직을 분리한다.

---

# 6. Application Layer

Application Layer는 사용자의 조사 요청을 받아 전체 작업을 조정한다.

핵심 구성 요소는 `Collection Orchestrator`다.

Collection Orchestrator의 역할:

- Collection Job 생성
- Seed Keyword 전달
- Source Preflight 실행
- 활성 Collector 확인
- Collector 실행
- Collector별 상태 관리
- 결과 취합
- Normalization 실행
- Validation 실행
- Aggregation 실행
- Derived Metric 계산 요청
- 저장 요청
- 최종 결과 반환

Source Preflight는 Collection 실행 전에 다음 상태를 확인할 수 있어야 한다.

- Source 활성 상태
- Credential / Configuration 상태
- Collector 사용 가능 여부
- Source Registry 상태
- 구현 시점에 검증된 Source 설정

외부 API Endpoint, Field, 인증 방식 등 Source의 구체적인 기술 사양은
현재 Architecture에서 확정하지 않는다. 구현 직전에 최신 공식 Documentation을
확인한 뒤 Source별로 확정한다.

Orchestrator 자체가 외부 사이트의 데이터 구조를 해석해서는 안 된다.

그 역할은 Collector 또는 Adapter가 담당한다.

---

# 7. Collection Job

사용자가 Hub Seed Keyword를 입력하고 조사를 실행하면 하나의 `Collection Job`을 생성한다.

예:

- Job ID
- Seed Keyword
- Started At
- Completed At
- Enabled Collectors
- Collector Status
- Overall Status
- Error Summary

하나의 조사 실행 단위를 Job으로 관리한다.

예를 들어 사용자가 `달러`를 오늘 조회하고 한 달 뒤 다시 조회하면 서로 다른 Collection Job으로 저장한다.

과거 결과를 현재 결과로 덮어쓰지 않는다.

---

# 8. Collector Layer

Collector는 특정 Search Evidence Source에서 데이터를 가져오는 독립 모듈이다.

예상 Collector 예:

- Search Ads Keyword Collector
- Search Volume Collector
- Search Trend Collector
- Autocomplete Collector
- Related Search Collector
- SERP Observation Collector
- Document Count Collector

실제 Collector 목록은 `03_DATA_SOURCE_STANDARD.md`에서 확정한다.

Collector의 기본 책임:

1. Query를 받는다.
2. 해당 Source에 요청한다.
3. 응답을 받는다.
4. RAW Response를 보존한다.
5. Source Metadata를 기록한다.
6. 성공 또는 실패 상태를 반환한다.

Collector는 최종 Knowledge 판단을 수행하지 않는다.

---

# 9. Collector Independence

각 Collector는 독립적으로 실행할 수 있어야 한다.

예:

Search Volume Collector: SUCCESS  
Autocomplete Collector: FAILED  
Trend Collector: SUCCESS  
Related Search Collector: PARTIAL_SUCCESS

이 경우 전체 Collection Job을 FAILED로 처리하지 않는다.

Overall Status는 `PARTIAL_SUCCESS`가 될 수 있다.

한 Source의 실패 때문에 이미 수집된 다른 Evidence를 버리지 않는다.

---

# 10. Adapter Layer

외부 Source와 내부 시스템 사이에는 가능한 경우 Adapter를 둔다.

Adapter의 목적은 외부 시스템의 데이터 구조를 내부 구조와 분리하는 것이다.

예:

NAVER Source Response

↓

NAVER Adapter

↓

GEO Collector Data

외부 API 필드명이 변경되더라도 Adapter만 수정하여 내부 Schema에 미치는 영향을 최소화한다.

---

# 11. Source Adapter 원칙

Provider별 구현은 분리한다.

예:

providers/

- naver/
- google/
- youtube/
- bing/

초기에는 NAVER만 구현하더라도 Core Logic 내부에 NAVER 전용 필드를 직접 흩어놓지 않는다.

Provider-specific logic은 Provider Layer 내부에 둔다.

---

# 12. RAW Evidence Layer

Collector가 받은 외부 응답은 먼저 RAW Evidence로 저장한다.

RAW Evidence는 가능한 한 원본을 보존한다.

RAW Evidence 예:

- API Response JSON
- Query
- Provider
- Endpoint 또는 Source Identifier
- Collected At
- HTTP Status
- Collector Version
- Raw Payload
- Error Payload

RAW Evidence는 Normalization 이후에도 삭제하지 않는다.

---

# 13. Normalization Layer

외부 Source마다 다른 데이터 형식을 GEO 공통 Schema로 변환한다.

예를 들어 서로 다른 Source가 다음처럼 표현할 수 있다.

Source A:

`monthlyPcQcCnt`

Source B:

`pc_search_volume`

Normalization 이후에는 공통 필드를 사용한다.

예:

`monthly_search_pc`

Normalizer의 역할은 형식을 통일하는 것이다.

Normalizer는 새로운 Search Evidence를 만들어내지 않는다.

Normalization 이후에는 공통 Validation Layer를 거친다.

Validation Layer는 다음을 확인한다.

- 필수 필드와 데이터 형식
- Source Provenance와 Collection 시점
- Missing, 실제 0, Error 상태의 구분
- Derived Metric 계산에 사용할 수 있는 Evidence인지 여부

Validation을 통과하지 못한 데이터는 정상 Derived Metric 계산에 사용하지 않는다.
다만 RAW Evidence는 보존하고, 실패 상태를 기록하며, 필요한 경우 Error Record를
생성한다. 다른 정상 Evidence와 Collector 처리는 계속할 수 있어야 한다.

---

# 14. Keyword Normalization

Keyword 자체도 정규화가 필요하다.

예:

- 앞뒤 공백 제거
- 불필요한 연속 공백 정리
- Unicode 정규화
- 저장용 Canonical Keyword 생성

그러나 표시용 원문은 가능한 경우 별도로 보존한다.

예:

raw_keyword  
normalized_keyword

정규화 과정에서 검색어 의미를 임의로 변경하지 않는다.

---

# 15. Evidence Aggregation Layer

동일 Keyword가 여러 Source에서 발견될 수 있다.

예:

`달러 환율`

- Search Ads Related
- Autocomplete
- Related Search
- 함께 많이 찾는 검색어

이 경우 Keyword 자체를 네 번 복제하는 것이 아니라 하나의 Keyword Entity에 여러 Evidence를 연결할 수 있어야 한다.

개념 구조:

Keyword

↓

Evidence Source A  
Evidence Source B  
Evidence Source C

따라서 시스템은 `Keyword`와 `Keyword Evidence`를 구분한다.

---

# 16. Keyword Entity

Keyword Entity는 조사에서 발견된 검색어의 대표 단위다.

예상 기본 속성:

- Keyword ID
- Raw Keyword
- Normalized Keyword
- Seed Keyword
- First Seen At
- Last Seen At

Keyword Entity 자체에는 Search Demand의 의미를 과도하게 부여하지 않는다.

검색어가 존재한다는 사실과 검색량이 있다는 사실은 별도 Evidence다.

---

# 17. Evidence Entity

Evidence Entity는 특정 Source에서 관찰된 사실을 저장한다.

예:

Keyword: 달러 환율  
Evidence Type: AUTOCOMPLETE  
Provider: NAVER  
Collected At: YYYY-MM-DD  
Observed: TRUE

또는:

Keyword: 달러 환율  
Evidence Type: MONTHLY_SEARCH_VOLUME  
Provider: NAVER  
PC: value  
Mobile: value

동일 Keyword에 여러 Evidence Entity가 연결될 수 있다.

---

# 18. Derived Metrics Layer

DERIVED 값은 원본 Source에서 직접 제공된 값과 분리한다.

예:

- Total Search Volume
- Competition Ratio
- Mobile Share
- Trend Change
- 기타 계산값

기본 흐름:

RAW VALUE

↓

NORMALIZED VALUE

↓

VALIDATED VALUE

↓

DERIVED VALUE

Derived Calculator는 검증된 입력만 계산하며 계산만 담당한다.

Source Data를 수정하지 않는다.

중요 Derived Metric은 단순 계산 결과만 저장하지 않는다. 최소한 다음 정보를
추적할 수 있어야 한다.

- formula
- formula_version
- input_evidence_ids
- calculated_at
- status

다음 Provenance Chain이 끊어지지 않아야 한다.

DERIVED METRIC
→ NORMALIZED EVIDENCE
→ RAW EVIDENCE
→ SOURCE

---

# 19. 계산 공식 Version 관리

계산식은 향후 변경될 수 있다.

따라서 중요한 Derived Metric에는 가능한 경우 계산 Version을 기록한다.

예:

metric: competition_ratio  
formula: configured formula or NOT_CONFIGURED  
formula_version: configured version or NOT_CONFIGURED

향후 계산식을 변경해도 과거 값이 어떤 방식으로 계산되었는지 알 수 있어야 한다.

Competition Ratio는 DERIVED Metric이며 검증된 입력 Evidence만 사용한다.
다만 기존 GEO Formula의 Source of Truth가 확인되기 전에는 계산식을 확정하지
않는다. Formula가 확인되지 않은 상태에서는 `NOT_CONFIGURED`와 같은 상태를
기록할 수 있어야 한다. Search Result Total과 Search Volume Evidence의
수집·저장은 Formula 확정 여부와 분리한다.

---

# 20. Storage Layer

Storage Layer는 다음 데이터를 보존한다.

- Collection Job
- Seed Keyword
- Keyword Entity
- RAW Evidence
- NORMALIZED Evidence
- DERIVED Metrics
- Source Metadata
- Collector Status
- Errors
- Export History

초기 저장 방식은 단순하게 시작할 수 있다.

그러나 데이터 구조는 향후 Database로 이전할 수 있도록 설계한다.

---

# 21. Storage 원칙

데이터 저장은 다음 원칙을 따른다.

1. 과거 Snapshot을 덮어쓰지 않는다.
2. RAW Evidence를 보존한다.
3. Derived Data를 Source Data와 분리한다.
4. Collection Date를 기록한다.
5. Provider를 기록한다.
6. 실패 상태도 기록한다.
7. 동일 Keyword의 Historical 변화 추적이 가능해야 한다.

---

# 22. Snapshot Architecture

Search Evidence는 시간에 따라 변한다.

따라서 데이터는 단순 Current State가 아니라 Snapshot 구조를 가진다.

예:

달러 환율

2026-09-28 Snapshot  
2026-10-28 Snapshot  
2026-11-28 Snapshot

각 Snapshot은 독립된 Collection Job과 연결한다.

이를 통해 향후 Search Demand 변화를 비교할 수 있다.

---

# 23. Repository Layer

Application Logic이 실제 저장 기술에 직접 의존하지 않도록 Repository Layer를 둔다.

예:

CollectionRepository  
KeywordRepository  
EvidenceRepository  
SnapshotRepository  
Error Record / Error Registry

초기에는 Local File 또는 SQLite 등을 사용할 수 있고, 향후 다른 Database로 변경할 수 있다.

저장 기술 변경이 Collector나 UI 전체 변경으로 이어지지 않도록 한다.

---

# 24. Export Layer

Export는 내부 Database 구조를 그대로 외부에 노출하는 기능이 아니다.

Exporter가 내부 데이터를 목적별 형식으로 변환한다.

예상 General Exporter:

- JSON Exporter
- Markdown Exporter
- CSV Exporter
- XLSX Exporter

Exporter는 SEARCH EVIDENCE PACK 또는 Canonical Evidence를 목적별 형식으로
변환하며 Search Evidence를 새로 생성하거나 판단하지 않는다.

이미 저장된 Evidence를 목적에 맞게 표현한다.

---

# 25. SEARCH EVIDENCE PACK Builder

`SEARCH EVIDENCE PACK Builder`는 Canonical Evidence를 조합하여
`SEARCH EVIDENCE PACK`을 생성한다.

입력:

- Collection Job
- Keyword Data
- Evidence
- Derived Metrics
- Source Metadata
- Error Status

출력:

`SEARCH EVIDENCE PACK`

Pack Builder는 다음을 명확하게 구분해야 한다.

- 실제 수집 데이터
- 계산 데이터
- 수집 실패
- 데이터 없음
- Source
- Collection Date

Pack Builder는 Search Intent, User Question, Knowledge Node 등을 판단하지
않으며 새로운 Search Evidence를 생성하지 않는다.

---

# 26. Strategy Converter Adapter

향후 Strategy Converter와 직접 연결할 경우 별도의 Adapter를 둔다.

구조:

SEARCH EVIDENCE PACK

↓

Strategy Converter Adapter

↓

Strategy Converter Input

이 Adapter는 전달 형식만 변환하여 GEO Handoff를 수행한다.

새로운 Search Evidence를 생성하지 않으며 Search Intent, User Question,
Knowledge Node 등을 자체적으로 결정하지 않는다. 이러한 판단은 Strategy
Converter 이후 GEO Layer의 책임이다.

---

# 27. AI Integration Layer

AI 기능이 향후 필요해질 경우 Core Collector와 분리한다.

예상 AI 활용:

- 중복 Keyword 후보 표시
- Keyword 표현 정리 후보
- Evidence Pack 설명 생성
- 사람이 검토할 이상값 표시

AI는 별도 Optional Layer로 둔다.

구조:

Evidence Data

↓

Optional AI Processing

↓

AI_DERIVED Output

AI 결과는 Source Evidence를 덮어쓰지 않는다.

AI 기능이 중단되어도 기본 Search Evidence Collection은 정상 동작해야 한다.

---

# 28. Error Architecture

오류는 Source별로 관리한다.

기본 Error Category 예:

- AUTH_ERROR
- RATE_LIMIT
- TIMEOUT
- NETWORK_ERROR
- SOURCE_CHANGED
- PARSE_ERROR
- NO_RESULT
- VALIDATION_ERROR
- UNKNOWN_ERROR

오류 발생 시 가능한 경우 다음을 기록한다.

- Collector
- Provider
- Query
- Error Type
- Error Message
- Occurred At
- Retryable 여부

Error는 단순 Log가 아니라 Collection 및 Collector 실행 결과와 연결되는
구조화된 Error Record로 Canonical Evidence 구조에 보존한다.

개념 구조:

Collection
→ Keyword
→ Evidence
→ Source
→ Derived Metric
→ Error

Error Record는 해당 Collection, Collector, Source, Keyword 또는 Evidence와
연결할 수 있어야 한다. Error Registry는 이 Error Record를 조회·관리하기
위한 구조이며, 별도의 복잡한 Error System으로 Collection 흐름과 분리하지
않는다.

---

# 29. Job Status

Collection Job은 다음 상태를 사용할 수 있다.

- PENDING
- RUNNING
- SUCCESS
- PARTIAL_SUCCESS
- FAILED

Collector별 상태는 별도로 관리한다.

하나 이상의 Collector가 성공하고 일부 Collector가 실패한 경우 `PARTIAL_SUCCESS`를 사용할 수 있다.

---

# 30. Retry 원칙

일시적인 오류는 재시도할 수 있다.

예:

- Timeout
- Temporary Network Error
- 일부 Rate Limit

그러나 무한 재시도하지 않는다.

인증 오류, Source 구조 변경, Parsing 오류 등은 무조건 반복 호출하기보다 오류를 기록하고 사용자에게 표시한다.

구체적인 Retry 정책은 개발 단계에서 설정한다.

---

# 31. Rate Limit 보호

외부 API에는 호출 제한이 존재할 수 있다.

따라서 Collector는 다음 기능을 고려한다.

- 요청 간격 제어
- Batch 요청
- Retry Delay
- Rate Limit Error 처리
- 불필요한 중복 요청 방지
- 동일 Job 내 Cache

API 제한을 피하기 위해 데이터 정확성을 훼손해서는 안 된다.

---

# 32. Cache Layer

동일한 Collection Job 안에서 같은 Source에 동일 Query를 반복 호출하지 않도록 단기 Cache를 사용할 수 있다.

Cache 사용 시 다음을 구분한다.

- 현재 Job용 Temporary Cache
- Historical Snapshot
- Persistent Evidence

Cache 데이터를 새로운 공식 수집값처럼 저장하지 않는다.

Cache Hit 여부를 추적할 수 있도록 설계할 수 있다.

---

# 33. Security Architecture

API Key, Secret, Token은 코드에 직접 저장하지 않는다.

권장 구조:

Application

↓

Environment / Secret Store

↓

Provider Authentication

Repository 또는 Git에 다음을 저장하지 않는다.

- API Secret
- Access Token
- Private Credential
- Password

Log에도 Secret을 출력하지 않는다.

---

# 34. Logging

시스템은 개발 및 운영 문제를 추적할 수 있도록 Log를 남긴다.

기본 Log 대상:

- Collection Job 시작
- Collection Job 종료
- Collector 실행
- Collector 성공
- Collector 실패
- 요청 시간
- 응답 상태
- Normalization 오류
- Export 성공/실패

민감한 인증정보는 Log에 남기지 않는다.

---

# 35. Observability

초기에는 복잡한 Monitoring System을 만들 필요가 없다.

그러나 최소한 다음은 확인할 수 있어야 한다.

- 어떤 Collector가 실패했는가
- 어느 Query에서 실패했는가
- 언제 실패했는가
- 얼마나 걸렸는가
- 결과가 몇 건 수집됐는가

사용자가 결과가 이상할 때 원인을 추적할 수 있어야 한다.

---

# 36. External Source 변경 대응

Search Provider의 API 또는 UI는 변경될 수 있다.

따라서 외부 Source 변경 대응은 다음 구조를 따른다.

External Source 변경

↓

해당 Provider Adapter / Collector 수정

↓

Normalization 확인

↓

Regression Test

↓

기존 Core System 유지

Source 하나의 변경 때문에 전체 Architecture를 다시 작성하지 않는다.

---

# 37. SERP Collector 격리

자동완성, 관련검색어, 함께 많이 찾는 검색어 등 일부 Evidence는 웹 UI 또는 별도의 Search Interface 변화에 영향을 받을 수 있다.

이러한 Collector는 안정적인 공식 API Collector와 분리한다.

예:

STABLE COLLECTORS

- Official API Collector
- Official Trend Collector

CHANGE-SENSITIVE COLLECTORS

- Autocomplete Collector
- SERP Related Collector
- SERP Observation Collector

Change-sensitive Collector가 실패해도 Stable Collector는 정상 동작해야 한다.

---

# 38. Provider 확장 구조

향후 Provider가 추가될 수 있다.

예:

NAVER  
Google  
YouTube  
Bing

권장 개념 구조:

core/

- domain
- normalization
- aggregation
- metrics
- storage
- export

providers/

- naver
- google
- youtube
- bing

Provider-specific 구현과 Core GEO Logic을 분리한다.

---

# 39. UI와 Backend 분리

초기 버전이 작은 Local App이라도 UI와 Core Logic을 분리한다.

UI는 다음 요청만 한다.

- 조사 시작
- 조사 상태 조회
- 결과 조회
- Snapshot 조회
- Export 요청

UI가 Search Provider의 인증 방식이나 API Response 구조를 직접 처리하지 않는다.

---

# 40. API Layer

필요한 경우 내부 Application API를 둘 수 있다.

개념 Endpoint 예:

POST /collections  
GET /collections/{job_id}  
GET /collections/{job_id}/keywords  
GET /collections/{job_id}/evidence  
GET /collections/{job_id}/errors  
GET /collections/{job_id}/export

실제 Endpoint 구조는 구현 기술과 MVP 범위에 따라 결정한다.

본 문서의 Endpoint 예시는 강제 규격이 아니다.

---

# 41. 기술 스택 결정 원칙

본 문서는 특정 Framework를 헌법처럼 고정하지 않는다.

기술 선택은 다음 순서로 판단한다.

1. 개발 속도
2. 유지보수성
3. API 연동 편의성
4. 데이터 처리 편의성
5. Local 개발 편의성
6. Export 기능
7. 향후 확장성
8. 배포 필요성

초기 내부 도구에 과도한 Infrastructure를 도입하지 않는다.

---

# 42. Local First 원칙

초기 프로젝트는 GEO 운영자 1인이 사용하는 내부 도구이므로 Local First 구현이 가능하다.

초기 단계에서 반드시 다음을 도입할 필요는 없다.

- Cloud Database
- Multi-user Authentication
- Kubernetes
- Microservices
- Complex Queue
- Enterprise Monitoring

그러나 Core Logic은 향후 Web Deployment로 이전할 수 있도록 UI와 분리한다.

---

# 43. Monolith First

초기 버전은 하나의 관리 가능한 Application으로 시작한다.

Microservice Architecture를 사용하지 않는다.

대신 내부 Module Boundary를 명확히 한다.

예:

Application

- UI
- Core
- Collectors
- Providers
- Storage
- Export

배포 단위는 하나여도 내부 책임은 분리한다.

---

# 44. 비동기 처리

외부 Source가 여러 개일 경우 수집 시간이 길어질 수 있다.

향후 Collector를 병렬 또는 비동기로 실행할 수 있도록 구조를 고려한다.

그러나 MVP에서 복잡한 Queue System을 먼저 구축하지 않는다.

우선 정확한 End-to-End 수집을 완성한다.

필요성이 확인되면 성능 최적화를 진행한다.

---

# 45. Data Flow

기본 Data Flow는 다음과 같다.

Hub Seed 입력

↓

Collection Job 생성

↓

Source Preflight

↓

Collector 실행

↓

Provider Response

↓

RAW Evidence 저장

↓

Provider Adapter / Parser

↓

Normalization

↓

Validation

↓

Keyword Merge

↓

Evidence Aggregation

↓

Derived Metric 계산

↓

Normalized / Derived Data 저장

↓

Result View 생성

↓

SEARCH EVIDENCE PACK 생성

↓

General Export 또는 Strategy Converter Adapter / GEO Handoff

---

# 46. Source Failure Data Flow

Collector가 실패하는 경우:

Hub Seed

↓

Collection Job

↓

Collector A SUCCESS  
Collector B FAILED  
Collector C SUCCESS

↓

성공 RAW Data 보존

↓

실패 Error Record 보존

↓

정상 데이터만 Normalization 및 Validation 이후 Derived Calculation

↓

PARTIAL_SUCCESS

↓

Result View

↓

Evidence Pack + Error Information

실패 Source 때문에 성공 Source의 데이터를 버리지 않는다.

---

# 47. Historical Data Flow

동일 Seed를 다시 조사할 경우:

기존 Snapshot

+

새 Collection Job

↓

새 Snapshot 생성

↓

기존 Snapshot 보존

↓

필요 시 비교

과거 Evidence를 최신 Evidence로 덮어쓰지 않는다.

---

# 48. Suggested Project Structure

실제 폴더 구조는 구현 과정에서 조정할 수 있으나 기본 방향은 다음과 같다.

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
- validators/
- metrics/
- repositories/
- exporters/
- handoff/
- ui/

data/

- raw/
- snapshots/
- exports/

tests/

output/

README.md

실제 Framework가 결정되면 Framework 관례에 맞게 조정할 수 있다.

그러나 역할 분리 원칙은 유지한다.

---

# 49. Core Domain과 Infrastructure 분리

Core Domain은 외부 API의 세부 구현을 몰라야 한다.

Core가 알아야 하는 것:

- Keyword
- Evidence
- Source
- Snapshot
- Collection Job
- Metric
- Status

Core가 직접 알아서는 안 되는 것:

- 특정 Provider 인증 Header
- 특정 API Endpoint
- 특정 HTML Selector
- 특정 웹페이지 DOM 구조

이 정보는 Infrastructure / Provider Layer에 둔다.

---

# 50. Test Architecture

테스트는 최소 다음 영역을 분리한다.

## Unit Test

- Keyword Normalization
- Derived Metric 계산
- Evidence Merge
- Status 계산
- Export 변환

## Collector Test

- Provider Response Parsing
- Error Handling
- Empty Response
- Unexpected Response

## Integration Test

- Seed 입력
- Collector 실행
- 저장
- 결과 생성
- Export

## Regression Test

외부 Source 변경 또는 Adapter 수정 후 기존 기능이 깨지지 않는지 확인한다.

---

# 51. Mock Data

외부 API 없이도 개발과 테스트가 가능하도록 Mock Response를 사용할 수 있어야 한다.

목적:

- API 호출 비용 감소
- Rate Limit 보호
- Offline 개발
- Parser Test
- UI Test
- Error Scenario Test

Mock Data는 실제 Evidence와 혼합 저장하지 않는다.

---

# 52. MVP Architecture

MVP 1에서는 Architecture 전체를 모두 구현할 필요가 없다.

MVP 1의 최소 구조는 다음과 같다.

UI

↓

Collection Service / Orchestrator

↓

Source Preflight

↓

Search Demand Collector

↓

RAW Response

↓

Provider Adapter / Parser

↓

Normalizer

↓

Validator

↓

Derived Calculator

↓

Local Storage

↓

Result Table

↓

Export

또는

SEARCH EVIDENCE PACK

↓

Strategy Converter Adapter / GEO Handoff

이 흐름이 먼저 End-to-End로 작동해야 한다. Competition Ratio Formula가
확정되지 않은 경우에도 Search Demand Evidence의 RAW 보존부터 Export까지를
완성하며, Ratio 계산을 MVP 필수 성공 조건으로 강제하지 않는다.

---

# 53. Phase 2 Architecture

Search Entrance Collector를 추가한다.

MVP 1

+

- Autocomplete Collector
- Related Search Collector
- SERP Observation Collector

각 Collector는 독립적으로 추가한다.

기존 Search Demand Collector를 수정하여 기능을 억지로 합치지 않는다.

---

# 54. Phase 3 Architecture

Trend Layer를 추가한다.

기존 Keyword Entity에 Trend를 직접 덮어쓰는 대신 별도 Evidence로 연결한다.

Keyword

↓

Search Volume Evidence

↓

Trend Evidence

↓

Search Entrance Evidence

↓

Competition Evidence

하나의 Keyword가 여러 종류의 Evidence를 가진다.

---

# 55. Phase 4 Architecture

GEO Handoff Layer를 추가한다.

Evidence Repository

↓

SEARCH EVIDENCE PACK Builder

↓

Markdown / JSON

↓

Strategy Converter Adapter

General Export와 Strategy Converter Adapter는 SEARCH EVIDENCE PACK을
소비하며 새로운 Evidence를 생성하지 않는다. 이 단계에서도 Collector와
Planner를 직접 결합하지 않는다.

---

# 56. Phase 5 Architecture

새로운 Provider를 추가한다.

예:

Google Provider

↓

Google Collectors

↓

기존 Normalization Layer

↓

기존 Evidence Schema

↓

기존 Storage

↓

기존 Export

새 Provider 추가 때문에 Core Schema를 전면 재작성해야 한다면 Architecture가 잘못된 것으로 본다.

---

# 57. Architecture에서 금지하는 구조

다음 구조를 피한다.

- UI에서 외부 API 직접 호출
- 하나의 거대한 Collector가 모든 Source 처리
- RAW Data 없이 계산 결과만 저장
- Provider별 데이터가 서로 다른 형태로 Core에 퍼지는 구조
- API 실패를 0으로 변환
- Keyword와 Evidence를 동일 Entity로 취급
- 최신 데이터로 과거 Snapshot 덮어쓰기
- AI 결과를 Source Evidence에 직접 병합
- 특정 GPT 응답 형식에 Database를 종속
- 특정 Provider 하나에 전체 시스템을 종속
- 외부 HTML Selector를 Core Logic에 직접 작성
- MVP 단계에서 불필요한 Microservice 구축

---

# 58. Architecture Decision 원칙

구현 중 두 가지 방법 중 선택해야 할 경우 다음 질문을 적용한다.

1. 어느 구조가 RAW Evidence를 더 안전하게 보존하는가?
2. 어느 구조가 Source를 더 명확하게 추적할 수 있는가?
3. 어느 구조가 Source 변경 영향을 더 작게 만드는가?
4. 어느 구조가 부분 실패를 허용하는가?
5. 어느 구조가 Historical Snapshot을 보존하기 쉬운가?
6. 어느 구조가 GEO Handoff를 단순하게 만드는가?
7. 어느 구조가 현재 1인 운영에 과도하지 않은가?

가장 복잡한 Architecture가 가장 좋은 Architecture는 아니다.

---

# 59. Architecture 완료 기준

본 Architecture는 다음 시나리오를 지원할 수 있어야 한다.

사용자가 Hub Seed Keyword를 입력한다.

↓

Collection Job이 생성된다.

↓

여러 Collector가 독립적으로 실행된다.

↓

각 Source의 RAW Evidence가 보존된다.

↓

데이터가 공통 Schema로 정규화된다.

↓

Validation을 통과한 Evidence만 다음 계산 단계로 진행한다.

↓

동일 Keyword의 여러 Evidence가 통합된다.

↓

필요한 Derived Metric이 계산된다.

↓

Snapshot이 저장된다.

↓

사용자가 결과를 검토한다.

↓

SEARCH EVIDENCE PACK을 생성한다.

↓

Legacy Strategy Converter 또는 Final Planner Handoff로 전달한다.

이 과정에서 하나의 Collector가 실패해도 가능한 결과는 유지되어야 한다.

---

# 60. 최종 Architecture 정의

`GEO Search Evidence Collector`의 Architecture는

**외부 검색 플랫폼에서 Evidence를 수집하는 Provider Layer와,
이를 GEO 공통 데이터로 변환하는 Core Layer와,
저장·검토·Export하는 Application Layer를 분리하는 구조**

를 기본으로 한다.

핵심 구조는 다음과 같다.

SOURCE  
→ COLLECT  
→ RAW  
→ NORMALIZE  
→ VALIDATE  
→ AGGREGATE  
→ DERIVE  
→ STORE  
→ REVIEW  
→ SEARCH EVIDENCE PACK  
→ GENERAL EXPORT 또는 GEO HANDOFF

Architecture의 최우선 목표는 화려한 기술 구조가 아니다.

최우선 목표는 다음 네 가지다.

**Source가 바뀌어도 고칠 수 있을 것.**

**일부 수집이 실패해도 나머지는 살아 있을 것.**

**원본 Evidence를 잃지 않을 것.**

**수집된 Evidence가 GEO의 다음 단계로 그대로 이동할 것.**

---

# 61. Multi-Source Collection 책임 경계

하나의 Hub Seed Keyword 조사에서 Collection은 하나의 Hub Research Session이자
Collection Job의 실행 단위다.

- Collection ID는 상위 Application / Collection Orchestrator가 한 번 생성한다.
- Collector는 Collection ID를 생성하지 않는다.
- 모든 Collector는 전달받은 동일한 `collection_id`를 사용한다.
- Source별 실행은 Collection 내부 Source Run으로 구분한다.
- Source별 RAW는 독립 보존하고 Source Provenance를 연결한다.
- 일부 Source가 실패해도 정상 Source의 RAW와 Evidence를 유지한다.

Collection Orchestrator는 Collection 단위 Evidence/Metric ID Generator를 소유한다.
따라서 여러 Source가 생성하는 ID Sequence는 Collection 내부에서 충돌하지 않는다.

새 Multi-Source Collection의 RAW와 Snapshot은 다음 물리적 경계를 따른다.

```text
data/raw/<collection_id>/<source_run_id>.json
data/snapshots/<collection_id>/v<snapshot_version>.json
```

Collection Snapshot은 Source Runs, Canonical Evidence, Derived Metrics, Errors와
각 RAW Reference를 하나의 Collection lineage로 연결한다.
상세 Source Run, Retry, Version 계약은 `04_SEARCH_EVIDENCE_SCHEMA.md`를 따른다.

---

## 62. SEARCH EVIDENCE PACK Projection Boundary

`SEARCH EVIDENCE PACK Builder`는 Versioned Collection Snapshot을 읽어 Reviewer와 Strategy Converter가
사용할 수 있는 Keyword Candidate 중심 Projection을 생성한다.

Pack Builder는 다음 책임을 갖지 않는다.

- Collector 또는 Provider 호출
- RAW 또는 Snapshot 수정
- Evidence 의미 재계산
- Keyword Ranking 또는 추천
- Search Intent, User Question, Knowledge Node 판단
- Strategy Converter 실행

구조적 경계는 다음과 같다.

```text
Snapshot Repository
  → Pack Builder / Pack Repository
  → Result / Review UI
  → GEO Handoff
  → Legacy / Intermediate Handoff 또는 Final Planner Handoff
```

Pack은 Snapshot Payload와 논리적으로 분리된 Projection이다. 현재 구현 및 Historical Compatibility를
위해 Pack Repository의 물리적 경로는 다음을 사용한다.

```text
data/snapshots/<collection_id>/pack-v<pack_version>.json
```

이는 Snapshot 파일 `v<snapshot_version>.json`을 대체하거나 Snapshot Repository가 Snapshot Payload에
Pack을 삽입한다는 뜻이 아니다. `data/exports/`는 General Export Projection 경계로 유지한다.

Pack은 Core Source와 Optional Source를 구분한다. Optional DataLab Trend가 `NOT_COLLECTED` 또는
실패해도 Core Evidence가 유효하면 Core Pack을 폐기하지 않는다. Pack의 배열 순서는 결정론적
Canonical Keyword 순서이며 Ranking을 의미하지 않는다.

---
## 62.1 Current Target Research Layer

기존 Evidence Pipeline을 폐기하거나 재설계하지 않는다. Current Target
Architecture는 다음 Research Layer를 기존 구조 위에 추가한다.

```text
Hub Context
  + Planner Hypothesis
  + Reviewer Research Direction
    -> Research Context / Research Seed
    -> Existing Evidence Infrastructure
    -> Research Gate / Deep Research / Research Artifact
    -> Evidence Compression
    -> Final Planner Handoff
    -> Network Planner Final Judgment
```

Hub Context / Hub Seed는 실제 Provider Query인 Search Seed와 구분한다.
기존 `seedKeyword`는 Legacy/current Provider Query Contract로 유지하며,
문서 정렬을 이유로 제거하거나 rename하지 않는다.

기존 Review Selection 기반 Handoff는 Intermediate Handoff로 구분한다.
08의 Final Planner Handoff는 별도의 최종 Planner용 Projection이며 기존
Handoff Artifact의 의미를 소급 변경하지 않는다.

## 62.2 Competition Ratio Protection

Research Layer 추가와 관계없이 Competition Ratio는 다음 상태를 유지한다.

```text
formula = NOT_CONFIGURED
formula_version = NOT_CONFIGURED
status = NOT_CONFIGURED
```

Provider Competition, Search Volume, Search Result Total을 결합하여
Competition Ratio를 생성하지 않는다.

## 63. Review Selection Boundary

SEARCH EVIDENCE PACK은 읽기 전용 Review Input이다. Human Review 결과는 별도 ReviewSelectionRepository가 저장하며 Pack Repository와 분리한다. GEO Handoff는 Review Selection과 Pack을 참조하는 별도 경계다.

Pack Repository
  → ReviewSelectionRepository
  → GEO Handoff Repository
  → Legacy / Intermediate Handoff 또는 Final Planner Handoff

Review Selection은 Versioned Artifact이며 기존 Version을 overwrite하지 않는다. UI는 Application/Repository 경계를 통해서만 Review를 읽고 저장한다.
