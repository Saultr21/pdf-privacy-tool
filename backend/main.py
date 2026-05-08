import base64
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .ocr_helper import check_tesseract
from .redactor import apply_rects_to_pdf, detect_pii_rects
from .schemas import RedactSettings

check_tesseract()

app = FastAPI(title="PII Redactor", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RedactRect(BaseModel):
    page: int
    x: float
    y: float
    width: float
    height: float
    label: str = "manual"


class DetectRequest(BaseModel):
    pdf_base64: str
    settings: RedactSettings = RedactSettings()


class DetectResponse(BaseModel):
    rects: list[RedactRect]
    full_text: str
    pages_processed: int
    ocr_pages: int
    pii_count: int


class ApplyRequest(BaseModel):
    pdf_base64: str
    rects: list[RedactRect]
    settings: RedactSettings = RedactSettings()


class ApplyResponse(BaseModel):
    pdf_base64: str
    text: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/detect", response_model=DetectResponse)
async def detect(request: DetectRequest):
    try:
        pdf_bytes = base64.b64decode(request.pdf_base64)
    except Exception:
        raise HTTPException(400, "PDF inválido o mal codificado en base64")

    if len(pdf_bytes) > 100 * 1024 * 1024:
        raise HTTPException(413, "El PDF supera el límite de 100 MB")

    try:
        rects, full_text, pages, ocr_pages, pii_count = detect_pii_rects(
            pdf_bytes, request.settings
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    return DetectResponse(
        rects=[RedactRect(**r) for r in rects],
        full_text=full_text,
        pages_processed=pages,
        ocr_pages=ocr_pages,
        pii_count=pii_count,
    )


@app.post("/api/apply", response_model=ApplyResponse)
async def apply_redactions(request: ApplyRequest):
    try:
        pdf_bytes = base64.b64decode(request.pdf_base64)
    except Exception:
        raise HTTPException(400, "PDF inválido o mal codificado en base64")

    rects_dicts = [r.model_dump() for r in request.rects]
    redacted_bytes, censored_text = apply_rects_to_pdf(
        pdf_bytes, rects_dicts, request.settings
    )

    return ApplyResponse(
        pdf_base64=base64.b64encode(redacted_bytes).decode(),
        text=censored_text,
    )


frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="spa")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)
