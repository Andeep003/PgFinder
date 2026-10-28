@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\.bin\react-scripts.cmd" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

call npm start
