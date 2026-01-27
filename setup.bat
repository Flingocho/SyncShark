@echo off
:: ═══════════════════════════════════════════════════════════════
::  SYNCSHARK - Setup Launcher
::  Ejecuta el script de instalación PowerShell sin problemas de permisos
:: ═══════════════════════════════════════════════════════════════

echo.
echo   SYNCSHARK - Setup ^& Installation
echo.

:: Ejecutar el script PowerShell con bypass de política de ejecución
powershell.exe -ExecutionPolicy Bypass -File "%~dp0src\setup.ps1"

:: Mantener ventana abierta si hay error
if errorlevel 1 (
    echo.
    echo Presiona cualquier tecla para cerrar...
    pause >nul
)
