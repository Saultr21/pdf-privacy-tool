"""PDF redaction core.

Uses PyMuPDF (fitz), distributed under GNU AGPL v3.
For commercial use in proprietary software, acquire a commercial licence from
Artifex: https://artifex.com/licensing/
"""
from __future__ import annotations

from typing import Iterable

import pymupdf


def apply_rects_to_pdf(
    pdf_bytes: bytes, rects: list[dict]
) -> tuple[bytes, str]:
    """Apply user-drawn rectangles to a PDF and return (redacted_pdf, text).

    Each rectangle has the shape ``{page, x, y, width, height, ...}`` where the
    coordinates come from pdf.js' visible (rotation-aware) frame. They are
    converted to PyMuPDF's mediabox frame via ``page.derotation_matrix`` so
    redactions land in the right place on rotated pages.

    The function adds a redact annotation per rectangle and commits them, which
    physically removes the underlying text and vector content. A second pass
    paints the rectangle on top so scanned (raster-only) pages also end up
    visually censored.

    The returned text is the concatenation of all page text with every span
    that intersects a rectangle replaced by ``***``. Pages without an embedded
    text layer (i.e. pure images) contribute an empty page section.
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    if doc.is_encrypted:
        doc.close()
        raise ValueError("El PDF está protegido con contraseña")

    pages_rects = _group_rects_by_page(doc, rects)

    text_parts: list[str] = []
    for page_num, page in enumerate(doc):
        page_rects = pages_rects.get(page_num, [])
        text_parts.append(
            f"--- Página {page_num + 1} ---\n{_censor_page_text(page, page_rects)}\n"
        )
        if page_rects:
            _redact_page(page, page_rects)

    redacted_bytes = doc.tobytes(garbage=4, clean=True, deflate=True)
    doc.close()
    return redacted_bytes, "\n".join(text_parts)


def _group_rects_by_page(
    doc: pymupdf.Document, rects: list[dict]
) -> dict[int, list[pymupdf.Rect]]:
    grouped: dict[int, list[pymupdf.Rect]] = {}
    for r in rects:
        page = doc[r["page"]]
        visible = pymupdf.Rect(
            r["x"], r["y"], r["x"] + r["width"], r["y"] + r["height"]
        )
        mediabox_rect = visible * page.derotation_matrix
        mediabox_rect.normalize()
        grouped.setdefault(r["page"], []).append(mediabox_rect)
    return grouped


def _redact_page(page: pymupdf.Page, rects: Iterable[pymupdf.Rect]) -> None:
    rects = list(rects)
    for rect in rects:
        page.add_redact_annot(rect, fill=(0, 0, 0))
    page.apply_redactions(
        images=pymupdf.PDF_REDACT_IMAGE_NONE,
        graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
    )
    # Paint over the same area: apply_redactions does not hide image content
    # underneath, so this guarantees a visual black box on scanned pages too.
    for rect in rects:
        page.draw_rect(rect, color=(0, 0, 0), fill=(0, 0, 0))


def _censor_page_text(page: pymupdf.Page, rects: list[pymupdf.Rect]) -> str:
    data = page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)
    lines: list[str] = []
    for block in data.get("blocks", []):
        if block.get("type") != 0:  # not text
            continue
        for line in block.get("lines", []):
            tokens: list[str] = []
            for span in line.get("spans", []):
                text = span.get("text", "")
                if not text.strip():
                    continue
                span_rect = pymupdf.Rect(span["bbox"])
                if rects and any(span_rect.intersects(r) for r in rects):
                    if not tokens or tokens[-1] != "***":
                        tokens.append("***")
                else:
                    tokens.append(text)
            if tokens:
                lines.append(" ".join(tokens))
    return "\n".join(lines)
