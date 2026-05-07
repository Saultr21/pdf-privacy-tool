export interface RedactSettings {
  confidence_threshold: number;
  ocr_language: string;
  categories: string[];
  replacement_style: "label" | "block";
}

export interface RedactRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  id: string; // client-side unique id
}

export interface DetectResponse {
  rects: Omit<RedactRect, "id">[];
  full_text: string;
  pages_processed: number;
  ocr_pages: number;
  pii_count: number;
}

export interface ApplyResponse {
  pdf_base64: string;
  text: string;
}

export const DEFAULT_SETTINGS: RedactSettings = {
  confidence_threshold: 0.5,
  ocr_language: "spa+eng",
  categories: [
    "private_person",
    "private_address",
    "private_email",
    "private_phone",
    "private_url",
    "private_date",
    "account_number",
    "secret",
  ],
  replacement_style: "label",
};

let _idCounter = 0;
export function makeRectId(): string {
  return `rect_${++_idCounter}_${Date.now()}`;
}

export function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buf) =>
    btoa(
      new Uint8Array(buf).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    )
  );
}

export async function detectPii(
  pdfBase64: string,
  settings: RedactSettings
): Promise<DetectResponse> {
  const response = await fetch("/api/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdf_base64: pdfBase64, settings }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

export async function applyRedactions(
  pdfBase64: string,
  rects: RedactRect[],
  settings: RedactSettings
): Promise<ApplyResponse> {
  const apiRects = rects.map(({ id: _id, ...rest }) => rest);
  const response = await fetch("/api/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdf_base64: pdfBase64, rects: apiRects, settings }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

export function downloadBlob(base64: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
