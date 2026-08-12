# MI Intelligence Portal

![MI Data Hub — 파란 하늘 아래 책과 데이터가 허브로 모이는 픽셀 아트](docs/assets/mi-data-hub-pixel.png)

MI Intelligence Portal은 SigmaIntel, Counterpoint, MI TAM, MI Insight, ANI의 스마트폰 시장 리서치 화면을 한곳에서 탐색하는 데이터 허브입니다. `prototype/mi-dashboard-shadcn`의 Vite + React 소스를 빌드해 로컬 대시보드와 GitHub Pages용 정적 사이트를 같은 화면으로 제공합니다.

## 빠른 실행 — Windows

1. Python **3.10 이상**을 설치합니다. `scripts/serve_dashboard.py`가 `str | None` 문법을 사용합니다.
2. 저장소 루트의 `대시보드 실행.bat`를 더블클릭합니다.
3. 브라우저에서 [http://localhost:8000](http://localhost:8000)을 엽니다.

실행 창을 닫거나 `Ctrl+C`를 누르면 서버가 종료됩니다. 이미 빌드된 `site/`를 여는 데는 Node.js나 인터넷 연결이 필요하지 않습니다.

## 포털 구성

| 영역 | 화면 |
| --- | --- |
| SigmaIntel | Production Forecast |
| Counterpoint | Weekly · Sell-in / Sell-through · Flagship Sales |
| MI TAM | Pipeline Check · Pipeline Check (iPhone) · Latest Results |
| MI Insight | Weekly Report · Weekly Sell-through |
| ANI | iPhone Model Production |

## 개발

```powershell
cd prototype\mi-dashboard-shadcn
npm ci
npm run dev
```

검증과 배포용 빌드는 다음 명령으로 실행합니다.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

## `site/`와 페이지별 다운로드

저장소 루트의 `site/`는 소스가 아니라 `npm run build`가 생성하는 정적 출력물입니다. `site/index.html`과 번들 자산 외에도 `MI_SigmaIntel.html`, `MI_Weekly_2026W32.html`, `MI_TAM_Latest_Results.html` 같은 페이지별 독립 HTML 다운로드본을 함께 생성합니다. `site/` 파일을 직접 수정하지 말고 소스를 수정한 뒤 다시 빌드하세요.

## 데이터 갱신과 GitHub Pages

개발 환경에서는 JSON/CSV 파일 경로나 접근 가능한 URL을 전달해 데이터를 갱신할 수 있습니다.

```powershell
cd prototype\mi-dashboard-shadcn
npm run data:update -- "<JSON 또는 CSV 경로/URL>"
npm run data:check
npm run build
```

GitHub Actions의 **Update data and deploy dashboard** workflow는 `main` 또는 `master`에서 `.github/workflows/pages.yml` 또는 `prototype/mi-dashboard-shadcn/**`가 바뀌면 자동 실행되며, Actions에서 수동 실행할 수도 있습니다. 수동 실행 시 `data_source`에 저장소 상대 경로·접근 가능한 URL·runner에서 읽을 수 있는 로컬 경로를 입력합니다. 입력과 저장소 변수 `DASHBOARD_DATA_SOURCE`가 모두 비어 있으면 저장소에 포함된 데이터를 그대로 빌드합니다. 기본 runner는 `ubuntu-latest`이며, 사내 드라이브·UNC 경로·사내망 전용 URL은 해당 자원에 접근할 수 있는 `self-hosted` runner를 선택해야 합니다.

Workflow는 데이터 확인, 테스트, lint, 빌드를 거친 뒤 `site/`를 GitHub Pages artifact로 업로드하고 배포합니다. 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**로 설정하세요.

## 데이터와 보안

`site/`와 GitHub Pages는 정적 파일이므로 배포된 데이터와 페이지별 HTML은 웹에서 열거나 내려받을 수 있다고 가정해야 합니다. 사내·개인정보·비공개 원본을 커밋하거나 Pages artifact에 포함하지 말고, 배포 전 데이터 범위와 저장소 공개 설정을 확인하세요.

## 관련 문서

- [프로토타입 개발 안내](prototype/mi-dashboard-shadcn/README.md)
- [차트 및 화면 디자인 규칙](DESIGN.md)
