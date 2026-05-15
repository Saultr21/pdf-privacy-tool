import { useCallback, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { cn } from "../lib/cn";

interface Props {
  onFileSelected: (file: File) => void;
  compact?: boolean;
}

const MAX_BYTES = 100 * 1024 * 1024;

export default function DropZone({ onFileSelected, compact = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      setError(null);
      if (f.type !== "application/pdf") {
        setError("Solo se aceptan archivos PDF.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("El PDF supera el límite de 100 MB.");
        return;
      }
      onFileSelected(f);
    },
    [onFileSelected],
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center",
        compact ? "py-10" : "min-h-full py-16",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Soltar PDF o pulsar Enter para abrir el selector"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "group flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-10 py-14 text-center transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
          dragOver
            ? "border-slate-950 bg-slate-50"
            : "border-slate-300 hover:border-slate-500 hover:bg-slate-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          className="sr-only"
        />
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
          <FileUp className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-base font-semibold text-slate-900">
          Arrastra un PDF aquí
        </p>
        <p className="mt-1 text-sm text-slate-500">
          o haz clic para seleccionar un archivo · hasta 100 MB
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Procesamiento 100% local. Nada se envía a Internet.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 w-full max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}
    </div>
  );
}
