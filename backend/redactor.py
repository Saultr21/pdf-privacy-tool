# Este módulo usa PyMuPDF (fitz), distribuido bajo GNU AGPL v3.
# Para uso comercial en software propietario, adquirir licencia comercial de Artifex:
# https://artifex.com/licensing/

import pymupdf

from .schemas import RedactSettings


def apply_rects_to_pdf(
    pdf_bytes: bytes,
    rects: list[dict],
    settings: RedactSettings,  # noqa: ARG001 - reservado para opciones futuras
) -> tuple[bytes, str]:
    """Apply a list of user-drawn redaction rectangles to a PDF.

    For each rectangle PyMuPDF adds a redact annotation filled with black
    and then commits the annotation, which physically removes the text and
    vector content beneath. The returned text is the document text with
    every span that intersects a rectangle replaced by ``***``.
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    if doc.is_encrypted:
        doc.close()
        raise ValueError("El PDF está protegido con contraseña")

    # Agrupa rectángulos por página, ya transformados a coordenadas de
    # mediabox. El visor (pdf.js) trabaja en coordenadas "visibles" — las
    # que el usuario ve después de aplicar la rotación del PDF. PyMuPDF en
    # cambio coloca anotaciones en mediabox sin rotar, así que sin esta
    # corrección los rectángulos caen en el lugar equivocado en PDFs con
    # /Rotate ≠ 0.
    pages_rects: dict[int, list[pymupdf.Rect]] = {}
    for r in rects:
        pg = r["page"]
        page = doc[pg]
        visible = pymupdf.Rect(
            r["x"], r["y"], r["x"] + r["width"], r["y"] + r["height"]
        )
        mediabox_rect = visible * page.derotation_matrix
        # Normalizamos para garantizar x0<x1 e y0<y1 tras la rotación.
        mediabox_rect.normalize()
        pages_rects.setdefault(pg, []).append(mediabox_rect)

    all_text_parts: list[str] = []
    for page_num, page in enumerate(doc):
        page_rects = pages_rects.get(page_num, [])

        all_text_parts.append(
            f"--- Página {page_num + 1} ---\n{_censor_text_from_page(page, page_rects)}\n"
        )

        if page_rects:
            for rect in page_rects:
                page.add_redact_annot(rect, fill=(0, 0, 0))
            page.apply_redactions(
                images=pymupdf.PDF_REDACT_IMAGE_NONE,
                graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
            )
            # Repinta por si la página era una imagen escaneada: apply_redactions
            # no oculta el bitmap subyacente.
            for rect in page_rects:
                page.draw_rect(rect, color=(0, 0, 0), fill=(0, 0, 0))

    redacted_bytes = doc.tobytes(garbage=4, clean=True, deflate=True)
    doc.close()
    return redacted_bytes, "\n".join(all_text_parts)


def _censor_text_from_page(
    page: pymupdf.Page, rects: list[pymupdf.Rect]
) -> str:
    data = page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)
    output_lines: list[str] = []

    for block in data.get("blocks", []):
        if block.get("type") != 0:
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
                output_lines.append(" ".join(tokens))

    return "\n".join(output_lines)
