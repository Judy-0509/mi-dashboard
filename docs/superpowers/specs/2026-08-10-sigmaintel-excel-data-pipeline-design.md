# SigmaIntel Excel 데이터 파이프라인 설계

상태: 사용자 최종 검토 대기
작성일: 2026-08-10

## 1. 목표

사내 사용자가 매주 월요일 SigmaIntel Excel을 `input/`에 넣고 BAT 파일을 실행하면, `db.PLC` 시트를 xlwings로 읽어 로컬 SQLite에 누적하고 검증된 정적 JSON을 생성한다. 사용자가 결과를 승인한 경우에만 JSON을 Git에 커밋·푸시하며, 사내 self-hosted GitHub Actions runner가 대시보드를 검증·빌드·GitHub Pages에 배포한다.

같은 SQLite에서 현재 생산량 대시보드뿐 아니라 향후 AP, 디스플레이, 메모리, 카메라, 부품 공급사 등의 스펙 대시보드와 API·AI용 상세 데이터를 만들 수 있어야 한다.

## 2. 범위와 보안 경계

- 사내 Excel 원본은 사외로 반출하지 않는다.
- 원본 Excel은 사용자가 명시적으로 `input/`에 넣은 파일만 처리한다.
- Excel 접근은 xlwings만 사용한다. pandas와 openpyxl로 원본을 읽지 않는다.
- EDM 링크는 사람이 원본을 확인하는 미리보기 주소다. 프로그램은 EDM에 접속하거나 파일을 내려받지 않는다.
- 사내 GitHub Pages에는 실제 집계·상세 JSON을 배포할 수 있다.
- 사외 GitHub Pages에는 같은 스키마의 가상 데이터만 배포하고 EDM 정보는 제외한다.
- SQLite와 `plc_raw`는 로컬에만 보관하고 Git에 커밋하지 않는다.

## 3. SigmaIntel 원본 계약

소스 시트는 `db.PLC`, 형식은 long format이다. 정확한 55개 Excel 컬럼, 정규화 필드명, 예시값은 저장소의 `sigmaintel.md`를 데이터 계약으로 사용한다.

핵심 의미는 다음과 같다.

- Excel 파일명은 `- Jun.26` 같은 영문 월·2자리 연도 표기를 포함한다. 프로그램은 이를 2026년 6월이라는 정렬용 날짜로 해석하며 원본 파일명은 변경하지 않는다.
- `version`: Forecast 작성 기준월. `2026-06`은 2026년 6월 스냅샷을 뜻한다.
- `Year`: 대상 연도 보조 표기. 예: `Y24`.
- `Quarter`: 대상 분기. 마지막 `F`가 있으면 Forecast, 없으면 Actual이다.
- `Company`부터 `Models`: 업체·브랜드·시리즈·모델 계층이다.
- 디스플레이, 패널, AP, 카메라, 메모리, 가격, ODM, 공급사 컬럼: 모델 스펙 Profile을 구성한다.
- `Region`: 물량의 지역 구분이다.
- `Volume(mil.)`: 해당 행의 생산량이며 단위는 Mu다.

예를 들어 `version=2026-06`, `Quarter=25Q3F`, `Volume(mil.)=1.31`은 2026년 6월 시점에 전망한 2025년 3분기 물량 1.31Mu를 뜻한다.

## 4. 전체 구조

```text
input/*.xls[xmb]
       │
       ▼  xlwings, 숨김·읽기 전용
db.PLC 행 추출 및 검증
       │
       ▼  파일 단위 SQLite 트랜잭션
data/mi_dashboard.db
       │
       ├─ 대시보드용 집계 JSON
       ├─ API·AI용 상세 JSON
       └─ 검증 보고서
       │
       ▼  사용자 승인
지정 산출물 commit/push
       │
       ▼  사내 self-hosted runner
검증 → Vite build → GitHub Pages
```

## 5. 로컬 파일 구조

```text
input/                         # 사용자가 처리할 Excel을 넣는 위치
archive/processed/             # 성공한 Excel의 임시 로컬 보관소
data/mi_dashboard.db           # 로컬 기준 DB, gitignore
reports/                       # 실행별 로컬 검증 보고서
edm.md                         # 사내 사람용 EDM 미리보기 링크 목록
prototype/mi-dashboard-shadcn/public/data/v1/
                               # Git에 올리는 정적 JSON 원본
site/data/v1/                  # Vite build가 만드는 Pages 산출물
```

처리된 Excel은 자동 삭제하지 않는다. 성공 후 `archive/processed/`로 이동하고, 사용자가 용량을 확인해 직접 삭제할 수 있다. 로컬 파일을 삭제해도 SQLite `source_import`의 원본 파일 정보와 EDM 미리보기 링크는 유지한다.

`edm.md`는 다음 형식을 기준으로 한다.

