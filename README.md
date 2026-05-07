# PII Redactor

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Aplicación web para censurar información personal identificable (PII) en documentos PDF. **Todo el procesamiento ocurre en tu máquina. Ningún dato sale al exterior.**

Soporta PDFs digitales y escaneados (OCR automático con Tesseract). Produce texto plano censurado y PDF con redacción real (el texto PII se elimina del content stream, no se tapa).

## Cómo funciona

```
Navegador (React)  →  FastAPI Backend  →  PDF procesado
                          │
                          ├─ PyMuPDF: extracción texto + coordenadas
                          ├─ Tesseract: OCR si la página es imagen
                          ├─ openai/privacy-filter: detección PII
                          └─ PyMuPDF: redacción real (apply_redactions)
```

## Privacidad

> **Todo el procesamiento ocurre localmente en tu dispositivo.** El modelo de detección PII (`openai/privacy-filter`) se descarga una sola vez (~3 GB) y se ejecuta offline. No se envía ningún dato a servidores externos.

## Instalación rápida

### Requisitos previos

- Python 3.10+
- Node.js 18+
- Tesseract OCR

### Windows

```bat
git clone https://github.com/Saultr21/pdf-privacy-tool.git
cd pdf-privacy-tool
install.bat
run.bat
```

Abre http://localhost:8000 en tu navegador.

## GPU (CUDA)

Por defecto se usa CPU. Para aprovechar GPU NVIDIA:

```bat
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

El backend detecta automáticamente CUDA y usa GPU si está disponible.

## Uso

1. Abre http://localhost:8000
2. Arrastra o selecciona un PDF
3. Ajusta la configuración (opcional): umbral de confianza, idioma OCR, categorías PII
4. Haz clic en "Redactar"
5. Descarga el PDF redactado o el texto censurado

## Stack

| Componente | Tecnología |
|---|---|
| Backend | FastAPI + Uvicorn |
| PDF | PyMuPDF |
| OCR | Tesseract |
| PII | `openai/privacy-filter` (Transformers) |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Deps | uv |

## Licencias

- **Este proyecto:** Apache 2.0
- **PyMuPDF:** GNU AGPL v3 — para uso comercial en software propietario, adquirir [licencia comercial de Artifex](https://artifex.com/licensing/)
- **openai/privacy-filter:** Apache 2.0 — modelo de [OpenAI en HuggingFace](https://huggingface.co/openai/privacy-filter)

## Créditos

- [OpenAI](https://openai.com) por el modelo `privacy-filter`
- [HuggingFace](https://huggingface.co) por Transformers
- [Artifex](https://artifex.com) por PyMuPDF
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
