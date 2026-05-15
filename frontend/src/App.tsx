import { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { ApplyResponse, RedactRect } from "./api";
import { applyRedactions, fileToBase64, makeRectId } from "./api";
import AppHeader from "./components/AppHeader";
import Editor from "./components/Editor";
import { Button } from "./components/ui/Button";

export default function App() {
  const [base64, setBase64] = useState("");
  const [rects, setRects] = useState<RedactRect[]>([]);
  const [appliedResult, setAppliedResult] = useState<ApplyResponse | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [applying, setApplying] = useState(false);

  const hasFile = base64.length > 0;

  const handleStart = useCallback(async (file: File) => {
    try {
      setError("");
      setFileName(file.name);
      setAppliedResult(null);
      setDirty(false);
      setRects([]);
      const b64 = await fileToBase64(file);
      setBase64(b64);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el PDF");
    }
  }, []);

  const handleApply = useCallback(async () => {
    if (!base64 || !dirty) return;
    setApplying(true);
    setError("");
    try {
      const applied = await applyRedactions(base64, rects);
      // Reemplazamos el PDF en pantalla por el redactado, dejándolo listo
      // para nuevas zonas si el usuario quiere iterar.
      setBase64(applied.pdf_base64);
      setRects([]);
      setAppliedResult(applied);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aplicar las redacciones");
    } finally {
      setApplying(false);
    }
  }, [base64, dirty, rects]);

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
    setBase64("");
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
        <Editor
          base64={base64}
          rects={rects}
          applying={applying}
          dirty={dirty}
          appliedResult={appliedResult}
          fileName={fileName}
          hasFile={hasFile}
          onAddRect={handleAddRect}
          onRemoveRect={handleRemoveRect}
          onUndo={handleUndo}
          onApply={handleApply}
          onNewFile={handleReset}
          onFileSelected={handleStart}
        />
      </main>
      {error && (
        <div
          role="alert"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-red-200 bg-white px-4 py-3 shadow-lg">
            <AlertCircle className="h-5 w-5 text-red-600" aria-hidden />
            <span className="text-sm font-medium text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError("")}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
