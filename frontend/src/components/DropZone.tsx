import { useCallback, useRef, useState } from "react";
import { Download, FileUp, MousePointer2, ShieldCheck } from "lucide-react";
import { cn } from "../lib/cn";

interface Props {
  onFileSelected: (file: File) => void;
}

const MAX_BYTES = 100 * 1024 * 1024;

export default function DropZone({ onFileSelected }: Props) {
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
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-10">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-600 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          procesado local
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-slate-100">
          Censura PII en tus PDFs
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            de forma manual y privada.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
          Arrastra un PDF, pinta sobre la información sensible y descárgalo con
          el texto eliminado del documento. Nada sale de tu equipo.
        </p>
      </div>

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
          "group relative flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-white px-10 py-16 text-center transition-all duration-200 dark:bg-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:focus-visible:ring-slate-200 dark:focus-visible:ring-offset-slate-950",
          dragOver
            ? "scale-[1.01] border-slate-950 bg-slate-50 shadow-card dark:border-slate-200 dark:bg-slate-800"
            : "border-slate-300 hover:border-slate-500 hover:bg-slate-50 hover:shadow-card dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800",
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
        <div
          className={cn(
            "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition",
            dragOver
              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
              : "bg-slate-100 text-slate-700 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700",
          )}
        >
          <FileUp className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {dragOver ? "Suelta el archivo aquí" : "Arrastra un PDF aquí"}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          o haz clic para seleccionar · hasta 100 MB
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <Step
          n={1}
          icon={<FileUp className="h-4 w-4" aria-hidden />}
          title="Sube"
          body="Arrastra cualquier PDF, digital o escaneado."
        />
        <Step
          n={2}
          icon={<MousePointer2 className="h-4 w-4" aria-hidden />}
          title="Censura"
          body="Pinta rectángulos sobre la información sensible."
        />
        <Step
          n={3}
          icon={<Download className="h-4 w-4" aria-hidden />}
          title="Descarga"
          body="PDF con el texto eliminado, no solo tapado."
        />
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="absolute -top-2 left-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white dark:bg-white dark:text-slate-950">
        {n}
      </div>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </div>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}
