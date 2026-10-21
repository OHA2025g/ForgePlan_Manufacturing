@echo off
cd /d "%~dp0"
py -3 portable\server.py --open
if errorlevel 1 pause
