import { useState, useCallback } from "react";
import type { RedactRect, RedactSettings, ApplyResponse } from "./api";
import {
  DEFAULT_SETTINGS,
  detectPii,
  applyRedactions,
  fileToBase64,
  makeRectId,
} from "./api";
import Uploader from "./components/Uploader";
import ProcessingStatus from "./components/ProcessingStatus";
import DualViewer from "./components/DualViewer";
import DownloadPanel from "./components/DownloadPanel";
import SettingsPanel from "./components/SettingsPanel";

type AppState = "idle" | "detecting" | "editing" | "applying" | "applied" | "error";

export default function App() {
  const [state, setState] = useState<AppState>("idle");
  const [settings, setSettings] = useState<RedactSettings>(DEFAULT_SETTINGS);
  const [originalBase64, setOriginalBase64] = useState("");
  const [rects, setRects] = useState<RedactRect[]>([]);
  const [appliedResult, setAppliedResult] = useState<ApplyResponse | null>(null);
  const [stats, setStats] = useState({ pages: 0, ocr: 0, pii: 0 });
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dirty, setDirty] = useState(false);

  async function handleProcess(file: File) {
    setState("detecting");
    setError("");
    setFileName(file.name);
    setAppliedResult(null);
    setDirty(false);
    try {
      const b64 = await fileToBase64(file);
      setOriginalBase64(b64);
      const res = await detectPii(b64, settings);
      const clientRects: RedactRect[] = res.rects.map((r) => ({
        ...r,
        id: makeRectId(),
      }));
      setRects(clientRects);
      setStats({
        pages: res.pages_processed,
        ocr: res.ocr_pages,
        pii: res.pii_count,
      });
      // Auto-apply initial redactions
      setState("applying");
      const applied = await applyRedactions(b64, clientRects, settings);
      setAppliedResult(applied);
      setState("applied");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setState("error");
    }
  }

  const handleApply = useCallback(async () => {
    setState("applying");
    try {
      const applied = await applyRedactions(originalBase64, rects, settings);
      setAppliedResult(applied);
      setDirty(false);
      setState("applied");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aplicar");
      setState("error");
    }
  }, [originalBase64, rects, settings]);

  const handleAddRect = useCallback(
    (rect: Omit<RedactRect, "id" | "label">) => {
      setRects((prev) => [
        ...prev,
        { ...rect, label: "manual", id: makeRectId() },
      ]);
      setDirty(true);
    },
    []
  );

  const handleRemoveRect = useCallback((id: string) => {
    setRects((prev) => prev.filter((r) => r.id !== id));
    setDirty(true);
  }, []);

  function handleReset() {
    setState("idle");
    setOriginalBase64("");
    setRects([]);
    setAppliedResult(null);
    setError("");
    setDirty(false);
  }

  const isEditing =
    state === "editing" || state === "applied" || state === "applying";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">PII Redactor</h1>
            <p className="text-xs text-gray-500">
              100% local — nada sale de tu dispositivo
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing && (
              <>
                {/* Status indicator */}
                {state === "applying" && (
                  <span className="flex items-center gap-1.5 text-sm text-blue-600">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                    Aplicando...
                  </span>
                )}
                {state === "applied" && !dirty && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cambios aplicados
                  </span>
                )}
                {dirty && (
                  <button
                    onClick={handleApply}
                    disabled={state === "applying"}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Aplicar cambios
                  </button>
                )}
              </>
            )}
            {isEditing && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Nuevo PDF
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {state === "idle" && (
          <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
            <SettingsPanel settings={settings} onChange={setSettings} />
            <Uploader onFileSelected={handleProcess} />
          </div>
        )}

        {state === "detecting" && (
          <div className="flex-1 flex items-center justify-center">
            <ProcessingStatus />
          </div>
        )}

        {state === "error" && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
              <p className="text-red-700 font-medium mb-3">{error}</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2">
              <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {stats.pages} pág.
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    {stats.ocr} OCR
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {rects.length} zonas
                  </span>
                  {dirty && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      Sin aplicar
                    </span>
                  )}
                </div>
                {appliedResult && !dirty && (
                  <DownloadPanel
                    pdfBase64={appliedResult.pdf_base64}
                    text={appliedResult.text}
                    originalName={fileName}
                  />
                )}
              </div>
            </div>
            <DualViewer
              originalBase64={originalBase64}
              rects={rects}
              onAddRect={handleAddRect}
              onRemoveRect={handleRemoveRect}
            />
          </div>
        )}
      </main>
    </div>
  );
}
