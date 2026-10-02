@echo off
cd /d "%~dp0"
echo Starting Todo App in Chrome...
set BROWSER=chrome
start chrome "http://localhost:5173"
node node_modules\vite\bin\vite.js
pause
