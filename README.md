# Redact PII

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node-18+-339933.svg)](https://nodejs.org/)

Aplicación web para **censurar a mano** información sensible en documentos PDF. Dibujas un rectángulo, aplicas, y el texto debajo se elimina realmente del PDF (no se tapa con una imagen). **Todo el procesamiento ocurre en tu equipo, sin enviar nada a Internet.**

## Inicio rápido

Necesitas [`uv`](https://docs.astral.sh/uv/) y [Node.js 18+](https://nodejs.org/).

```bash
git clone https://github.com/Saultr21/pdf-privacy-tool.git
cd pdf-privacy-tool/redactpii
./run.sh           # macOS / Linux
run.bat            # Windows
```

El primer arranque instala dependencias y compila el frontend (~1 min). Después abre el navegador en `http://127.0.0.1:8000` automáticamente.

## Uso

1. Arrastra un PDF a la zona de subida.
2. En el editor, dibuja rectángulos sobre la información que quieras eliminar (modo **Dibujar**).
3. Para retirar un rectángulo, cambia a **Borrar** y haz clic encima.
4. Pulsa **Aplicar cambios** y descarga el PDF resultante o el texto censurado.

### Atajos de teclado

| Acción | Atajo |
|---|---|
| Modo Dibujar | `D` |
| Modo Borrar | `E` |
| Deshacer último rectángulo | `Ctrl+Z` |
| Aplicar cambios | `Ctrl+Enter` |

## Cómo funciona

```
Navegador (React + react-pdf)  ──►  FastAPI  ──►  PyMuPDF
            │                                       │
            │   rectángulos                         │ add_redact_annot
            │   en coordenadas PDF                  │ apply_redactions
            ▼                                       ▼
       editor visual                          PDF con texto eliminado
```

PyMuPDF aplica `apply_redactions`, que **borra el texto y los gráficos** del flujo de contenidos del PDF — abrir el resultado en otro visor confirma que la información ya no se puede seleccionar ni copiar.

## Requisitos

- Python ≥ 3.10
- Node.js ≥ 18
- [`uv`](https://docs.astral.sh/uv/) (gestor de paquetes Python)

Sin Tesseract, sin GPU, sin descargas de modelos de varios GB.

## Desarrollo

```bash
# Backend (puerto 8000)
uv run uvicorn backend.main:app --reload --port 8000

# Frontend con HMR (puerto 5173, proxy /api → 8000)
cd frontend && npm install && npm run dev
```

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI + Uvicorn |
| PDF | PyMuPDF |
| Frontend | React 19 + Vite + TypeScript + Tailwind |
| Iconos | lucide-react |
| Dependencias Python | uv |

## Licencias

- **Este proyecto:** Apache 2.0 (ver [LICENSE](LICENSE)).
- **PyMuPDF:** GNU AGPL v3. Para uso comercial en software propietario, adquirir [licencia comercial de Artifex](https://artifex.com/licensing/).

## Contribuir

Las contribuciones son bienvenidas. Abre un issue describiendo el cambio antes de un PR grande. Para PRs pequeños, ejecuta `uv run python test_backend.py` y `cd frontend && npx tsc -b --noEmit` antes de proponerlos.
