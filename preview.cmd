@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

title Quartz local preview
set "QUARTZ_PROTOTYPE=1"
set "NODE_EXE="

where node.exe >nul 2>nul
if not errorlevel 1 set "NODE_EXE=node.exe"

if not defined NODE_EXE (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )
)

if not defined NODE_EXE (
  echo Node.js was not found.
  echo Install Node.js 22 or newer, then run npm install in this directory.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules" (
  echo Project dependencies are missing.
  echo Run npm install in this directory first.
  pause
  exit /b 1
)

set "PREVIEW_PORT=8080"
set "WS_PORT=3001"
for /f %%P in ('powershell.exe -NoProfile -Command "$p=8080; while (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue) { $p++ }; $p"') do set "PREVIEW_PORT=%%P"
for /f %%P in ('powershell.exe -NoProfile -Command "$p=3001; while (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue) { $p++ }; $p"') do set "WS_PORT=%%P"

echo Starting Quartz at http://localhost:%PREVIEW_PORT%
echo Keep this window open for automatic rebuilds. Press Ctrl+C to stop.
echo.

if /i not "%~1"=="--no-open" (
  start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:%PREVIEW_PORT%'"
)

"%NODE_EXE%" ".\quartz\bootstrap-cli.mjs" build --serve --port "%PREVIEW_PORT%" --wsPort "%WS_PORT%"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Quartz stopped with exit code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
