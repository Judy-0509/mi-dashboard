# MI TAM Pipeline Check — 설계 사양

**상태:** 사용자 승인 설계  
**범위:** `prototype/mi-dashboard-shadcn`의 MI TAM 하위 페이지  
**원칙:** 기존 MI Intelligence Portal의 데스크톱 shell과 시각 문법을 재사용하고, 공급부터 소비까지의 흐름을 한 줄에서 비교한다.

## 목적

Pipeline Check는 최근 6개 분기의 스마트폰 공급 흐름과 두 단계의 재고를 한 화면에서 비교한다. 사용자는 `Production → Production Inventory → Sell-in → Channel Inventory → Sell-out` 순서로 생산, 유통 유입, 최종 판매와 그 사이의 재고 위험을 읽을 수 있어야 한다.

## 범위와 비범위

포함 범위는 다음과 같다.

- `MI TAM` 최상위 내비게이션 그룹과 `Pipeline Check` 하위 메뉴
- Executive Summary 2~3개 bullet
- 최근 6개 분기의 Production, Sell-in, Sell-out 누적 막대그래프
- 같은 기간의 Production Inventory, Channel Inventory 표
- 원본 엑셀 보기와 Download as HTML
- 정적 가상 데이터와 독립 HTML export

다음은 포함하지 않는다.

- Vendor 또는 기간 필터
- 막대 클릭, 분기 강조, 그래프와 표의 상호 연동
- 모바일 전용 레이아웃
- 실제 Excel, DB, API 연동
- 재고를 앞뒤 단계의 단순 차감으로 산출하는 로직

## 라우팅과 내비게이션

좌측 sidebar에 조사기관과 동등한 위계의 최상위 그룹 `MI TAM`을 추가하고 그 아래에 `Pipeline Check` 메뉴를 둔다. 새 페이지는 기존 hash 기반 라우팅, active 상태, 브라우저 refresh 및 back/forward 동작을 따른다. 기존 SigmaIntel, Counterpoint, ANI, MI Insight 페이지의 경로와 동작은 변경하지 않는다.

페이지 설정에는 제목, 부제, 원본 Excel URL, HTML export 대상 등 기존 페이지가 사용하는 최소 metadata만 추가한다. 새 라우팅 규칙이나 별도 router dependency는 만들지 않는다.

## 페이지 헤더와 액션

기존 페이지 헤더 위계를 사용한다.

- Eyebrow: `MI TAM / PIPELINE CHECK`
- 제목: `분기별 Pipeline Check`
- 부제: `2025 Q1–2026 Q2 Production · Inventory · Sell-in · Sell-out`
- 액션: 기존 `PageActions`의 `원본 엑셀 보기`, `Download as HTML`

원본 Excel 링크는 페이지 설정값을 사용한다. 링크가 아직 제공되지 않은 개발용 fixture에서는 기존 페이지의 비활성 또는 안전한 fallback 처리 방식을 따른다. HTML export에는 좌측 navigation을 제외하고 Pipeline Check 페이지의 현재 정적 콘텐츠만 포함한다.

## Executive Summary

헤더 아래에 기존 Executive Summary Card를 재사용하고 2~3개 bullet을 표시한다. 문체는 기존 MI 보고서 형식의 간결한 `~임`, `~함`, `~필요` 표현을 따른다.

요약은 최소한 다음 내용을 다룬다.

- 최신 분기의 Production, Sell-in, Sell-out 흐름과 단계별 격차
- Production Inventory 또는 Channel Inventory의 최신 분기 변화
- 재고 축적이나 소진이 시사하는 위험 또는 확인 필요 지점

요약 수치는 같은 data module에서 계산하거나 명시적으로 정의하여 본문 값과 불일치하지 않게 한다.

## 본문 레이아웃

본문은 하나의 큰 bordered, no-shadow `Card` 안에 다음 다섯 블록을 정확한 순서로 단일 수평 행에 배치한다.

`Production chart → Production Inventory table → Sell-in chart → Channel Inventory table → Sell-out chart`

- 세 chart는 같은 폭, 높이, plot area, bar 두께, 축 여백을 사용한다.
- 두 표는 같은 폭과 밀도를 사용하고 인접 chart 사이의 연결 단계처럼 보이게 한다.
- 전체 행은 현재 프로젝트의 데스크톱 최소 폭 안에서 수평 스크롤 없이 표시한다.
- 구분은 과도한 카드 중첩 대신 기존 border와 spacing token으로 처리한다.
- 다섯 블록의 제목과 하단 기준선을 정렬한다.

화면이 좁아지는 경우 모바일 재배치는 제공하지 않는다. 기존 dashboard의 desktop minimum-width 정책을 유지한다.

## 세 단계 누적 막대그래프

Production, Sell-in, Sell-out graph는 기존 `ChartContainer`와 Recharts 누적 막대그래프 문법을 재사용한다.

- X축: `2025 Q1`, `2025 Q2`, `2025 Q3`, `2025 Q4`, `2026 Q1`, `2026 Q2`
- Series와 stack 순서: `Apple`, `Samsung`, `CN OEM`
- 단위: `Mu`
- 각 segment 안에 소수점 한 자리 값을 표시한다.
- 각 막대 위에 분기 합계를 표시한다.
- 세 graph는 전체 dataset에서 산출한 하나의 고정 Y축 최댓값과 동일한 tick을 공유한다.
- Production, Sell-in, Sell-out의 절대량 차이가 막대 높이에 그대로 반영되어야 한다.
- legend, typography, tooltip, gridline, axis 색상은 기존 production chart 스타일을 따른다.

