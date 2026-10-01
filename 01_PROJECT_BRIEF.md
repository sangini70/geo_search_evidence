# GEO SEARCH EVIDENCE COLLECTOR
## PROJECT BRIEF

Version: 1.0  
Status: ACTIVE  
Project: GEO PROJECT  
System: GEO Search Evidence Collector

---

# 1. 프로젝트 개요

`GEO Search Evidence Collector`는 GEO PROJECT에서 Search Demand를 조사할 때 발생하는 반복적인 검색·조회·복사·정리 작업을 자동화하기 위한 Search Evidence 수집 시스템이다.

사용자는 하나의 `Hub Seed Keyword`를 입력한다.

시스템은 해당 Keyword를 중심으로 이용 가능한 검색 데이터 Source에서 Evidence를 수집하고, 이를 하나의 표준 형식으로 정규화하여 `SEARCH EVIDENCE PACK`을 생성한다.

이 Pack은 Historical / MVP 경로에서는 GEO Strategy Converter의 입력자료로
사용할 수 있다. Current Target Architecture에서는 Pack이 Review와 Research
Artifact의 입력이 되며, 최종 Planner 전달은 Final Planner Handoff가 담당한다.

---

# 2. 프로젝트가 해결하려는 문제

현재 GEO Search Demand 조사 과정에는 사람이 직접 수행하는 반복 작업이 많다.

예를 들어 `달러`를 조사할 경우 다음 작업이 발생한다.

1. 네이버에서 `달러` 검색
2. 자동완성 확인
3. 관련 검색어 확인
4. 함께 많이 찾는 검색어 확인
5. 연관키워드 수집
6. PC 검색량 조회
7. 모바일 검색량 조회
8. 총 검색량 계산
9. 문서수 조회
10. 경쟁 관련 지표 계산
11. 검색 추이 확인
12. Excel에 복사
13. 중복 Keyword 정리
14. Strategy Converter에 전달할 자료 작성

Hub Keyword가 늘어날수록 이 과정은 반복된다.

문제는 분석 자체보다 **데이터를 찾고 옮기고 정리하는 작업에 시간이 많이 사용된다는 것**이다.

본 프로젝트는 이 반복 작업을 줄인다.

---

# 3. 해결 방향

사용자가 `달러`와 같은 Hub Seed Keyword를 입력한다.

시스템은 다음 흐름으로 가능한 Search Evidence를 자동 수집한다.

Hub Seed Keyword  
→ Keyword Discovery  
→ Search Demand  
→ Search Trend  
→ Search Entrance  
→ Competition Evidence  
→ Normalization  
→ SEARCH EVIDENCE PACK

사용자는 여러 웹사이트와 Excel을 오가며 데이터를 직접 복사하는 대신 **하나의 화면에서 Search Evidence를 검토하고 Export한다.**

---

# 4. 핵심 사용자

초기 버전의 핵심 사용자는 GEO PROJECT 운영자 1인이다.

따라서 초기 개발에서는 다음을 구현하지 않는다.

- 다중 사용자
- 회원가입
- 권한관리
- 사용자별 Workspace
- 결제
- SaaS 기능

현재 목적은 외부 서비스 판매가 아니라 **GEO PROJECT 내부 Research Workflow의 생산성을 높이는 것**이다.

---

# 5. 핵심 사용 시나리오

대표적인 사용 흐름은 다음과 같다.

## STEP 1 — Hub Seed 입력

사용자가 조사할 Keyword를 입력한다.

예:

- 달러
- 엔화
- 환율
- 로보어드바이저
- ETF

## STEP 2 — 조사 실행

사용자가 `GEO 조사` 또는 이에 해당하는 실행 버튼을 누른다.

시스템은 활성화된 Collector를 실행한다.

## STEP 3 — Keyword Discovery

Seed Keyword와 관련된 검색어를 수집한다.

가능한 Source 예:

- 검색광고 연관키워드
- 자동완성
- 관련검색어
- 함께 많이 찾는 검색어

각 Keyword에는 발견 Source를 기록한다.

동일 Keyword가 여러 Source에서 발견될 경우 중복 행을 무조건 생성하는 대신 하나의 Keyword에 여러 Evidence Source를 연결할 수 있어야 한다.

예:

달러 환율

- Search Ads Related: YES
- Autocomplete: YES
- Related Search: YES

## STEP 4 — Search Demand 조회

발견된 Keyword에 대해 가능한 검색량 데이터를 수집한다.

핵심 항목:

- Keyword
- PC Search Volume
- Mobile Search Volume
- Total Search Volume

`Total Search Volume`이 Source에서 직접 제공되지 않고 PC + Mobile로 계산되는 경우 `DERIVED` 데이터로 구분한다.

## STEP 5 — Competition Evidence 조회

가능한 경우 다음 정보를 수집한다.

