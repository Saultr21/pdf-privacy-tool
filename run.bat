@echo off
setlocal
cd /d "%~dp0"

where uv >nul 2>&1
if errorlevel 1 (
    echo [redactpii] No se encontro "uv". Instala uv desde https://docs.astral.sh/uv/
    echo            o ejecuta: powershell -c "irm https://astral.sh/uv/install.ps1 ^| iex"
    pause
    exit /b 1
)

uv run python launcher.py %*
if errorlevel 1 pause
endlocal
