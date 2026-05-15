import { Dialog } from "./ui/Dialog";

interface Row {
  action: string;
  keys: string[];
}

const rows: Row[] = [
  { action: "Cambiar a modo dibujar", keys: ["D"] },
  { action: "Cambiar a modo borrar", keys: ["E"] },
  { action: "Deshacer último rectángulo", keys: ["Ctrl", "Z"] },
  { action: "Aplicar redacciones", keys: ["Ctrl", "Enter"] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HelpDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cómo usar RedactPDF"
      description="Tres pasos para censurar tus PDFs sin que nada salga de tu equipo."
    >
      <ol className="space-y-3 text-sm">
        <Step n={1} title="Sube un PDF">
          Arrastra el archivo o pulsa la zona de subida. Hasta 100 MB.
        </Step>
        <Step n={2} title="Dibuja las zonas a censurar">
          En el panel derecho, arrastra para crear un rectángulo negro sobre la
          información sensible. Usa el modo <em>Borrar</em> para retirarlo.
        </Step>
        <Step n={3} title="Aplica y descarga">
          Pulsa <strong>Aplicar cambios</strong>. El texto debajo se elimina del
          PDF — no solo se tapa. Descarga el PDF o el texto censurado.
        </Step>
      </ol>

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Atajos de teclado
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-2">
          {rows.map((r) => (
            <div
              key={r.action}
              className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800"
            >
              <dt className="text-sm text-slate-700 dark:text-slate-300">
                {r.action}
              </dt>
              <dd className="flex items-center gap-1">
                {r.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
        {n}
      </span>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{children}</p>
      </div>
    </li>
  );
}
