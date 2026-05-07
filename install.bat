@echo off
echo === PII Redactor — Instalador ===

:: uv
where uv >nul 2>nul
if errorlevel 1 (
    echo Instalando uv...
    powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
)

:: Tesseract
where tesseract >nul 2>nul
if errorlevel 1 (
    echo Instalando Tesseract via winget...
    winget install UB-Mannheim.TesseractOCR --accept-source-agreements --accept-package-agreements
    setx PATH "%PATH%;C:\Program Files\Tesseract-OCR"
)

:: Dependencias Python
echo Instalando dependencias Python...
uv venv .venv
uv sync

:: GPU (opcional): instalar torch con CUDA si nvidia-smi esta disponible
where nvidia-smi >nul 2>nul
if not errorlevel 1 (
    echo GPU NVIDIA detectada. Instalando torch con CUDA...
    uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu130
)

:: Frontend
echo Construyendo frontend...
cd frontend && npm install && npm run build && cd ..

echo.
echo Instalacion completada.
echo Ejecuta: run.bat
