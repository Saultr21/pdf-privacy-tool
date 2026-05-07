# Este módulo usa PyMuPDF (fitz), distribuido bajo GNU AGPL v3.
# Para uso comercial en software propietario, adquirir licencia comercial de Artifex:
# https://artifex.com/licensing/
#
# El modelo openai/privacy-filter se distribuye bajo Apache 2.0.
# https://huggingface.co/openai/privacy-filter

import pymupdf
from .ocr_helper import page_needs_ocr, extract_text_with_coords
from .pii_detector import detect_pii
from .schemas import RedactSettings


def _format_replacement(entity_group: str, style: str) -> str:
    if style == "label":
        return f"[{entity_group.upper()}]"
    return "████████"


def detect_pii_rects(
    pdf_bytes: bytes,
    settings: RedactSettings,
) -> tuple[list[dict], str, int, int, int]:
    """
    Detect PII in PDF without applying redactions.
    Returns:
        (rects, full_text, pages_processed, ocr_pages, pii_count)
        rects: [{page, x, y, width, height, label}]
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    if doc.is_encrypted:
        doc.close()
        raise ValueError("El PDF está protegido con contraseña")

    doc.bake()

    total_pages = len(doc)
    all_text_parts = []
    total_ocr = 0
    total_pii = 0
    all_rects: list[dict] = []

    for page_num, page in enumerate(doc):
        needs_ocr = page_needs_ocr(page)
        if needs_ocr:
            total_ocr += 1

        full_text, spans = extract_text_with_coords(
            page, use_ocr=needs_ocr, ocr_language=settings.ocr_language
        )

        entities = detect_pii(full_text, settings)
        total_pii += len(entities)

        all_text_parts.append(f"--- Página {page_num + 1} ---\n{full_text}\n")

        rects = _find_redact_rects(entities, spans)
        for rect, entity in _match_rects_entities(entities, spans):
            all_rects.append({
                "page": page_num,
                "x": rect.x0,
                "y": rect.y0,
                "width": rect.width,
                "height": rect.height,
                "label": entity["entity_group"],
            })

    doc.close()
    return all_rects, "\n".join(all_text_parts), total_pages, total_ocr, total_pii


def apply_rects_to_pdf(
    pdf_bytes: bytes,
    rects: list[dict],
    settings: RedactSettings,
) -> tuple[bytes, str]:
    """
    Apply a list of redaction rects to the original PDF.
    Returns (redacted_pdf_bytes, censored_text).
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    doc.bake()

    pages_rects: dict[int, list[pymupdf.Rect]] = {}
    for r in rects:
        pg = r["page"]
        pages_rects.setdefault(pg, []).append(
            pymupdf.Rect(r["x"], r["y"], r["x"] + r["width"], r["y"] + r["height"])
        )

    all_text_parts = []
    for page_num, page in enumerate(doc):
        page_rects = pages_rects.get(page_num, [])
        needs_ocr = page_needs_ocr(page)

        censored = _censor_text_from_page(page, page_rects, settings.ocr_language, needs_ocr)
        all_text_parts.append(f"--- Página {page_num + 1} ---\n{censored}\n")

        if page_rects:
            if needs_ocr:
                for rect in page_rects:
                    page.draw_rect(rect, color=(0, 0, 0), fill=(0, 0, 0))
            else:
                for rect in page_rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                page.apply_redactions(
                    images=pymupdf.PDF_REDACT_IMAGE_NONE,
                    graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                )

    redacted_bytes = doc.tobytes(garbage=4, clean=True, deflate=True)
    doc.close()
    return redacted_bytes, "\n".join(all_text_parts)


def _censor_text_from_page(
    page: pymupdf.Page,
    rects: list[pymupdf.Rect],
    ocr_language: str,
    needs_ocr: bool,
) -> str:
    if needs_ocr:
        tp = page.get_textpage_ocr(language=ocr_language, dpi=300)
    else:
        tp = page.get_textpage()

    kwargs = {"textpage": tp, "flags": pymupdf.TEXTFLAGS_TEXT}
    data = page.get_text("dict", **kwargs)
    blocks = data.get("blocks", [])

    output_lines = []
    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            tokens = []
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
                output_lines.append(" ".join(tokens))

    return "\n".join(output_lines)


def _match_rects_entities(
    entities: list[dict], spans: list[dict]
) -> list[tuple[pymupdf.Rect, dict]]:
    pairs = []
    for entity in entities:
        e_start = entity["start"]
        e_end = entity["end"]
        for span in spans:
            if span["char_end"] <= e_start:
                continue
            if span["char_start"] >= e_end:
                continue
            pairs.append((pymupdf.Rect(span["bbox"]), entity))
    return pairs


def _find_redact_rects(entities: list[dict], spans: list[dict]) -> list[pymupdf.Rect]:
    return [pair[0] for pair in _match_rects_entities(entities, spans)]
