@echo off
setlocal
call "%~dp0deploy.bat" %*
if not "%errorlevel%"=="0" exit /b %errorlevel%
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-gallery-assets.ps1" -AppDockDirectory "%~1"
exit /b %errorlevel%
