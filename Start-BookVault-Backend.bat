@echo off
title BookVault — demarrage microservices
cd /d "%~dp0"

powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0scripts\start-all-microservices.ps1"

if errorlevel 1 pause
