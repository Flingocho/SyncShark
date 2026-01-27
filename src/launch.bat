@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "npm start"
pause
