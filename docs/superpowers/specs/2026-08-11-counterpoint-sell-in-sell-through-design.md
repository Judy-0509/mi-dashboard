# Counterpoint Sell-in / Sell-through — 설계 사양

**상태:** 사용자 승인 설계
**범위:** `prototype/mi-dashboard-shadcn`의 Counterpoint 하위 페이지
**원칙:** 기존 MI Intelligence Portal의 데스크톱 레이아웃, SigmaIntel Production 색상·간격·차트 문법을 따른다.

## 범위와 비범위

이 페이지는 월별 스마트폰 Sell-in과 Sell-through를 비교하고, 같은 기간의 Vendor별 Inventory와 WoS를 함께 보여준다. 비교 목적은 공급 유입(Sell-in)과 실제 소비자 출하(Sell-through)의 간극, 그리고 재고 커버리지를 한 화면에서 읽게 하는 것이다.

다음은 범위에 포함하지 않는다.

- Executive Summary 추가
- 모바일 레이아웃 또는 반응형 재설계
- 백엔드, 외부 API, 데이터 파이프라인, 원본 파일 연동
- 기존 SigmaIntel Production 및 Counterpoint Weekly 동작 변경
- 지역별 Inventory/WoS 데이터 또는 지역 selector

## 라우팅과 내비게이션

`Counterpoint` sidebar 섹션 아래에 기존 `Weekly` 링크와 새 `Sell-in / Sell-through` 링크를 함께 둔다. 새 링크는 `#sell-through` hash를 사용하고, 새 페이지 상태를 브라우저 refresh 및 back/forward hash navigation에서 복원한다. 기존 `Weekly`는 기존 `#weekly`와 동작을 유지한다.

현재 sidebar의 SigmaIntel/ANI 섹션 구조와 active-page treatment를 유지한다. 새 페이지는 기존 desktop shell 안에서만 표시한다.

## 페이지 헤더와 고정 shell

헤더는 다음 문구와 위계를 사용한다.

- Eyebrow: `Counterpoint / Sell-in · Sell-through`
- 제목: `스마트폰 Sell-in / Sell-through`
- 부제: `2025년 9월–2026년 8월 월별 흐름 · Inventory / WoS 비교`

기존 `DashboardShell`의 고정 데스크톱 기준을 유지한다. 최소 viewport 폭은 현재 `min-w-[1180px]`, sidebar는 현재 `w-64`, main은 기존 padding과 overflow 정책을 따른다. 모바일용 축소/재배치는 제공하지 않는다.

## 본문 레이아웃

본문은 기존 Weekly/Sigma 구성을 따라 `58fr / 42fr` 두 패널로 나눈다. 두 패널은 같은 높이의 bordered, no-shadow Card로 배치하고, 두 카드의 상단 기준선과 하단 끝선을 맞춘다.

### 왼쪽 58%: Sell-in / Sell-through combo chart

왼쪽 패널은 2025-09부터 2026-08까지 12개월을 x축에 둔다. 각 월은 두 개의 half-width bar를 나란히 렌더링한다.

- 왼쪽 bar: `Sell-in` (`SI`)
- 오른쪽 bar: `Sell-through` (`ST`)
- 두 bar 모두 Vendor별 stacked bar이며, 기본 표시는 기존 Sigma vendor 색상과 stack order를 사용한다.
- Vendor/Total toggle을 제공한다.
  - `Vendor`: 기존 Sigma vendor 색상으로 누적된 Vendor별 SI/ST bars
  - `Total`: 각 월의 SI와 ST 합계만 비교하는 두 bars
- 기존 Sigma vendor palette와 순서를 그대로 사용한다: Apple, Samsung, Xiaomi, OPPO, vivo, Transsion, Others.
- 왼쪽 y축은 Mu bar scale, 오른쪽 y축은 percent ratio line scale로 사용한다.
- 노란색 `SI / ST ratio` line과 point를 각 월에 표시하며, 각 point 위 또는 인접 위치에 퍼센트 label을 표시한다.
- ratio는 정확히 `Sell-in / Sell-through * 100`으로 계산한다. Sell-through가 0이면 ratio와 label은 안전하게 `N/A`로 표시하고 0으로 나누지 않는다.
- bar 상단에는 SI total과 ST total을 표시한다. Total mode에서도 동일한 총합 label을 유지한다.

툴팁은 선택한 월을 기준으로 SI, ST, ratio를 함께 보여주며, Vendor mode에서는 Vendor별 segment 값과 두 metric의 total을 포함한다. Total mode에서는 SI total, ST total, ratio만 표시한다. 기존 `ChartTooltip`/`ChartTooltipContent`의 시각 문법과 keyboard-accessible chart layer를 유지한다.

