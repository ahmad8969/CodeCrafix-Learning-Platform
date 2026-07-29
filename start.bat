@echo off
title CodeCrafters Learning Platform
cd /d "%~dp0"

echo.
echo  CodeCrafters — starting app...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo First run: installing root packages...
  call npm install
)

if not exist "client\node_modules\" (
  echo First run: installing client packages...
  call npm install --prefix client
)

if not exist "server\node_modules\" (
  echo First run: installing server packages...
  call npm install --prefix server
)

if not exist "client\.env" (
  if exist "client\.env.example" copy "client\.env.example" "client\.env" >nul
)

if not exist "server\.env" (
  if exist "server\.env.example" copy "server\.env.example" "server\.env" >nul
)

echo.
echo  Server:  http://localhost:5000
echo  App:     http://localhost:5173
echo  Press Ctrl+C to stop
echo.

start "" "http://localhost:5173"
call npm run dev
