@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo === RedactPDF ===
echo Comprobando requisitos...
echo.

REM ---------- uv ----------
where uv >nul 2>&1
if errorlevel 1 (
    echo   [!] uv no esta instalado.
    echo       Es el gestor de paquetes de Python que necesita RedactPDF.
    echo.
    set /p RESP="   Instalar ahora? [S/n] "
    if "!RESP!"=="" set RESP=S
    if /i "!RESP!"=="n" goto :abort_uv
    if /i "!RESP!"=="no" goto :abort_uv

    echo.
    echo [RedactPDF] Instalando uv ^(usuario, sin permisos de administrador^)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
    if errorlevel 1 (
        echo.
        echo [!] La instalacion de uv fallo. Instalalo manualmente:
        echo     https://docs.astral.sh/uv/getting-started/installation/
        pause
        exit /b 1
    )
    REM Refrescar PATH en esta ventana
    set "PATH=%USERPROFILE%\.local\bin;%PATH%"
    where uv >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [!] uv se instalo correctamente pero PATH aun no esta refrescado en esta ventana.
        echo     Cierra esta consola, abre una NUEVA y vuelve a ejecutar run.bat
        pause
        exit /b 0
    )
    echo [RedactPDF] uv instalado correctamente.
    echo.
)
goto :check_node

:abort_uv
echo Instalacion cancelada por el usuario.
pause
exit /b 1

REM ---------- node ----------
:check_node
where node >nul 2>&1
if errorlevel 1 (
    echo   [!] Node.js no esta instalado.
    echo       Necesario para compilar la interfaz web.
    echo.
    set /p RESP="   Instalar ahora? [S/n] "
    if "!RESP!"=="" set RESP=S
    if /i "!RESP!"=="n" goto :abort_node
    if /i "!RESP!"=="no" goto :abort_node

    where winget >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [!] winget no esta disponible. Instala Node.js manualmente:
        echo     https://nodejs.org/
        pause
        exit /b 1
    )

    echo.
    echo [RedactPDF] Instalando Node.js LTS via winget...
    winget install --silent --accept-package-agreements --accept-source-agreements OpenJS.NodeJS.LTS
    if errorlevel 1 (
        echo.
        echo [!] La instalacion de Node fallo. Descargalo manualmente:
        echo     https://nodejs.org/
        pause
        exit /b 1
    )
    REM Refrescar PATH (winget instala en %ProgramFiles%\nodejs por defecto)
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    where node >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [!] Node se instalo correctamente pero PATH aun no esta refrescado en esta ventana.
        echo     Cierra esta consola, abre una NUEVA y vuelve a ejecutar run.bat
        pause
        exit /b 0
    )
    echo [RedactPDF] Node instalado correctamente.
    echo.
)
goto :launch

:abort_node
echo Instalacion cancelada por el usuario.
pause
exit /b 1

REM ---------- arranque ----------
:launch
echo [RedactPDF] Todo listo. Arrancando aplicacion...
echo.
uv run python scripts/launcher.py %*
if errorlevel 1 pause
endlocal
