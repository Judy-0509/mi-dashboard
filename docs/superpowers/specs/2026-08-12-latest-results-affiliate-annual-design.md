# Latest Results 관계사 연간 실적 — Design Specification

**Status:** User-approved design
**Date:** 2026-08-12

## Objective

기존 `MI TAM → Latest Results` 화면 오른쪽에 관계사 연간 실적 표를 추가한다. 관계사 업무나 전체 명칭은 노출하지 않고 코드 `LSI · A · B · D · E · F · M`만 사용한다. 기존 오른쪽 Forecast History 카드는 제거하고, 조사기관 또는 관계사 Forecast 셀을 선택했을 때 두 표 아래 전체 폭으로 변화 그래프를 표시한다.

`Latest Results (iPhone)`은 변경하지 않는다.

## Layout

- 상단 분석 영역은 기존 `58:42` 비율을 유지한다.
- 왼쪽 58%는 기존 조사기관별 최신 실적 표와 Quarter/Agency 선택을 그대로 유지한다.
- 오른쪽 42%는 관계사 연간 실적 표다.
- 두 표 아래에 전체 폭 Forecast History 선 그래프 영역을 둔다.
- Forecast를 아직 선택하지 않았다면 그래프 영역에는 선택 안내 문구만 표시한다.
- 페이지는 세로 스크롤을 허용하고 가로 페이지 스크롤은 만들지 않는다.

## 관계사 표

### Controls

- 연도 버튼: `'24 · '25 · '26 · '27`
- 관계사 버튼: `LSI · A · B · D · E · F · M`
- 기본 선택: `'26`, `LSI`
- 버튼은 기존 Latest Results 선택 버튼과 같은 `type-control`, 색상, 테두리, `aria-pressed` 문법을 사용한다.

### Rows and values

- 행 순서: `Total → MX → Apple → CN Total → Xiaomi → Huawei → Honor → OPPO → vivo → Transsion → Lenovo → Google`
- `MX`는 Samsung이다.
- `CN Total`은 Xiaomi, Huawei, Honor, OPPO, vivo, Transsion, Lenovo의 합계다.
- `Total`은 기본 업체 전체 합계다.
- 표 열은 `업체 | 선택한 관계사의 선택 연도 실적` 두 개만 사용한다.
- 단위는 `Mu`, 값은 소수점 한 자리로 표시한다.

### Cell semantics

| 상태 | 표시 | 동작 |
| --- | --- | --- |
| `actual !== null` | 숫자 | 클릭 불가 |
| Actual 없음, Forecast 존재 | `숫자 (F)` | 클릭 가능 |
| 둘 다 없음 | `—` | 클릭 불가 |

- Actual이 Forecast보다 우선한다.
- 명시적 `0`은 유효한 값이다.
- 집계 행은 포함 값 중 Forecast가 하나라도 있으면 `(F)`로 표시하되 클릭하지 않는다.
- 개별 업체 Forecast 셀만 아래 그래프를 갱신한다.

## Forecast History

- 기존 Recharts point `LineChart`를 재사용한다.
- 조사기관 표의 Forecast 셀을 누르면 `조사기관 · 업체 · 분기`의 월별 변화가 표시된다.
- 관계사 표의 Forecast 셀을 누르면 `관계사 코드 · 업체 · 연도`의 월별 변화가 표시된다.
- 그래프 제목과 접근성 라벨은 현재 선택의 출처 코드, 업체, 기간을 명시한다.
- Actual, 결측, 집계 셀은 그래프 선택을 바꾸지 않는다.
- 관계사 전체 명칭이나 업무는 화면, 소스 데이터, 접근성 문자열, 샘플 설명에 저장하지 않는다.

## Data contract

- 관계사 키: `"LSI" | "A" | "B" | "D" | "E" | "F" | "M"`
- 연도 키: `"2024" | "2025" | "2026" | "2027"`
- 샘플 데이터는 별도 모듈에서 결정적으로 생성한다.
- 각 관계사 × 연도 × 기본 업체 조합에 기존 `ResultCell`과 동일한 `actual`, `forecast`, `history`를 제공한다.
- 기존 `latestResultsVendors`와 집계 규칙을 재사용하고 업체 목록을 다시 선언하지 않는다.
- 관계사 데이터에는 원본 링크와 업무 설명을 추가하지 않는다.

## Shared behavior

- 기존 Latest Results의 조사기관 데이터, 표 행 순서, 두 View, 원본 링크, PageActions, 독립 HTML 다운로드는 그대로 유지한다.
- Forecast History는 조사기관과 관계사 선택을 모두 받을 수 있도록 선택 출처 라벨과 기간 라벨만 일반화한다.
- `Latest Results (iPhone)`의 화면, 데이터, 20개 모델, 이력 동작, 독립 HTML은 회귀 없이 유지한다.

## Acceptance criteria

1. 우측에서 `'24~'27`과 `LSI/A/B/D/E/F/M`을 각각 선택할 수 있다.
2. 기본값은 `'26`, `LSI`이며 관계사 표는 승인된 12개 행을 표시한다.
3. Actual, Forecast `(F)`, `—`, 명시적 0과 집계 규칙이 정확하다.
4. 조사기관 또는 관계사 개별 Forecast 셀 클릭 시 아래 전체 폭 point Line 그래프가 해당 선택으로 바뀐다.
5. 기존 우측 Forecast History 카드는 사라지고 두 상단 표의 58:42 배치는 유지된다.
6. 관계사 업무와 전체 명칭이 UI, 접근성 문구, 데이터, 테스트에 포함되지 않는다.
7. 기존 Latest Results와 Latest Results (iPhone), standalone HTML export가 회귀하지 않는다.
8. 기존 test, typecheck, lint, build와 `git diff --check`가 통과한다.

## Non-goals

- 실제 관계사 데이터 수집, DB/API, Excel 연동, 원본 링크, 인증 또는 권한 제어
- 관계사 전체 명칭이나 업무 정보 저장
- 관계사 7개를 동시에 열로 펼치는 표
- Actual 셀 또는 집계 행의 상세 변화 그래프
- `Latest Results (iPhone)` 관계사 표

## Self-review

적용 화면, 연도 표기, 관계사 코드와 기본값, 행 및 집계 정의, 셀 상태, 클릭 범위, 그래프 위치, 개인정보 경계, 기존 화면 회귀 조건이 모두 명시됐다. 미정 항목은 없다.
