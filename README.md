# MI Intelligence Portal · localhost 실행본

## 실행 방법

1. ZIP 압축을 원하는 폴더에 풉니다.
2. `대시보드 실행.bat`를 더블클릭합니다.
3. 기본 브라우저에서 `http://localhost:8000`이 자동으로 열립니다.

실행 창을 닫거나 `Ctrl+C`를 누르면 대시보드 서버가 종료됩니다.

## 필요한 환경

- Windows 10/11
- Python 3.8 이상
- 인터넷 연결 불필요
- Node.js 및 npm 불필요

## 같은 사내망에서 함께 보기

실행 창에 표시되는 `http://사내IP:8000` 주소를 같은 사내망의 동료에게 전달하면 됩니다.

접속되지 않는 경우 Windows 방화벽에서 Python의 개인/도메인 네트워크 접근을 허용하거나, 사내 보안 정책상 PC 간 접속이 허용되는지 확인하세요.

## 포함된 화면

- SigmaIntel · Production Forecast
- SigmaIntel · Model · Spec · Production Mix
- Counterpoint · Weekly
- Counterpoint · OEM Sales
- Counterpoint · Flagship Model Sales
- GfK · Demand Projector

현재 파일은 디자인 검토용 Mock Data 버전이며, ZIP 생성 시점의 최신 화면과 상호작용을 포함합니다.

## 수동 실행

명령 프롬프트에서 이 폴더로 이동한 뒤 아래 명령을 실행해도 됩니다.

```bat
py -3 scripts\serve_dashboard.py --host 0.0.0.0 --port 8000 --open
```

포트 8000이 이미 사용 중이면 `--port 8080`처럼 다른 포트로 바꿀 수 있습니다.
