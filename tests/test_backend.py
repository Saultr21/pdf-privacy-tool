"""End-to-end smoke tests: redaction on a normal PDF and on a rotated PDF."""
from __future__ import annotations

import sys

import pymupdf

from backend.redactor import apply_rects_to_pdf

SECRET = "juan.perez@example.com"
PII_TEXT = (
    "Nombre: Juan Pérez García\n"
    f"Email: {SECRET}\n"
    "Teléfono: +34 612 345 678\n"
)


def _build_pdf(rotation: int = 0) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    if rotation:
        page.set_rotation(rotation)
    page.insert_text((72, 72), PII_TEXT, fontsize=12)
    data = doc.tobytes()
    doc.close()
    return data


def _find_visual_rect(pdf_bytes: bytes, text: str) -> pymupdf.Rect:
    """Return bounding rect of *text* in the visual (rotation-aware) frame."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    # search_for returns coords in the mediabox frame; convert to visual frame
    hits = page.search_for(text)
    if not hits:
        doc.close()
        raise AssertionError(f"search_for did not find '{text}'")
    mediabox_rect = hits[0]
    # Inverse of derotation_matrix goes from mediabox → visual frame
    visual_rect = mediabox_rect * ~page.derotation_matrix
    visual_rect.normalize()
    doc.close()
    return visual_rect


def test_normal_pdf() -> bool:
    pdf_bytes = _build_pdf()
    print(f"[TEST] PDF sin rotar creado ({len(pdf_bytes)} bytes)")

    visual = _find_visual_rect(pdf_bytes, SECRET)
    rects = [{"page": 0, "x": visual.x0, "y": visual.y0,
               "width": visual.width, "height": visual.height, "label": "manual"}]

    redacted_bytes, censored_text = apply_rects_to_pdf(pdf_bytes, rects)
    print(f"[TEST] Texto censurado:\n{censored_text}")

    out = pymupdf.open(stream=redacted_bytes, filetype="pdf")
    leak = out[0].search_for(SECRET)
    out.close()
    if leak:
        print(f"[FAIL] test_normal_pdf — el email sigue presente: {leak}")
        return False
    print("[PASS] test_normal_pdf")
    return True


def test_rotated_pdf(rotation: int = 90) -> bool:
    """Verifies that rects drawn in the visual frame land correctly on a rotated page."""
    pdf_bytes = _build_pdf(rotation=rotation)
    print(f"[TEST] PDF rotado {rotation}° creado ({len(pdf_bytes)} bytes)")

    visual = _find_visual_rect(pdf_bytes, SECRET)
    rects = [{"page": 0, "x": visual.x0, "y": visual.y0,
               "width": visual.width, "height": visual.height, "label": "manual"}]

    redacted_bytes, _ = apply_rects_to_pdf(pdf_bytes, rects)

    out = pymupdf.open(stream=redacted_bytes, filetype="pdf")
    leak = out[0].search_for(SECRET)
    out.close()
    if leak:
        print(f"[FAIL] test_rotated_pdf({rotation}°) — el email sigue presente: {leak}")
        return False
    print(f"[PASS] test_rotated_pdf({rotation}°)")
    return True


def main() -> int:
    results = [
        test_normal_pdf(),
        test_rotated_pdf(90),
        test_rotated_pdf(180),
        test_rotated_pdf(270),
    ]
    if all(results):
        print("\n[OK] Todos los tests pasaron.")
        return 0
    failed = results.count(False)
    print(f"\n[KO] {failed} test(s) fallaron.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
