# MI Intelligence Portal

GitHub Pages와 localhost에서 동일한 화면을 제공하는 Vite + React + shadcn/ui 소스입니다. `npm run build` 결과는 저장소 루트의 `site/`에 생성됩니다.

## Run

```powershell
npm install
npm run dev
npm run data:check
npm run build
npm run lint
```

## 데이터 갱신

저장소 기준 상대 경로, 절대 경로 또는 접근 가능한 URL을 전달합니다.

```powershell
npm run data:update -- "data\sigmaintel-production.json"
npm run data:update -- "https://intranet.example.com/sigmaintel-production.csv"
```

디렉터리를 전달하면 하위의 JSON/CSV 중 파일명에 `dashboard`, `production`, `sigma`가 포함된 최신 파일을 선택합니다. CSV 필수 열은 `quarter,apple,samsung,xiaomi,oppo,vivo,transsion,others`입니다. JSON은 같은 열의 배열이거나 `src/data/dashboard.json` 구조를 사용합니다.

GitHub Actions의 `Update data and deploy dashboard`를 수동 실행하면서 `data_source`만 입력하면 데이터 검증, 빌드, Pages 배포가 이어집니다. 저장소 내부 경로나 접근 가능한 URL은 `ubuntu-latest`를 사용합니다. 사내 드라이브, UNC 경로 또는 사내망 URL은 해당 자원에 접근 가능한 `self-hosted` runner를 선택해야 합니다.
