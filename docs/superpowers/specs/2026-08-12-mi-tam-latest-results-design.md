# MI TAM Latest Results — 설계 사양

**상태:** 사용자 승인 설계
**작성일:** 2026-08-12

## 목적

`MI TAM` 아래에 조사기관별 최신 실적을 비교하는 `Latest Results` 페이지를
추가한다. 페이지 제목은 `조사기관별 최신 실적`으로 표시한다. 같은 데이터셋을
분기 기준과 조사기관 기준으로 전환하고, Forecast 셀을 선택하면 오른쪽에서
월별 Forecast 변동 이력을 선형 차트로 확인한다.

## 범위와 비범위

### 포함

- 조사기관: `Omdia`, `Counterpoint`, `GfK`, `TechInsights`, `TSR`, `TrendForce`
- 기간: `2026 Q1`, `2026 Q2`, `2026 Q3`, `2026 Q4`만 제공
- 고정 vendor 행: `Apple`, `Samsung`, `Xiaomi`, `Huawei`, `Honor`, `OPPO`,
  `vivo`, `Transsion`, `Lenovo`, `Google`
- `Quarter view`와 `Agency view` 토글
- Actual/Forecast 상호 배타적 표시, Forecast 클릭과 오른쪽 Forecast History
  line chart
- 각 조사기관의 원본 링크, 기존 데스크톱 dashboard shell, 원본 엑셀 보기,
  `Download as HTML`, standalone HTML export, GitHub Pages hash route

### 제외

- 실제 조사기관 입력 연동, API, DB, 네트워크 fetch
- Executive Summary, 추가 KPI 카드, share/rank/commentary 열
- 새 차트 라이브러리, 새 router, 모바일 전용 레이아웃

실제 입력이 제공되지 않았으므로 v1은 결정적인 sample fixture만 사용한다. fixture는
페이지 밖으로 흩어지지 않도록 하나의 data module에 격리하고, 이후 실제 어댑터로
교체할 수 있는 경계를 유지한다.

## 라우팅과 내비게이션

`MI TAM` 그룹에 다음 항목을 추가한다.

- 표시 라벨: `Latest Results`
- 페이지 제목: `조사기관별 최신 실적`
- hash: `#latest-results`
- standalone 파일명: `MI_TAM_Latest_Results.html`

기존 `PortalSidebar`, `PAGE_CONFIG`, `App`의 hash 기반 흐름을 재사용한다. 알 수 없는
hash는 기존 기본 페이지(`sigma`, `#overview`)로 돌아가며, 새 route가 기존 route의
refresh/back/forward 동작을 바꾸지 않는다. GitHub Pages는 기존 빌드 결과와 같은
`#latest-results` route를 제공하고, 기존 HTML export pipeline이 새 page config를
standalone 파일로 만든다.

## 페이지 shell과 본문 배치

기존 `DashboardShell`과 `PageActions`를 재사용한다. 헤더 순서는 다음과 같다.

`MI TAM / LATEST RESULTS` eyebrow → `조사기관별 최신 실적` 제목 →
`2026 Q1–Q4 Actual · Forecast` 부제 → 원본 엑셀 보기 및 `Download as HTML`

헤더 아래에 Executive Summary나 KPI를 두지 않고, 동일한 데이터셋을 공유하는
2열 본문을 둔다.

`왼쪽: 결과 semantic table` | `오른쪽: Forecast History line chart`

분기/기관 토글과 현재 선택값 컨트롤은 표 위에 배치한다. 데스크톱 dashboard의
기존 surface, border, spacing, 최소 폭 정책을 사용하며 가로 스크롤을 만들지 않는다.

시각적 원본은 반드시 저장소 루트의 `DESIGN.md`다. 폰트, 타이포그래피 역할,
색상 토큰, 포커스 표현, shell 밀도는 그 문서를 따른다. 이 사양에서 승인한
`Executive Summary 없음`과 `line chart 사용`은 이 페이지의 기능 제약이며,
`DESIGN.md`의 누적 막대 전용 규칙을 새 차트에 잘못 적용하지 않는다.

## 두 view의 표 구조

두 view는 같은 `latest-results` 데이터 module을 읽고 선택 상태만 바꾼다.

### Quarter view

- Q1/Q2/Q3/Q4 중 하나를 선택한다. 초기 선택은 `2026 Q1`이다.
- 행은 고정 vendor 10개, 열은 6개 조사기관이다.
- 각 기관 열 헤더에는 원본 링크 아이콘을 둔다.
- 표 셀의 식별 컨텍스트는 `기관 + vendor + 분기`다.

### Agency view

- 여섯 조사기관 중 하나를 선택한다. 초기 선택은 첫 기관 `Omdia`다.
- 행은 같은 vendor 10개, 열은 `2026 Q1–Q4`다.
- 선택한 기관의 헤더에 원본 링크 아이콘을 둔다.
- 표 셀의 식별 컨텍스트는 `기관 + vendor + 분기`다.

분기 토글과 기관 토글은 실제 `<button>`이며 현재 상태에 `aria-pressed`를 제공한다.
선택 변경 시 오른쪽 차트 선택도 현재 view에서 유효한 첫 Forecast로 재설정한다.

