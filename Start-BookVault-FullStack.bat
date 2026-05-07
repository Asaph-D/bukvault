@echo off
title BookVault — backend + Angular
cd /d "%~dp0"

powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0scripts\start-all-microservices.ps1" -IncludeFrontend

if errorlevel 1 pause