- Document Count
- Competition Data

기존 GEO Workflow에서 사용하는 `competition_ratio`가 필요한 경우 원본 값과 계산 값을 분리하여 저장한다.

계산 공식은 `04_SEARCH_EVIDENCE_SCHEMA.md`에서 정의한다.

## STEP 6 — Trend 확인

지원되는 Source가 존재할 경우 검색 추이를 수집한다.

예:

- 최근 12개월
- 최근 24개월
- 일간
- 주간
- 월간
- PC
- Mobile

절대 검색량과 상대 검색 Trend를 혼동하지 않는다.

## STEP 7 — 결과 검토

사용자는 하나의 결과 화면에서 Keyword별 Evidence를 확인한다.

예시 필드:

| Keyword | PC | Mobile | Total | Documents | Ratio | Autocomplete | Related |
|---|---:|---:|---:|---:|---:|---|---|
| 달러 |  |  |  |  |  | ✓ | ✓ |
| 달러 환율 |  |  |  |  |  | ✓ | ✓ |
| 원달러 환율 |  |  |  |  |  |  | ✓ |
| 달러 인덱스 |  |  |  |  |  | ✓ |  |
| 달러 환전 |  |  |  |  |  | ✓ | ✓ |

사용자는 어떤 값이 다음 중 어디에 해당하는지 확인할 수 있어야 한다.

- 원본 데이터
- 계산 데이터
- Source
- 수집 실패 데이터

---

# 6. 핵심 산출물

본 프로젝트의 핵심 산출물은 `SEARCH EVIDENCE PACK`이다.

단순 Keyword 목록이 아니다.

Pack에는 최소한 다음 정보가 포함된다.

- Hub Seed Keyword
- Collection Date
- Discovered Keywords
- Search Volume
- Search Trend
- Competition Evidence
- Autocomplete Evidence
- Related Search Evidence
- Source
- Collection Status
- Errors
- Derived Metrics

이 Pack은 사람이 검토할 수 있어야 하며 후속 GEO 시스템에서도 사용할 수 있어야 한다.

---

# 7. Export

최종 결과는 최소 다음 형식을 고려한다.

## JSON

시스템 간 전달용이다.

특히 Strategy Converter 및 향후 자동 Pipeline 연결에 사용한다.

## Markdown

ChatGPT / GPT / Planner / Reviewer 등에 직접 입력하기 위한 사람이 읽을 수 있는 형식이다.

## CSV

Excel 및 데이터 분석용이다.

## XLSX

기존 GEO Keyword 조사 Workflow와의 호환용이다.

MVP에서 모든 형식을 동시에 구현할 필요는 없다.

구현 우선순위는 별도 Workflow와 Development Plan에서 정한다.

---

# 8. Strategy Converter Handoff

Search Evidence Collector의 중요한 목적 중 하나는 Strategy Converter 입력자료를 자동 생성하는 것이다.

현재는 사람이 다음과 같은 자료를 직접 정리한다.

- 키워드
- PC 검색량
- 모바일 검색량
- 총 검색량
- 문서수
- 경쟁도
- 자동완성
- 연관검색어

향후에는 시스템이 다음 구조의 자료를 생성한다.

# SEARCH EVIDENCE PACK

## HUB SEED

Hub Seed Keyword를 기록한다.

## COLLECTION

- Date
- Provider
- Status

## KEYWORD DATA

Keyword별 Search Demand 데이터를 기록한다.

## AUTOCOMPLETE

자동완성 Evidence를 기록한다.

## RELATED SEARCHES

관련검색어 Evidence를 기록한다.

## SEARCH TREND

검색 추이를 기록한다.

## COMPETITION

Competition Evidence를 기록한다.

## COLLECTION ERRORS

수집 실패 및 오류를 기록한다.

Strategy Converter는 이 Pack을 입력받아 다음 구조로 해석한다.

Search Demand  
→ Search Entrance  
→ User Question  
→ Evergreen Knowledge

Collector가 이 판단을 대신하지 않는다.

---

# 9. 현재 GEO Workflow와의 관계

현재 GEO Workflow의 기본 흐름은 다음과 같다.

이 흐름은 Historical / MVP Workflow 기록이다. Current Target Architecture의
Research Layer와 Final Planner Handoff는 `08_RESEARCH_ALGORITHM.md`의
단계적 구현 범위를 따른다.

Keyword / Issue Discovery  
→ Search Evidence Collector  
→ Strategy Converter 1차  
→ Search Data Verification  
→ Strategy Converter 2차  
→ Hub Planner  
→ Research  
→ Writer

실제 운영 과정에서 단계가 변경될 수 있으므로 Collector가 특정 GPT나 특정 AI 모델에 강하게 종속되지 않도록 한다.

---

# 10. Keyword Fighter와의 관계