## 셀 표시 계약

각 셀은 아래 우선순위로 하나의 유효 표시 상태만 만든다.

| 원본 상태 | 화면 표시 | 상호작용 |
| --- | --- | --- |
| Actual 있음 | 숫자만 표시 | 비활성, 클릭 불가 |
| Actual 없음, Forecast 있음 | `65.2 (F)`처럼 숫자 뒤에 `(F)` 표시 | Forecast 버튼으로 클릭 가능 |
| 둘 다 없음 | `—` | 비활성, 클릭 불가 |

원본에 Actual과 Forecast가 동시에 들어와도 표시 계층은 Actual을 우선한다.
Forecast 값과 Forecast 이력은 그 셀에서 숨기며 Forecast 버튼을 만들지 않는다.
명시적 숫자 `0`은 실제 값이므로 누락으로 취급하지 않는다. 누락을 0으로
변환하거나 임의의 숫자를 만들어내지 않는다.

Forecast 버튼은 `기관, vendor, 분기, 표시값`을 포함한 설명적 `aria-label`을
갖고, 키보드로 포커스·활성화할 수 있어야 한다. Actual과 `—` 셀은 버튼이나
링크로 감싸지 않는다.

## Forecast History 차트

Forecast 셀을 클릭하면 오른쪽 카드의 제목을 다음 정보로 갱신한다.

`Forecast History · [기관] · [vendor] · [분기]`

차트는 막대가 아닌 line chart 하나만 사용하고, 모든 월별 snapshot에 보이는 점을
표시한다. x축에는 snapshot의 월 라벨을 표시하고, y값은 해당 Forecast 값으로
사용한다. 차트에는 동적으로 계산한 접근 가능한 label을 제공해 기관, vendor,
분기, 월별 값의 의미를 설명한다.

현재 view에 Forecast가 하나라도 있으면 그 view의 행 우선 순서에서 처음 발견한
Forecast를 초기 선택으로 사용한다. Forecast가 하나도 없으면 오른쪽에 선택을
유도하는 빈 상태를 표시하고 차트를 그리지 않는다. 선택된 Forecast의 snapshot
이력이 비어 있는 경우에도 차트 대신 이력 없음 상태를 표시한다.

## 원본 링크

원본 링크 metadata는 조사기관 단위로 보관하며, 표 헤더에서만 노출한다.

- 유효한 URL이면 링크 아이콘과 접근 가능한 링크 라벨을 표시한다.
- 새 탭으로 열고 `rel="noopener noreferrer"`를 사용한다.
- URL이 없거나 유효하지 않으면 깨진 anchor를 만들지 않고 비활성 상태로
  표시한다.

실제 원본 입력이 없는 sample fixture에서는 `sourceUrl: null`을 허용해 이 비활성
상태를 재현한다. 실제 데이터 교체 시에는 검증된 원본 URL을 기관 metadata에
공급한다. 헤더의 `원본 엑셀 보기` action도 기존 `PageActions`의 null 비활성
처리를 그대로 따른다.

## 데이터 모델과 sample fixture

기존 공통 vendor catalog의 key/order를 재사용하고, 페이지 전용 값은
`src/data/latest-results.ts` 하나에 둔다. 권장 최소 계약은 다음과 같다.

```ts
type Quarter = "2026 Q1" | "2026 Q2" | "2026 Q3" | "2026 Q4"
type Agency =
  | "omdia"
  | "counterpoint"
  | "gfk"
  | "techinsights"
  | "tsr"
  | "trendforce"

type ForecastSnapshot = {
  monthLabel: string
  value: number
}

type ResultCell = {
  actual: number | null
  forecast: number | null
  history: ForecastSnapshot[]
}

type LatestResultsAgency = {
  key: Agency
  label: string
  sourceUrl: string | null
  cells: Record<Quarter, Record<CanonicalVendorKey, ResultCell>>
}
```

`actual`이 `null`이 아니면 `forecast`를 표시 계층에서 무시한다. `actual`과
`forecast`가 모두 `null`이면 `—`다. `history`는 Forecast 셀의 월별 snapshot만
담으며, 숫자가 아니거나 유한하지 않은 fixture 값은 build/test 오류로 처리한다.
기관·분기·vendor의 고정 dimension은 항상 완전하게 선언하고, source data가
없으면 해당 `ResultCell`의 두 값만 `null`로 둔다.

## 컴포넌트와 데이터 흐름

새로운 추상화나 dependency를 만들지 않고 다음 최소 단위를 사용한다.

1. `latest-results.ts`: dimension, sample fixture, 표시 우선순위 및 Forecast
   선택에 필요한 순수 helper를 제공한다.
2. `LatestResultsPage`: view mode, 선택 분기/기관, 선택 Forecast를 관리하고
   동일 데이터에서 현재 표와 기본 차트 항목을 도출한다.
3. `LatestResultsTable`: semantic `<table>`, 헤더 source link, Actual/Forecast/
   `—` 상태와 키보드 가능한 Forecast 버튼을 렌더링한다.
