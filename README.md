# MI Intelligence Portal

## 실행 방법

1. ZIP 압축을 원하는 폴더에 풉니다.
2. `대시보드 실행.bat`를 더블클릭합니다.
3. 기본 브라우저에서 `http://localhost:8000`이 자동으로 열립니다.

실행 창을 닫거나 `Ctrl+C`를 누르면 대시보드 서버가 종료됩니다.

## localhost 실행 환경

- Windows 10/11
- Python 3.8 이상
- 빌드된 `site/` 실행에는 인터넷과 Node.js가 필요하지 않음

## 같은 사내망에서 함께 보기

실행 창에 표시되는 `http://사내IP:8000` 주소를 같은 사내망의 동료에게 전달하면 됩니다.

접속되지 않는 경우 Windows 방화벽에서 Python의 개인/도메인 네트워크 접근을 허용하거나, 사내 보안 정책상 PC 간 접속이 허용되는지 확인하세요.

## 확정 화면

- SigmaIntel · Production Forecast
- Counterpoint · Weekly

현재 `site/`는 `prototype/mi-dashboard-shadcn` 소스에서 빌드되며, localhost와 GitHub Pages가 같은 UI를 사용합니다.

## 데이터 업데이트와 GitHub Pages

Actions의 `Update data and deploy dashboard` workflow를 실행하고 `data_source`에 데이터 경로 또는 URL을 입력합니다. 경로가 없으면 저장소에 포함된 `src/data/dashboard.json`을 사용합니다.

- 저장소 내부 파일 또는 외부에서 접근 가능한 URL: `ubuntu-latest`
- 사내 드라이브, UNC 경로 또는 사내망 전용 URL: 접근 권한이 있는 `self-hosted` runner

GitHub 저장소의 `Settings → Pages → Build and deployment → Source`는 `GitHub Actions`로 설정해야 합니다.

사내 데이터가 포함되면 Pages 공개 범위도 반드시 확인하세요. 비공개 Pages는 GitHub Enterprise Cloud 조직에서만 설정할 수 있으며, 그 외 환경에서는 빌드 결과가 외부에 공개될 수 있습니다.

소스 개발 및 데이터 형식은 `prototype/mi-dashboard-shadcn/README.md`를 참고하세요.

## 수동 실행

명령 프롬프트에서 이 폴더로 이동한 뒤 아래 명령을 실행해도 됩니다.

```bat
py -3 scripts\serve_dashboard.py --host 0.0.0.0 --port 8000 --open
```

포트 8000이 이미 사용 중이면 `--port 8080`처럼 다른 포트로 바꿀 수 있습니다.