```markdown
| 조사기관 | Version | 파일명 | EDM 링크 | 처리 상태 |
| SigmaIntel | 2026-06 | PLC_2026-06.xlsx | [원본 보기](사내주소) | 처리 완료 |
```

BAT는 `edm.md`의 파일명과 원본 Excel 파일명이 정확히 일치할 때만 EDM URL을 `source_import`에 연결한다. 링크가 없거나 파일명이 다르면 데이터 처리는 계속하되 보고서에 경고를 남긴다. 프로그램은 `edm.md`를 자동 수정하지 않는다. 이 파일은 사내 저장소에서만 관리하고 사외 저장소에는 포함하지 않는다.

## 6. SQLite 데이터 모델

### `source_import`

처리 계보와 재실행 판정에 사용한다.

- 조사기관, 원본 파일명, 파일 해시, 크기
- EDM 미리보기 URL
- 처리 시작·완료 시각, 상태, 오류 메시지
- 발견한 version 목록, 원본 행 수, 적재 행 수

### `plc_raw`

`db.PLC`의 55개 컬럼을 정규화하지 않고 보존한다. source import ID, Excel 행 번호와 원본 행 해시를 추가한다. 서로 다른 파일에서 동일한 행이 발견되어도 원본 계보를 위해 raw에는 모두 남긴다.

### `model`

`Company`, `Brands`, `Series`, `Sub Series`, `Models`를 모델 계층으로 저장한다.

### `spec_profile`

디스플레이, 패널, AP, 네트워크, 생체인식, 카메라, 메모리, 가격, 출시일, ODM, 공급사 등의 스펙 조합을 저장한다. 정규화된 스펙 값의 해시를 Profile 키로 사용한다. 같은 모델의 스펙이 Forecast 버전별로 바뀌면 기존 값을 수정하지 않고 새 Profile을 연결한다.

### `forecast_fact`

- `snapshot_month`: `version`
- `target_year`, `target_quarter`
- `data_status`: Actual 또는 Forecast
- `model_id`, `spec_profile_id`, `region`
- `volume_mu`
- `source_import_id`, `source_row_number`
- 정규화된 행 identity hash

현재 생산 그래프는 스펙을 무시하고 `volume_mu`를 업체·스냅샷·대상 분기별로 합산한다. 미래 스펙 대시보드는 같은 Fact를 `chipset_supplier`, `panel_type`, `memory_type` 같은 Profile 필드로 그룹화한다.

## 7. 최초 백필과 증분 갱신

1. BAT가 `input/`의 Excel 파일명에서 `Jan.YY`부터 `Dec.YY` 형태의 영문 월·2자리 연도 표기를 대소문자 구분 없이 찾는다. 예를 들어 `- Jun.26`을 2026년 6월로 해석하되 파일명은 바꾸지 않는다.
2. 파일 수정일은 사용하지 않고, 해석한 파일 기준월이 오래된 순서로 정렬한다. 예를 들어 `- Jan.26`을 `- Jun.26`보다 먼저 처리한다.
3. 월·연도 표기가 없거나 한 파일명에서 여러 개 발견되면 수정일로 추측하지 않고 오류로 처리한다.
4. 파일명의 기준월은 처리 순서와 source metadata에 사용하고, 행별 Forecast 스냅샷은 `version`을 기준으로 한다.
5. DB에 성공한 import가 없으면 모든 과거 파일을 최초 백필한다.
6. 이후에는 파일 해시가 `source_import`에 없는 파일만 처리한다.
7. xlwings가 파일을 숨김·읽기 전용으로 열고 `db.PLC`만 읽는다.
8. 파일 하나를 하나의 SQLite 트랜잭션으로 처리한다.
9. 파일 내 모든 행이 통과해야 commit하고, 실패하면 해당 파일의 변경을 모두 rollback한다.
10. 성공한 파일은 `archive/processed/`로 이동한다.
11. 모든 신규 파일이 성공한 경우에만 JSON을 임시 위치에 생성한 뒤 기존 산출물과 원자적으로 교체한다.

중복 규칙은 다음과 같다.

- 같은 파일 해시: 이미 처리된 파일이므로 건너뛴다.
- 서로 다른 파일의 정규화된 Fact identity와 Volume이 모두 같음: raw 계보는 보존하고 Fact는 한 번만 반영한다.
- Fact identity는 같지만 Volume이 다름: 자동 덮어쓰기하지 않고 충돌로 처리해 승인을 차단한다.

## 8. 검증과 오류 처리

승인 단계 전에 다음을 검사한다.

