import { useState } from "react";
import { CircleHelp, Moon, ShieldCheck, Sun } from "lucide-react";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import HelpDialog from "./HelpDialog";
import { useTheme } from "../hooks/useTheme";

interface Props {
  right?: React.ReactNode;
}

export default function AppHeader({ right }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                RedactPDF
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Censura manual de PDFs · procesado 100% local
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {right}
            <Tooltip
              content={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              side="bottom"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={
                  theme === "dark"
                    ? "Activar modo claro"
                    : "Activar modo oscuro"
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" aria-hidden />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </Tooltip>
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
