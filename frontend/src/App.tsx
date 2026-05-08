import { useCallback, useState } from "react";
import type { ApplyResponse, RedactRect, RedactSettings } from "./api";
import {
  DEFAULT_SETTINGS,
  applyRedactions,
  detectPii,
  fileToBase64,
  makeRectId,
} from "./api";
import DualViewer from "./components/DualViewer";
import ProcessingStatus from "./components/ProcessingStatus";
import SettingsPanel from "./components/SettingsPanel";
import Uploader from "./components/Uploader";

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

  const handleAddRect = useCallback((rect: Omit<RedactRect, "id" | "label">) => {
    setRects((prev) => [...prev, { ...rect, label: "manual", id: makeRectId() }]);
    setDirty(true);
  }, []);

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
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 flex flex-col">
      <header className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16v14H4zM8 9h8M8 13h5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                PII Redactor
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Procesamiento local
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isEditing && (
              <>
                {state === "applying" && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    Aplicando
                  </span>
                )}
                {state === "applied" && !dirty && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
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
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Aplicar cambios
                  </button>
                )}
              </>
            )}
            {isEditing && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Nuevo PDF
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {state === "idle" && (
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
            <SettingsPanel settings={settings} onChange={setSettings} />
            <Uploader onFileSelected={handleProcess} />
          </div>
        )}

        {state === "detecting" && (
          <div className="flex-1 flex items-center justify-center px-6">
            <ProcessingStatus />
          </div>
        )}

        {state === "error" && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
              </div>
              <p className="mb-4 font-medium text-red-700">{error}</p>
              <button
                onClick={handleReset}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {isEditing && (
          <DualViewer
            originalBase64={originalBase64}
            rects={rects}
            stats={stats}
            dirty={dirty}
            appliedResult={appliedResult}
            fileName={fileName}
            onAddRect={handleAddRect}
            onRemoveRect={handleRemoveRect}
          />
        )}
      </main>
    </div>
  );
}
