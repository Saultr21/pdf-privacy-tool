# RedactPDF

[![License](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node-18+-339933.svg)](https://nodejs.org/)

Aplicación web para **redactar (censurar) a mano** información sensible en
documentos PDF. Dibujas un rectángulo, aplicas, y el texto debajo se elimina
del flujo de contenidos del PDF — no se tapa con una imagen.

**Todo el procesamiento ocurre en tu equipo. Nada sale a Internet.**

> En inglés, *redact* es el verbo técnico que usan abogados y gobiernos para
> referirse a eliminar partes confidenciales de un documento, normalmente
> tapándolas con barras negras antes de publicarlo.

## Inicio rápido

```bash
git clone https://github.com/Saultr21/pdf-privacy-tool.git
cd pdf-privacy-tool/redactpdf
./run.sh           # macOS / Linux
run.bat            # Windows
```

El primer arranque:

1. **Comprueba si tienes [`uv`](https://docs.astral.sh/uv/) y [Node.js](https://nodejs.org/).** Si falta alguno, te pregunta antes de instalarlo automáticamente:
   - **Windows:** `uv` se instala a nivel de usuario (sin admin); Node se instala con `winget`.
   - **macOS:** Node se instala con Homebrew si lo tienes.
   - **Linux:** Node se instala con el gestor de paquetes detectado (`apt`, `dnf` o `pacman`, requiere sudo).
2. Instala las dependencias Python y compila el frontend (~1 min).
3. Abre el navegador en `http://127.0.0.1:8000` automáticamente.

Si prefieres instalar las herramientas a mano, descarga uv desde
<https://docs.astral.sh/uv/> y Node desde <https://nodejs.org/>.

## Uso

1. Arrastra un PDF a la zona de subida (también acepta clic).
2. En el panel **Editor** (derecha), arrastra para crear un rectángulo negro
   sobre la información sensible.
3. Para retirar un rectángulo, cambia a modo **Borrar** y haz clic encima.
4. Pulsa **Aplicar cambios** y descarga el PDF resultante o el texto
   censurado en `.txt`.

El panel **Original** (izquierda) muestra siempre el documento sin modificar
como referencia.

### Atajos de teclado

| Acción | Atajo |
|---|---|
| Modo Dibujar | `D` |
| Modo Borrar | `E` |
| Deshacer último rectángulo | `Ctrl+Z` |
| Aplicar cambios | `Ctrl+Enter` |

### Modo oscuro

Botón sol/luna en el header. Persiste en `localStorage` y respeta
`prefers-color-scheme` la primera vez.

## Cómo funciona

```
Navegador (React + pdf.js)  ──►  FastAPI  ──►  PyMuPDF
            │                                    │
            │   rectángulos en coords visibles   │  derotation_matrix
            │   (pdf.js rotation-aware)          │  add_redact_annot
            ▼                                    ▼  apply_redactions
       editor visual                       PDF con texto eliminado
```

`apply_redactions` borra el texto y los gráficos del flujo de contenidos del
PDF — abrir el resultado en otro visor confirma que la información ya no se
puede seleccionar ni copiar. Sobre PDFs escaneados (sin capa de texto) el
rectángulo además se pinta encima para tapar el bitmap.

### Coordenadas en PDFs rotados

pdf.js renderiza los PDFs con `/Rotate ≠ 0` en su orientación visual, pero
PyMuPDF coloca anotaciones en coordenadas de mediabox (sin rotar). El backend
aplica `page.derotation_matrix` a cada rectángulo antes de añadir la
anotación, de modo que un dibujo en la esquina superior izquierda del visor
acaba donde el usuario lo ve, no en otra esquina del PDF original.

## Limitaciones

- **Sin OCR.** La exportación a TXT solo funciona en PDFs digitales (con capa
  de texto). En PDFs escaneados la redacción visual se aplica correctamente
  pero el botón TXT queda deshabilitado con un aviso en la UI.
- **Sin detección automática.** No hay modelo de IA: el usuario decide qué
  censurar. 

## Requisitos

Lo único que necesitas tener antes de empezar es una conexión a Internet — el resto lo gestiona el script de arranque. Si lo quieres preparar a mano:

- Python ≥ 3.10 (uv lo descarga solo si falta)
- Node.js ≥ 18
- [`uv`](https://docs.astral.sh/uv/)

## Desarrollo

```bash
# Backend con autorecarga (puerto 8000)
uv run uvicorn backend.main:app --reload --port 8000

# Frontend con HMR (puerto 5173, proxy /api → 8000)
cd frontend && npm install && npm run dev
```

Smoke test del backend:

```bash
uv run python tests/test_backend.py
```

Type-check del frontend:

```bash
cd frontend && npx tsc -b --noEmit
```

## Estructura

```
redactpdf/
├── backend/
│   ├── main.py         # FastAPI app + endpoints
│   └── redactor.py     # apply_rects_to_pdf + helpers
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── hooks/
│       │   ├── useKeyboardShortcuts.ts
│       │   └── useTheme.ts
│       └── components/
│           ├── AppHeader.tsx
│           ├── DropZone.tsx
│           ├── Editor.tsx
│           ├── HelpDialog.tsx
│           ├── PdfPanel.tsx
│           ├── editor/         # Toolbar + Panes
│           └── ui/             # Button, Badge, Dialog, Tooltip
├── scripts/
│   └── launcher.py     # Cross-platform launcher
├── tests/
│   └── test_backend.py # Smoke test
└── run.bat / run.sh    # OS-specific shortcuts
```

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI + Uvicorn |
| PDF | PyMuPDF |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Iconos | lucide-react |
| Deps Python | uv |

## Licencias

- **Este proyecto:** Apache 2.0 (ver [LICENSE](LICENSE)).
- **PyMuPDF:** GNU AGPL v3. Para uso comercial en software propietario,
  adquirir [licencia comercial de Artifex](https://artifex.com/licensing/).

## Contribuir

Las contribuciones son bienvenidas. 