별도 필터, toggle, 막대 클릭 동작은 추가하지 않는다. 데이터는 대체로 `Production ≥ Sell-in ≥ Sell-out` 흐름을 따르되, 재고 소진을 표현하는 일부 분기에서는 `Sell-out > Sell-in`을 허용한다.

## Inventory 표

Production Inventory와 Channel Inventory는 각각 독립적인 분기 말 snapshot이다. 앞뒤 chart 값의 차감 결과로 계산하지 않는다.

두 표의 구조는 동일하다.

| Vendor | 2025 Q1 | 2025 Q2 | 2025 Q3 | 2025 Q4 | 2026 Q1 | 2026 Q2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple | Mu | Mu | Mu | Mu | Mu | Mu |
| Samsung | Mu | Mu | Mu | Mu | Mu | Mu |
| CN OEM | Mu | Mu | Mu | Mu | Mu | Mu |

- 값은 소수점 한 자리 `Mu`로 표시한다.
- 값이 없으면 `N/A`로 표시한다.
- Vendor label과 header는 기존 compact table typography를 사용한다.
- 양수/음수 의미를 암시하는 heatmap 색은 사용하지 않는다.
- 접근 가능한 table caption, column header, row header를 제공한다.

## 데이터 계약과 가상 데이터

새 data module 하나가 페이지에 필요한 deterministic fixture를 제공한다. 최소 데이터 형식은 분기별로 다음 값을 포함한다.

- `quarter`
- Vendor별 `production`
- Vendor별 `productionInventory`
- Vendor별 `sellIn`
- Vendor별 `channelInventory`
- Vendor별 `sellOut`

고정 dimension은 다음과 같다.

- Quarters: 정확히 `2025 Q1`부터 `2026 Q2`까지 6개
- Vendors: 정확히 `Apple`, `Samsung`, `CN OEM` 3개
- Unit: 모든 숫자 `Mu`

가상 데이터는 재현 가능하도록 소스에 명시적으로 선언한다. 임의 생성기, 날짜 기반 변동, 새로운 fixture framework는 추가하지 않는다. Production Inventory와 Channel Inventory는 서로 다른 추세를 갖는 독립 값으로 구성한다.

## 컴포넌트와 데이터 흐름

최소 구현 단위는 다음과 같다.

1. Pipeline fixture와 shared-axis 계산을 담는 data module 하나
2. Executive Summary와 단일 행 Pipeline Card를 렌더링하는 `PipelineCheck` page component 하나
3. 기존 `App`, sidebar, page config, export registry에 새 페이지를 연결하는 최소 변경

데이터 흐름은 `data module → PipelineCheck → 기존 chart/table components`의 단방향 구조를 사용한다. 페이지 component는 raw fixture를 수정하지 않으며, 공통 Y축은 세 metric의 분기별 total 중 최댓값에서 한 번 계산한다. 기존 `Card`, `ChartContainer`, Recharts, `PageActions`, table style을 재사용하며 새 UI dependency를 추가하지 않는다.

## 오류 처리와 데이터 검증

표시 계층은 누락값을 `N/A`로 안전하게 표시하되, 잘못된 fixture shape는 기존 build check에서 실패시킨다.

다음 상태는 build blocker다.

- 분기가 6개가 아니거나 순서가 다른 경우
- Vendor가 세 개가 아니거나 중복된 경우
- chart 또는 inventory에서 분기/Vendor key가 누락된 경우
- 값이 숫자가 아니거나 유한하지 않은 경우
- 세 chart가 서로 다른 Y축 domain을 사용하는 경우

실제 데이터 입력 검증이나 schema library는 이 단계에서 추가하지 않는다. 현재 정적 fixture는 기존 검사 스크립트의 단순 assertion으로 검증한다.

## 접근성

- 세 chart는 기존 Recharts accessibility layer와 tooltip을 유지한다.
- 각 chart와 table은 눈에 보이는 제목과 accessible label을 갖는다.
- 색상만으로 Vendor를 식별하지 않도록 legend와 텍스트 label을 함께 제공한다.
- `PageActions`는 기존 keyboard focus와 link semantics를 그대로 사용한다.

## 최소 검증 기준

1. Sidebar에 `MI TAM`과 `Pipeline Check`가 표시되고 새 hash가 refresh/back/forward에서 유지된다.
2. 페이지에 기존 `PageActions`의 원본 Excel 보기와 Download as HTML이 표시된다.
3. Executive Summary가 2~3개 bullet로 최신 분기 Pipeline과 재고 위험을 설명한다.
4. 하나의 Card 안에 다섯 블록이 지정된 순서의 단일 행으로 표시된다.
5. 세 graph가 정확히 6개 분기와 3개 Vendor의 stacked bar를 표시한다.
6. 세 graph가 같은 높이와 동일한 고정 Y축 domain/tick을 사용한다.
7. 두 Inventory 표에 3개 Vendor × 6개 분기 값이 빠짐없이 있고 누락값은 `N/A`로 표시된다.
8. Production Inventory와 Channel Inventory가 chart 차감값이 아닌 독립 snapshot으로 유지된다.
9. 정적 HTML export가 새 페이지를 생성하고 export 결과에 좌측 navigation이 포함되지 않는다.
10. 기존 test, typecheck, lint, build와 production check가 통과한다.
11. 기존 페이지의 route, layout, export 동작을 변경하지 않는다.