기존 `Keyword Fighter`와 Search Evidence Collector는 역할이 다르다.

## Keyword Fighter

주제와 Keyword를 발견하는 도구다.

핵심 질문:

> 무엇을 조사해 볼 것인가?

## Search Evidence Collector

실제 Search Evidence를 수집하는 도구다.

핵심 질문:

> 사람들이 실제로 무엇을 찾고 있는가?

따라서 두 시스템은 경쟁 관계가 아니다.

향후 연결 구조:

Keyword Fighter  
→ Hub / Seed 후보  
→ Search Evidence Collector  
→ 실제 Search Evidence  
→ Strategy Converter

---

# 11. MVP 1 범위

첫 번째 개발 버전은 가장 안정적이고 효과가 큰 자동화부터 구현한다.

MVP 1의 목표:

> Hub Seed Keyword 하나를 입력하면 핵심 Search Demand Evidence를 자동 수집하고 검토 가능한 표로 보여주며 결과를 저장·Export할 수 있다.

MVP 1의 기본 기능 후보:

1. Hub Seed Keyword 입력
2. Keyword Data Collector 실행
3. 연관 Keyword 수집
4. PC 월간 검색량 수집
5. 모바일 월간 검색량 수집
6. 총 검색량 계산
7. 가능한 문서수 수집
8. competition_ratio 계산
9. 결과 Table 표시
10. Raw Data 보존
11. Collection Date 기록
12. Source 기록
13. Error 상태 표시
14. Export

구체적인 Source와 API 가능 여부는 `03_DATA_SOURCE_STANDARD.md`에서 확정한다.

---

# 12. MVP 1에서 하지 않는 것

MVP 1 범위에서는 다음 기능을 필수 구현하지 않는다.

이 항목은 Historical MVP Scope를 의미한다. 현재 Target Architecture에서는
`08_RESEARCH_ALGORITHM.md`의 Research Layer를 기존 Evidence Infrastructure 위에
단계적으로 추가한다.

- AI Keyword 추천
- AI Article 작성
- Hub 자동 결정
- Node 자동 결정
- Planner 실행
- Research Algorithm 실행
- Writer 실행
- 자동 게시
- 회원가입
- 다중 사용자
- 결제
- SaaS
- 복잡한 Dashboard
- 고급 통계 분석

기능 확장보다 Evidence 수집의 안정성을 먼저 확보한다.

---

# 13. Phase 2

MVP 1이 안정화된 후 Search Entrance 수집을 강화한다.

후보 기능:

- 자동완성
- 관련검색어
- 함께 많이 찾는 검색어
- SERP Observation

웹 UI 또는 비공식 방식에 의존하는 기능은 독립 Collector로 구현한다.

해당 Collector가 실패해도 MVP 1 기능은 정상 동작해야 한다.

---

# 14. Phase 3

Search Trend Layer를 추가한다.

후보:

- 검색 추이
- 기간 비교
- PC / Mobile Trend
- 상승 / 하락
- 시점성 Keyword 탐지

절대 검색량과 상대 Trend Index를 명확하게 구분한다.

---

# 15. Phase 4

GEO Handoff 자동화를 구현한다.

주요 기능:

- SEARCH EVIDENCE PACK 생성
- Markdown Export
- Strategy Converter Input 생성
- 기존 조사 결과와 비교
- Historical Snapshot 저장

이 단계부터 GEO Pipeline과 직접적인 연결 효과가 커진다.

---

# 16. Phase 5

필요성이 확인될 경우 다른 Search Provider로 확장한다.

예:

- Google
- YouTube
- Bing
- 기타 Keyword Provider

단순히 Source 수를 늘리는 것을 목표로 하지 않는다.

GEO 의사결정에 실제 도움이 되는 Evidence만 추가한다.

---

# 17. UI 기본 방향

UI의 목적은 많은 기능을 보여주는 것이 아니다.

사용자가 빠르게 다음 세 가지를 할 수 있어야 한다.

1. 검색한다.
2. 확인한다.
3. 내보낸다.

기본 사용자 흐름:

Hub Keyword 입력  
→ GEO 조사  
→ Evidence 결과  
→ 검토  
→ Export

Desktop First로 시작할 수 있다.

초기 사용 환경은 GEO 운영자의 PC 작업 환경을 우선한다.

---

# 18. 화면 기본 구성

초기 화면은 크게 세 영역을 고려한다.

## INPUT

- Hub Seed Keyword
- Collection Options
- Run

## RESULT

- Keyword Table
- Search Volume
- Competition
- Source
- Status

## EXPORT

- JSON
- Markdown
- CSV
- XLSX

구체적인 UI는 `06_UI_REQUIREMENTS.md`에서 정의한다.

---

# 19. 데이터 저장 기본 방향

한 번 조회한 결과를 화면에 표시하고 버리는 구조로 만들지 않는다.

