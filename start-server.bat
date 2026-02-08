@echo off
chcp 65001 >nul
pushd %~dp0
echo.
echo ==============================================
echo Starting local HTTP server on port 8000 in %CD%
echo ==============================================
echo.

REM Try Python launcher (py) first
where py >nul 2>&1
if %errorlevel%==0 (
  echo Using: py -3 -m http.server 8000
  py -3 -m http.server 8000
  goto :after
)

REM Try python
where python >nul 2>&1
if %errorlevel%==0 (
  echo Using: python -m http.server 8000
  python -m http.server 8000
  goto :after
)

REM Try npx (Node.js)
where npx >nul 2>&1
if %errorlevel%==0 (
  echo Using: npx http-server -p 8000
  npx http-server -p 8000
  goto :after
)

echo No suitable server found on PATH.
echo Install Python 3 (adds `py` or `python`) or Node.js (for `npx`).
echo You can also run one of these commands manually from this folder:
echo   py -3 -m http.server 8000
echo   python -m http.server 8000
echo   npx http-server -p 8000
echo.
pause

:after
popd
echo.
echo Server stopped. Open http://localhost:8000 if it was running.
pause
