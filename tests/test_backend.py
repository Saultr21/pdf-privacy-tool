"""End-to-end test: build a PDF, apply a manual redaction rect, verify text is gone."""
import pymupdf

from backend.redactor import apply_rects_to_pdf
from backend.schemas import RedactSettings

SECRET = "juan.perez@example.com"
PII_TEXT = (
    "Nombre: Juan Pérez García\n"
    f"Email: {SECRET}\n"
    "Teléfono: +34 612 345 678\n"
)


def _build_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), PII_TEXT, fontsize=12)
    data = doc.tobytes()
    doc.close()
    return data


def main() -> int:
    pdf_bytes = _build_pdf()
    print(f"[TEST] PDF creado ({len(pdf_bytes)} bytes)")

    # Find the email span and build a rect that covers it.
    src = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    page = src[0]
    hits = page.search_for(SECRET)
    if not hits:
        print("[FAIL] search_for no encontró el email — fallo de configuración del test")
        return 1
    rect = hits[0]
    src.close()

    rects = [
        {
            "page": 0,
            "x": rect.x0,
            "y": rect.y0,
            "width": rect.width,
            "height": rect.height,
            "label": "manual",
        }
    ]

    redacted_bytes, censored_text = apply_rects_to_pdf(pdf_bytes, rects, RedactSettings())
    print(f"[TEST] Texto censurado:\n{censored_text}")

    out = pymupdf.open(stream=redacted_bytes, filetype="pdf")
    leak = out[0].search_for(SECRET)
    out.close()

    if leak:
        print(f"[FAIL] El email sigue presente: {leak}")
        return 1
    print("[PASS] El email ya no se encuentra en el PDF redactado")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
