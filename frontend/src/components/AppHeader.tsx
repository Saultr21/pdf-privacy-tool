import { Lock } from "lucide-react";

export default function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Lock className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-950">
              Redact PII
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Censura manual de PDFs · 100% local
            </p>
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
