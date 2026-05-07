@echo off
title BookVault - order-service only
cd /d "%~dp0"
powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0scripts\start-order-service.ps1"
pause
