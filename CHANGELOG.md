# Changelog

## 0.2.0 — 2026-05-15

### Breaking

- **Eliminada la detección automática de PII** y todas sus dependencias
  (`transformers`, `torch`, modelo `openai/privacy-filter`, ~3 GB de descarga).
  La aplicación pasa a ser un redactor 100% manual.
- **Eliminado el soporte OCR** (Tesseract) y el endpoint `POST /api/detect`.
- `RedactSettings` queda vacío; cualquier integración previa que enviase
  `confidence_threshold`, `categories`, `ocr_language` o `replacement_style`
  recibirá esos campos ignorados.

### Cambios

- Rediseño completo de la interfaz: tipografía, espaciado, componentes
  consistentes, foco visible, ARIA correcto y enlace "Saltar al contenido".
- Atajos de teclado: `D` dibujar, `E` borrar, `Ctrl+Z` deshacer último,
  `Ctrl+Enter` aplicar.
- Botón **Deshacer** explícito y badge de estado (sin aplicar / aplicado).
- Lanzador único `launcher.py` con scripts `run.bat` y `run.sh` que
  instalan dependencias, compilan el frontend y abren el navegador.
- Backend escucha en `127.0.0.1` por defecto (antes `0.0.0.0`).
- `install.bat` eliminado; `uv sync` se encarga al primer arranque.

### Fixes

- `fileToBase64` ya no usa `Array.reduce` sobre `Uint8Array`, evitando
  el bug de stack overflow en PDFs grandes.
