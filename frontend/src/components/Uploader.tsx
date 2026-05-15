import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

interface Props {
  onFileSelected: (file: File) => void;
}

const MAX_BYTES = 100 * 1024 * 1024;

export default function Uploader({ onFileSelected }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (f.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("El PDF supera el límite de 100 MB.");
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Empieza por subir un PDF
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          El archivo se procesa íntegramente en tu equipo. Nada se envía a Internet.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Soltar PDF o pulsar Enter para abrir el selector de archivos"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-8 text-center transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
          dragOver
            ? "border-slate-950 bg-slate-50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="sr-only"
        />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Upload className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-slate-900">
          Arrastra un PDF o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF · hasta 100 MB</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quitar archivo"
              onClick={() => setFile(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
            <Button onClick={() => onFileSelected(file)}>Continuar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