- Excel과 xlwings 실행 가능 여부, `db.PLC` 존재 여부
- 55개 필수 컬럼의 누락·중복
- `version`의 `YYYY-MM` 형식
- `Year`, `Quarter`, Actual/Forecast 표기의 일관성
- `Volume(mil.)`이 숫자이며 0 이상인지
- 선택형 스펙 값의 공백과 `-` 정규화
- 동일 파일 재실행의 멱등성
- `plc_raw`에서 계산한 합계와 `forecast_fact` 합계의 일치
- SQLite 집계와 생성 JSON 합계의 일치

오류가 있으면 이전 DB와 JSON을 유지하고 commit/push 단계로 진입하지 않는다. 보고서에는 파일, version, 원본·신규·중복·충돌 행 수, version별 총 물량, 오류 행 번호와 원인을 기록한다.

## 9. 정적 JSON 계약

```text
prototype/mi-dashboard-shadcn/public/data/v1/
├─ manifest.json
├─ data-dictionary.json
├─ aggregates/
│  ├─ production-quarterly.json
│  └─ forecast-history.json
└─ details/
   └─ YYYY-MM.json
```

Vite build는 위 파일을 `site/data/v1/`로 복사한다. 대시보드와 GitHub Pages는 build 산출물을 사용하고, BAT와 Git은 `public/data/v1/`의 원본 JSON을 기준으로 한다.

- `manifest.json`: 스키마 버전, 기준월, 생성 시각, 데이터셋 URL과 행 수
- `data-dictionary.json`: 필드 의미, 자료형, 단위, 허용값, 예시
- `aggregates/`: 대시보드가 직접 사용하는 작은 집계 데이터
- `details/YYYY-MM.json`: API·AI·상세 분석을 위한 월별 모델·스펙 데이터

GitHub Pages의 JSON은 서버 필터가 없는 읽기 전용 정적 API다. 소비자는 먼저 manifest를 읽고 필요한 월의 상세 파일만 가져간다. 향후 실제 API 서버가 필요하면 동일한 SQLite 모델과 JSON 필드명을 유지한다.

## 10. 사용자 승인과 배포

BAT 실행은 두 단계로 나뉜다.

1. 적재·검증 단계: SQLite와 JSON 후보를 만들고 보고서를 표시한다.
2. 승인·배포 단계: 사용자가 명시적으로 승인한 경우에만 `public/data/v1/`의 JSON·사전·manifest를 stage하고 `data: update SigmaIntel to YYYY-MM` 형식으로 commit/push한다.

SQLite, 원본 Excel, 로컬 검증 보고서, EDM 인증 정보와 raw 데이터는 Git에 올리지 않는다. `edm.md`는 사내 저장소에서만 별도로 관리한다. push 이후 사내 self-hosted GitHub Actions runner가 데이터 검증, 테스트, Vite build와 Pages 배포를 수행한다.

## 11. 테스트 전략

실제 사내 Excel을 저장소나 테스트 산출물에 사용하지 않는다. `sigmaintel.md`의 예시를 바탕으로 xlwings가 작은 가상 `db.PLC` 통합 문서를 생성한다.

- 컬럼 매핑·기간·수치 정규화 단위 테스트
- `- Jun.26` 파일명 파싱, 연대순 정렬과 잘못된 파일명 차단 테스트
- 가상 Excel → SQLite → JSON 통합 테스트
- 전체 과거 파일 백필과 신규 파일 증분 적재 테스트
- 같은 파일 재실행과 서로 다른 파일의 동일 Fact 중복 테스트
- 충돌·잘못된 컬럼·음수 Volume 발생 시 rollback 테스트
- 생산량 및 스펙별 집계 합계 테스트
- manifest, 집계 JSON, 상세 JSON, 데이터 사전 스키마 테스트
- 사용자 승인 전 git 명령이 실행되지 않는지 테스트
- self-hosted runner에서 xlwings, 데이터 검증, 프론트엔드 테스트와 build 실행

## 12. 완료 조건

- 과거 SigmaIntel Excel 전체를 한 번에 백필할 수 있다.
- 이후 월요일 실행은 신규 파일만 적재한다.
- 모든 원본은 xlwings·읽기 전용으로 처리한다.
- 실패한 파일이 기존 DB·JSON·Pages를 변경하지 않는다.
- 현재 SigmaIntel 생산 그래프가 SQLite 집계 JSON을 사용한다.
- 상세 스펙 JSON과 데이터 사전이 API·AI가 이해할 수 있는 형태로 생성된다.
- 사용자가 승인하기 전에는 commit/push가 실행되지 않는다.
- 사내 self-hosted runner가 검증된 JSON으로 Pages를 배포한다.

## 13. 명시적 비범위

- EDM 자동 로그인·탐색·다운로드
- 사외 환경에 실제 사내 데이터 배포
- SQLite 파일의 Git·Git LFS 저장
- 자동 archive 삭제
- DuckDB·Parquet·서버형 API 도입
- SigmaIntel 이외 조사기관 변환기 구현
