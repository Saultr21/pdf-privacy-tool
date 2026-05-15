import { useState } from "react";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import HelpDialog from "./HelpDialog";

interface Props {
  right?: React.ReactNode;
}

export default function AppHeader({ right }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-slate-950">
                Redact PII
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Censura manual de PDFs · procesado 100% local
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {right}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpOpen(true)}
              aria-label="Abrir ayuda y atajos de teclado"
            >
              <CircleHelp className="h-4 w-4" aria-hidden />
              Ayuda
            </Button>
          </div>
        </div>
      </header>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
