# MI Intelligence Portal

localhost와 같은 LAN에서 사용하는 Vite + React + shadcn/ui 소스입니다. `npm run build` 결과는 저장소 루트의 `site/`에 생성됩니다.

## Run

```powershell
npm install
npm run dev
npm run data:check
npm run build
npm run lint
```

루트에서 `대시보드 실행.bat`를 실행하면 정적 사이트와 편집 API가 함께 시작됩니다. 편집 런타임 파일은 루트 `runtime/editorial/`에 저장됩니다.

## 데이터 갱신

저장소 기준 상대 경로, 절대 경로 또는 접근 가능한 URL을 전달합니다.

```powershell
npm run data:update -- "data\sigmaintel-production.json"
npm run data:update -- "https://intranet.example.com/sigmaintel-production.csv"
```

디렉터리를 전달하면 하위의 JSON/CSV 중 파일명에 `dashboard`, `production`, `sigma`가 포함된 최신 파일을 선택합니다. CSV 필수 열은 `quarter,apple,samsung,xiaomi,oppo,vivo,transsion,others`입니다. JSON은 같은 열의 배열이거나 `src/data/dashboard.json` 구조를 사용합니다.

데이터 갱신 뒤 `editorial-defaults.json`도 자동 재생성되며, 데이터 revision이 바뀐 페이지의 편집 상태만 초기화됩니다.
