import os
import shutil
import sys

import pymupdf

MIN_TEXT_CHARS = 50

_WINDOWS_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR",
    r"C:\Program Files (x86)\Tesseract-OCR",
]


def check_tesseract():
    if shutil.which("tesseract"):
        return
    if sys.platform == "win32":
        for p in _WINDOWS_TESSERACT_PATHS:
            if os.path.isfile(os.path.join(p, "tesseract.exe")):
                os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")
                return
    raise RuntimeError(
        "Tesseract no está instalado o no se encuentra en el PATH.\n"
        "Instálalo:\n"
        "  Windows: winget install UB-Mannheim.TesseractOCR\n"
        "  macOS:   brew install tesseract tesseract-lang\n"
        "  Ubuntu:  sudo apt install tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng"
    )


def page_needs_ocr(page: pymupdf.Page) -> bool:
    text = page.get_text("text").strip()
    meaningful = len([c for c in text if c.strip()])
    return meaningful < MIN_TEXT_CHARS


def extract_text_with_coords(
    page: pymupdf.Page,
    use_ocr: bool,
    ocr_language: str = "spa+eng",
) -> tuple[str, list[dict]]:
    if use_ocr:
        tp = page.get_textpage_ocr(language=ocr_language, dpi=300)
    else:
        tp = page.get_textpage()

    blocks = page.get_text("dict", textpage=tp, flags=pymupdf.TEXTFLAGS_TEXT)["blocks"]

    spans = []
    full_text = ""

    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span["text"]
                if not t.strip():
                    continue
                char_start = len(full_text)
                full_text += t
                char_end = len(full_text)
                full_text += " "
                spans.append(
                    {
                        "text": t,
                        "bbox": span["bbox"],
                        "char_start": char_start,
                        "char_end": char_end,
                    }
                )

    return full_text, spans
