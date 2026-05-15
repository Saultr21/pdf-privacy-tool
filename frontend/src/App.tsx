import { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { ApplyResponse, RedactRect } from "./api";
import { applyRedactions, fileToBase64, makeRectId } from "./api";
import AppHeader from "./components/AppHeader";
import DualViewer from "./components/DualViewer";
import Uploader from "./components/Uploader";
import { Button } from "./components/ui/Button";

type AppState = "idle" | "editing" | "error";

export default function App() {
  const [state, setState] = useState<AppState>("idle");
  const [originalBase64, setOriginalBase64] = useState("");
  const [rects, setRects] = useState<RedactRect[]>([]);
  const [appliedResult, setAppliedResult] = useState<ApplyResponse | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleStart = useCallback(async (file: File) => {
    try {
      setError("");
      setFileName(file.name);
      setAppliedResult(null);
      setDirty(false);
      setRects([]);
      const b64 = await fileToBase64(file);
      setOriginalBase64(b64);
      setState("editing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el PDF");
      setState("error");
    }
  }, []);

  const handleApply = useCallback(async () => {
    setApplying(true);
    setError("");
    try {
      const applied = await applyRedactions(originalBase64, rects);
      setAppliedResult(applied);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aplicar");
      setState("error");
    } finally {
      setApplying(false);
    }
  }, [originalBase64, rects]);

  const handleAddRect = useCallback(
    (rect: Omit<RedactRect, "id" | "label">) => {
      setRects((prev) => [...prev, { ...rect, label: "manual", id: makeRectId() }]);
      setDirty(true);
    },
    [],
  );

  const handleRemoveRect = useCallback((id: string) => {
    setRects((prev) => prev.filter((r) => r.id !== id));
    setDirty(true);
  }, []);

  const handleUndo = useCallback(() => {
    setRects((prev) => {
      if (prev.length === 0) return prev;
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setOriginalBase64("");
    setRects([]);
    setAppliedResult(null);
    setError("");
    setDirty(false);
    setFileName("");
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-slate-950 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar al contenido
      </a>
      <AppHeader />
      <main id="main" className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {state === "idle" && <Uploader onFileSelected={handleStart} />}

        {state === "editing" && (
          <DualViewer
            originalBase64={originalBase64}
            rects={rects}
            dirty={dirty}
            applying={applying}
            appliedResult={appliedResult}
            fileName={fileName}
            onAddRect={handleAddRect}
            onRemoveRect={handleRemoveRect}
            onUndo={handleUndo}
            onApply={handleApply}
            onNewFile={handleReset}
            canUndo={rects.length > 0}
          />
        )}

        {state === "error" && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div
              role="alert"
              className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" aria-hidden />
              </div>
              <p className="mb-4 text-sm font-medium text-red-800">{error}</p>
              <Button variant="destructive" onClick={handleReset}>
                Volver al inicio
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
