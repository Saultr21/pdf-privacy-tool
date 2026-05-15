export interface RedactRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  id: string;
}

export interface ApplyResponse {
  pdf_base64: string;
  text: string;
}

let _idCounter = 0;
export function makeRectId(): string {
  return `rect_${++_idCounter}_${Date.now()}`;
}

export function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  });
}

export async function applyRedactions(
  pdfBase64: string,
  rects: RedactRect[],
): Promise<ApplyResponse> {
  const apiRects = rects.map(({ id: _id, ...rest }) => rest);
  const response = await fetch("/api/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdf_base64: pdfBase64, rects: apiRects, settings: {} }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

export function downloadBlob(base64: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  triggerDownload(new Blob([bytes], { type: mimeType }), filename);
}

export function downloadText(text: string, filename: string) {
  triggerDownload(
    new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }),
    filename,
  );
}
