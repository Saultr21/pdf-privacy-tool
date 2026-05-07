"""End-to-end test: create a PDF with PII, redact it, verify PII is gone."""
import pymupdf
from backend.redactor import redact_pdf
from backend.schemas import RedactSettings

PII_TEXT = (
    "Nombre: Juan Pérez García\n"
    "Email: juan.perez@example.com\n"
    "Teléfono: +34 612 345 678\n"
    "Dirección: Calle Falsa 123, Madrid 28001\n"
    "Fecha de nacimiento: 15/03/1985\n"
)

# 1. Create a test PDF in memory
doc = pymupdf.open()
page = doc.new_page()
page.insert_text((72, 72), PII_TEXT, fontsize=12)
pdf_bytes = doc.tobytes()
doc.close()
print(f"[TEST] PDF de prueba creado ({len(pdf_bytes)} bytes)")

# 2. Redact
settings = RedactSettings()
redacted_bytes, redacted_text, pages, ocr_pages, pii_count = redact_pdf(pdf_bytes, settings)
print(f"[TEST] Redactado: {pages} páginas, {ocr_pages} OCR, {pii_count} entidades PII")
print(f"[TEST] Texto censurado:\n{redacted_text}")

# 3. Verify PII is gone from the output PDF
out_doc = pymupdf.open(stream=redacted_bytes, filetype="pdf")
out_page = out_doc[0]

pii_samples = ["juan.perez@example.com", "Juan Pérez", "+34 612 345 678"]
found_pii = []
for sample in pii_samples:
    results = out_page.search_for(sample)
    if results:
        found_pii.append(sample)

out_doc.close()

if found_pii:
    print(f"[FAIL] PII aún presente en el PDF de salida: {found_pii}")
else:
    print("[PASS] Ningún PII encontrado en el PDF de salida")

if pii_count == 0:
    print("[WARN] El modelo no detectó entidades PII — puede que necesite descargarse primero")