4. `ForecastHistoryChart`: 선택 항목을 받아 visible-dot line chart와 empty
   state를 렌더링한다. 기존 Recharts 및 chart accessibility 패턴을 재사용한다.
5. `App`, `PortalSidebar`, `page-config.json`, 기존 export script: route,
   navigation, page actions, standalone export를 최소 변경으로 연결한다.

데이터 흐름은 다음 단방향이다.

`latest-results.ts → LatestResultsPage(view selector) → LatestResultsTable`

`LatestResultsPage(selected forecast) → ForecastHistoryChart`

표나 차트가 raw fixture를 변경하지 않으며, 두 view에서 vendor/기관/분기 배열을
중복 선언하지 않는다.

## 오류와 빈 상태

- 알 수 없는 hash: 기존 기본 페이지로 fallback
- 현재 mode에 유효한 값이 없음: 모든 표 셀을 `—`로 표시하고 오른쪽에
  Forecast 선택 불가 empty state 표시
- Actual과 Forecast 동시 입력: Actual만 표시하고 Forecast 상호작용 억제
- 원본 링크 누락/오류: disabled/no-link 상태, 깨진 anchor 금지
- 누락 source numeric: 0이 아니라 `—`, 합계·선택·차트에서 값 생성 금지

## 접근성

- vendor 행과 agency/분기 열을 `<th scope>`로 구분한 semantic table
- 토글과 Forecast 버튼의 키보드 포커스 및 `:focus-visible`
- Forecast 버튼의 기관·vendor·분기·값을 포함한 descriptive `aria-label`
- 원본 링크의 목적을 설명하는 label과 새 탭 동작
- line chart의 제목, `aria-label`, 월별 snapshot 의미 전달
- 색상만으로 Actual, Forecast, 누락을 구분하지 않고 텍스트 상태도 함께 표시

## 검증 계획

기존 검사 체계에 다음 검증을 추가하거나 가장 가까운 기존 check에 포함한다.

1. 데이터 invariant: Actual 우선, Actual/Forecast 동시 입력 억제, 명시적 0 보존,
   누락값 `—` 표시
2. 두 view: 정확한 10개 vendor 행, 6개 agency, 4개 분기와 각 header/link
3. 상호작용: Forecast만 선택 가능, 첫 Forecast 기본 선택, 클릭 시 기관·vendor·
   분기 제목과 월별 line history 갱신, Forecast 없음 empty state
4. 라우팅/내비게이션/export: `#latest-results`, invalid hash fallback, sidebar
   active state, standalone HTML 파일 생성, GitHub Pages 산출물 경로
5. 링크 오류: 유효하지 않은 원본 URL이 anchor 없이 비활성 표시
6. 기존 프로젝트 검증: `npm test`, `npm run typecheck`, `npm run lint`,
   `npm run build`

새 테스트 framework나 실제 데이터 연결은 추가하지 않는다.

## 완료 조건

1. `MI TAM` 아래에 `Latest Results`가 표시되고 `#latest-results`로 직접 진입,
   refresh, back/forward가 동작한다.
2. 제목은 `조사기관별 최신 실적`이며 기존 원본 엑셀 보기와 `Download as HTML`
   action이 유지된다.
3. Quarter view는 선택한 한 분기의 vendor 10개 × agency 6개 표를, Agency view는
   선택한 agency의 vendor 10개 × Q1–Q4 표를 같은 데이터로 표시한다.
4. Actual이 있으면 숫자만, Actual이 없고 Forecast가 있으면 숫자 뒤 `(F)`,
   둘 다 없으면 `—`가 표시되며 Forecast만 클릭 가능하다.
5. Forecast 클릭 시 오른쪽에는 visible-dot line chart가 표시되고 제목에
   기관·vendor·분기가 포함되며 월별 snapshot 라벨이 보인다. 막대 차트는 없다.
6. 현재 view에 Forecast가 없으면 표는 `—` 상태를 유지하고 차트는 설명적 빈
   상태를 보여준다.
7. 원본 링크는 요구된 헤더 위치에서 새 탭으로 열리고, 잘못된 링크는 비활성
   no-link로 처리된다.
8. standalone HTML export와 GitHub Pages route가 같은 페이지를 제공하고, 기존
   페이지의 route·shell·export 동작을 깨뜨리지 않는다.
9. sample data는 `latest-results.ts`에만 격리되어 있으며, 모든 타입·lint·build와
   위 검증 항목이 통과한다.

## 자기 검토

- 미결정 항목, 임시 메모, 자리표시자를 남기지 않았다.
- 여섯 기관, 네 분기, 열 개 vendor와 vendor 순서를 고정했다.
- Actual 우선, 누락 대시, Forecast `(F)`, Forecast-only interaction을 한 규칙으로
  연결했다.
- 오른쪽 시각화는 line chart로만 정의했으며 bar chart 요구와 충돌하지 않는다.
- `DESIGN.md`를 공통 시각 원본으로 명시하고, Executive Summary 제외를 페이지
  범위에 명시했다.
- 테스트·라우팅·export·접근성·링크 오류 처리를 모두 완료 조건에 포함했다.
