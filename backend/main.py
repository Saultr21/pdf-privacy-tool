from __future__ import annotations

import base64
import mimetypes
from pathlib import Path

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("application/wasm", ".wasm")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .redactor import apply_rects_to_pdf

MAX_PDF_BYTES = 100 * 1024 * 1024
DEV_FRONTEND_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")

app = FastAPI(title="RedactPDF", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(DEV_FRONTEND_ORIGINS),
    allow_methods=["*"],
    allow_headers=["*"],
)


class RedactRect(BaseModel):
    page: int = Field(ge=0)
    x: float
    y: float
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    label: str = "manual"


class ApplyRequest(BaseModel):
    pdf_base64: str
    rects: list[RedactRect] = []


class ApplyResponse(BaseModel):
    pdf_base64: str
    text: str


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/apply", response_model=ApplyResponse)
async def apply_redactions(request: ApplyRequest) -> ApplyResponse:
    try:
        pdf_bytes = base64.b64decode(request.pdf_base64)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, "PDF inválido o mal codificado en base64") from exc

    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(413, "El PDF supera el límite de 100 MB")

    try:
        redacted_bytes, censored_text = apply_rects_to_pdf(
            pdf_bytes, [r.model_dump() for r in request.rects]
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    return ApplyResponse(
        pdf_base64=base64.b64encode(redacted_bytes).decode(),
        text=censored_text,
    )


_FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    app.mount(
        "/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="spa"
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000)
