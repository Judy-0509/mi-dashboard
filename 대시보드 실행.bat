@echo off
chcp 65001 >nul
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\serve_dashboard.py --host 0.0.0.0 --port 8000 --open
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  python scripts\serve_dashboard.py --host 0.0.0.0 --port 8000 --open
  goto :end
)

echo.
echo Python 3를 찾을 수 없습니다.
echo https://www.python.org/downloads/ 에서 Python 3를 설치한 뒤 다시 실행해주세요.
echo 설치 화면에서는 "Add Python to PATH"를 선택해주세요.
echo.
pause

:end
