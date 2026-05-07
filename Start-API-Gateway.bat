@echo off
title BookVault - api-gateway only
cd /d "%~dp0"
powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0scripts\start-api-gateway.ps1"
pause