Search Evidence는 시간에 따라 변한다.

따라서 가능한 경우 다음 형태로 저장한다.

- Seed
- Keyword
- Source
- Collection Date
- Raw Data
- Normalized Data
- Derived Data
- Status

같은 Seed를 다시 조회하더라도 과거 Snapshot과 비교할 수 있는 구조를 지향한다.

---

# 20. 오류 처리

외부 데이터 Source는 실패할 수 있다.

예:

- API Timeout
- Rate Limit
- Authentication Failure
- Source Format Change
- No Result
- Collector Failure

오류가 발생했을 때 전체 조사 결과를 폐기하지 않는다.

각 Collector 상태를 별도로 기록한다.

예:

- Search Ads: SUCCESS
- Autocomplete: FAILED
- DataLab: SUCCESS
- SERP: PARTIAL_SUCCESS

사용자는 어떤 데이터가 정상적으로 수집됐는지 즉시 확인할 수 있어야 한다.

---

# 21. 성공 기준

MVP 1의 성공은 기능 개수로 평가하지 않는다.

다음 조건을 만족하면 성공으로 본다.

## 1. 반복 작업 감소

기존에 사람이 여러 화면에서 복사하던 핵심 Search Demand 데이터를 Seed 입력 한 번으로 수집할 수 있다.

## 2. Evidence 신뢰성

각 데이터의 Source와 수집일을 확인할 수 있다.

## 3. 데이터 구분

RAW / NORMALIZED / DERIVED가 구분된다.

## 4. 부분 실패 대응

하나의 Source가 실패해도 가능한 결과는 보존된다.

## 5. 사람 검토

수집 결과를 사람이 표 형태로 쉽게 검토할 수 있다.

## 6. Export

결과를 외부에서 다시 사용할 수 있다.

## 7. GEO Handoff

Search Evidence를 Strategy Converter에 전달할 수 있다.

---

# 22. 비성공 기준

다음과 같은 상태는 기능이 작동하더라도 성공으로 보지 않는다.

- 출처를 알 수 없는 데이터
- AI 추정값과 실제 검색량이 섞임
- 수집일이 기록되지 않음
- API 실패를 0으로 기록
- Raw Data가 사라짐
- 웹 UI 변경 하나로 전체 앱이 중단됨
- 결과를 다시 Export할 수 없음
- Strategy Converter에 전달하기 위해 사람이 다시 대부분을 수작업해야 함

---

# 23. 장기 방향

본 프로젝트는 장기적으로 GEO PROJECT의 Search Intelligence Layer로 발전할 수 있다.

Keyword Discovery  
→ Search Evidence  
→ Historical Search Data  
→ Search Demand Verification  
→ Knowledge Gap Detection  
→ GEO Knowledge Network

그러나 초기 단계에서는 이 장기 구조를 한 번에 구현하지 않는다.

MVP를 작게 만들고 실제 GEO 작업에 사용하면서 확장한다.

---

# 24. 프로젝트 핵심 가치

본 프로젝트의 핵심 가치는 더 많은 Keyword를 만드는 것이 아니다.

**사람이 반복적으로 하던 Search Evidence 수집 작업을 줄이고, GEO가 실제 데이터에 근거해 판단할 수 있도록 만드는 것**이다.

따라서 모든 기능 개발 시 다음 질문을 우선한다.

> 이 기능이 실제 GEO Search Evidence 수집 시간을 줄이는가?

> 이 데이터의 출처를 확인할 수 있는가?

> Strategy Converter가 이 결과를 바로 사용할 수 있는가?

세 질문 중 어느 것에도 도움이 되지 않는 기능은 초기 개발 우선순위를 낮춘다.

---

# 25. 완료 정의

본 프로젝트의 첫 실사용 버전은 다음 시나리오가 End-to-End로 작동할 때 완료된 것으로 본다.

사용자 `달러` 입력  
→ GEO 조사 실행  
→ 연관 Keyword와 Search Demand Evidence 수집  
→ 결과 Table 확인  
→ Source / Date / Status 확인  
→ Search Evidence Pack 생성  
→ Markdown 또는 구조화 데이터 Export  
→ Strategy Converter 입력

이 전체 흐름이 수작업 없이 또는 최소한의 수작업으로 반복 가능해야 한다.

---

# 26. 최종 정의

`GEO Search Evidence Collector`는 **GEO PROJECT의 검색수요 조사 자동화 도구이자, Search Evidence를 표준화하여 후속 Knowledge System으로 전달하는 데이터 수집 계층**이다.

프로젝트의 첫 번째 목표는 완전 자동화가 아니다.

첫 번째 목표는 다음 네 가지다.

> **반복 가능한 수집**  
> **검증 가능한 Evidence**  
> **재사용 가능한 데이터**  
> **Strategy Converter로의 명확한 Handoff**