## 오른쪽 42%: Inventory

오른쪽 패널 제목은 정확히 `Inventory`로 한다. 지역 selector와 지역별 data는 제공하지 않는다. 표의 row는 Vendor만 사용한다.

표의 column group은 다음과 같다.

| Vendor | Inventory |  |  | WoS |  |  |
| --- | --- | --- | --- | --- | --- | --- |
|  | 25년 말 | 26년 4월 | 26년 8월 | 25년 말 | 26년 4월 | 26년 8월 |

표의 group header와 세 기간 header는 위와 같이 고정한다. 개별 셀의 값 형식, 단위, 해석은 후속 데이터 정의에서 제공하며 현재 사양에서 확정하지 않는다. 현재 deterministic mock cell 값은 레이아웃 밀도와 표 구조를 확인하기 위한 용도일 뿐이다. 표시 대상 Vendor와 색상 순서는 왼쪽 Sigma chart와 동일하게 유지한다. 표는 고정된 기존 desktop 폭 안에서 읽을 수 있도록 compact table density를 사용한다.

현재 표의 값은 **placeholder mock values**로 제공한다. 이는 화면 밀도와 metric 관계를 검증하기 위한 의도적인 fixture이며, 이후 승인된 실제 source contract로 값과 의미를 교체할 수 있어야 한다. 이 placeholder 표기 자체는 미해결 요구사항이 아니다.

## 데이터 경계

Sell-in/Sell-through 월별 series와 Inventory/WoS 표 값은 기존 `weekly.ts`의 weekly sell-out 계산과 분리된 별도 data module에서 관리한다. Weekly의 `sumWeeklySellOut`, `getWeeklyHeatmap`, `getWeeklyTrend`를 sell-in 또는 sell-through 데이터로 재명명하거나 재사용하지 않는다.

데이터 module은 최소한 다음 계약을 제공한다.

- 12개 월 label: `2025-09`–`2026-08`
- Vendor별 월별 `sellIn`과 `sellThrough` 값
- 월별/vendor별 total 계산
- Inventory/WoS placeholder row 값
- Sigma vendor key, label, color 순서와의 명시적 매핑
- `sellThrough === 0`을 처리하는 ratio 계산 helper

데이터는 deterministic fixture로 유지하고, 페이지 컴포넌트가 원본 데이터 생성 규칙을 직접 갖지 않도록 한다.

## 상호작용과 접근성

- `Vendor / Total` toggle은 하나만 선택되는 single-selection control이며 현재 선택 상태를 `aria-pressed` 또는 동등한 accessible state로 노출한다.
- chart bars와 ratio points는 기존 accessibility layer를 유지한다.
- Vendor mode의 series label, bar 색상, tooltip 항목은 색상만으로 구분하지 않고 텍스트로도 식별 가능해야 한다.
- Inventory 표는 `caption` 또는 accessible label, 명시적인 column group header, row header를 제공한다.
- 모든 interactive control은 keyboard focus와 visible focus treatment를 유지한다.
- 새 페이지는 기존 `Weekly` export 동작을 확장하지 않으며, 별도 export 요구사항을 추가하지 않는다.

## 최소 검증 기준

1. `#sell-through` hash가 새 페이지를 열고 refresh/back/forward에서 유지된다.
2. Counterpoint sidebar에 `Weekly`와 `Sell-in / Sell-through`가 모두 보이며 기존 링크가 깨지지 않는다.
3. 페이지 header 문구와 기존 desktop shell 기준(`min-w-[1180px]`, `w-64`)이 유지된다.
4. 본문이 equal-height `58fr / 42fr` 두 패널로 렌더링된다.
5. 왼쪽 chart가 12개월, 월별 SI/ST half-width bars, Vendor/Total toggle, Sigma 색상·stack order, 노란 ratio line/points/percent labels를 표시한다.
6. ratio가 `SI / ST * 100`으로 계산되고 ST 0에서 안전하게 처리된다.
7. tooltip과 total label이 Vendor mode와 Total mode 모두에서 metric 의미를 보존한다.
8. 오른쪽 `Inventory` 표가 지역 selector 없이 Vendor row와 두 개의 3기간 grouped columns를 표시한다.
9. placeholder mock values가 별도 data module에 있고 기존 weekly sell-out module과 분리되어 있다.
10. 기존 Sigma/Weekly/ANI 동작을 변경하지 않으며, Executive Summary가 추가되지 않는다.
11. TypeScript/test/build 검증이 통과하고, desktop 기준에서 수평 overflow가 발생하지 않는다.
