import { useState, type FormEvent } from "react";
import {
  Check,
  Download,
  Eraser,
  FileDown,
  FilePlus,
  FileText,
  Info,
  Loader2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import type { ApplyResponse } from "../../api";
import { downloadBlob, downloadText } from "../../api";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Kbd, Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/cn";
import type { Mode } from "./types";

interface Props {
  fileName: string;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  rectsCount: number;
  totalPages: number;
  currentPage: number;
  onJumpPage: (page: number) => void;
  dirty: boolean;
  applying: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onApply: () => void;
  onNewFile: () => void;
  appliedResult: ApplyResponse | null;
}

export default function EditorToolbar({
  fileName,
  mode,
  onModeChange,
  rectsCount,
  totalPages,
  currentPage,
  onJumpPage,
  dirty,
  applying,
  canUndo,
  onUndo,
  onApply,
  onNewFile,
  appliedResult,
}: Props) {
  const [pageInput, setPageInput] = useState("1");
  const baseName = fileName.replace(/\.pdf$/i, "") || "documento";
  const hasText = !!appliedResult && appliedResult.text.trim().length > 0;
  const isScanned = !!appliedResult && !hasText;
  const canApply = dirty && !applying;

  // keep pageInput in sync with prop when caller programmatically jumps
  if (String(currentPage) !== pageInput && document.activeElement?.id !== "page-jump") {
    queueMicrotask(() => setPageInput(String(currentPage)));
  }

  function submitJump(e: FormEvent) {
    e.preventDefault();
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) return;
    onJumpPage(parsed);
  }

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3">
        {/* File chip */}
        <div className="flex min-w-0 flex-1 items-center">
          <div className="flex min-w-0 max-w-md items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <FileText
              className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
              aria-hidden
            />
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {fileName || "documento.pdf"}
            </span>
          </div>
        </div>

        <Section label="Modo">
          <div
            role="radiogroup"
            aria-label="Modo de edición"
            className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <ModeButton
              active={mode === "draw"}
              onClick={() => onModeChange("draw")}
              shortcut="D"
              accent="red"
              icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
              label="Dibujar"
            />
            <ModeButton
              active={mode === "erase"}
              onClick={() => onModeChange("erase")}
              shortcut="E"
              accent="amber"
              icon={<Eraser className="h-3.5 w-3.5" aria-hidden />}
              label="Borrar"
            />
          </div>
          <Tooltip
            content={
              <>
                Deshacer <Kbd>Ctrl+Z</Kbd>
              </>
            }
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Deshacer último rectángulo"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </Button>
          </Tooltip>
        </Section>

        <Section label="Página">
          <form
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 dark:border-slate-700 dark:bg-slate-800"
            onSubmit={submitJump}
          >
            <input
              id="page-jump"
              type="number"
              min={1}
              max={totalPages || 1}
              value={pageInput}
              aria-label="Página"
              onChange={(e) => setPageInput(e.target.value)}
              className="h-7 w-12 rounded border border-slate-300 bg-white px-2 text-sm font-medium tabular-nums text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus-visible:ring-slate-200"
            />
            <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
              / {totalPages || "—"}
            </span>
          </form>
          <Badge tone="neutral">
            {rectsCount} {rectsCount === 1 ? "zona" : "zonas"}
          </Badge>
          {dirty && <Badge tone="warning">Sin aplicar</Badge>}
          {!dirty && appliedResult && (
            <Badge tone="success">
              <Check className="h-3 w-3" aria-hidden />
              Aplicado
            </Badge>
          )}
        </Section>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Acciones
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <Tooltip
              content={
                <>
                  Aplicar redacciones <Kbd>Ctrl+Enter</Kbd>
                </>
              }
            >
              <Button
                disabled={!canApply}
                onClick={onApply}
                className="min-w-[8rem]"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Aplicando…
                  </>
                ) : (
                  <>Aplicar cambios</>
                )}
              </Button>
            </Tooltip>
            {appliedResult && !dirty && (
              <>
                <Divider />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      appliedResult.pdf_base64,
                      `${baseName}_redactado.pdf`,
                      "application/pdf",
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  PDF
                </Button>
                <Tooltip
                  content={
                    hasText
                      ? "Descargar texto censurado"
                      : "El PDF no tiene capa de texto. El TXT solo se genera para PDFs digitales."
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasText}
                    onClick={() =>
                      downloadText(
                        appliedResult.text,
                        `${baseName}_redactado.txt`,
                      )
                    }
                  >
                    <FileDown className="h-3.5 w-3.5" aria-hidden />
                    TXT
                  </Button>
                </Tooltip>
              </>
            )}
            <Divider />
            <Tooltip content="Cargar un PDF diferente">
              <Button
                variant="outline"
                size="sm"
                onClick={onNewFile}
                aria-label="Cambiar PDF"
              >
                <FilePlus className="h-3.5 w-3.5" aria-hidden />
                Cambiar
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      {isScanned && (
        <div className="border-t border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <div className="mx-auto flex max-w-screen-2xl items-start gap-2 px-6 py-2 text-xs text-amber-900 dark:text-amber-300">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Este PDF es una imagen escaneada (sin capa de texto). La redacción
              visual se aplica correctamente, pero la exportación a TXT no está
              disponible.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function Divider() {
  return (
    <span className="h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
  );
}

function ModeButton({
  active,
  onClick,
  shortcut,
  accent,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  shortcut: string;
  accent: "red" | "amber";
  icon: React.ReactNode;
  label: string;
}) {
  const activeRing =
    accent === "red"
      ? "shadow-sm ring-1 ring-red-200 dark:ring-red-900"
      : "shadow-sm ring-1 ring-amber-200 dark:ring-amber-900";
  return (
    <Tooltip
      content={
        <>
          {label} <Kbd>{shortcut}</Kbd>
        </>
      }
    >
      <button
        role="radio"
        aria-checked={active}
        onClick={onClick}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-200",
          active
            ? "bg-white font-semibold text-slate-950 dark:bg-slate-900 dark:text-slate-100"
            : "font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          active && activeRing,
        )}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}
