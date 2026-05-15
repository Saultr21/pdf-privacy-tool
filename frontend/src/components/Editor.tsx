import { useMemo, useState } from "react";
import {
  Check,
  Download,
  Eraser,
  FileDown,
  FilePlus,
  Info,
  Loader2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import type { ApplyResponse, RedactRect } from "../api";
import { downloadBlob, downloadText } from "../api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Kbd, Tooltip } from "./ui/Tooltip";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import DropZone from "./DropZone";
import PdfPanel from "./PdfPanel";
import { cn } from "../lib/cn";

type Mode = "draw" | "erase";

interface Props {
  base64: string;
  rects: RedactRect[];
  applying: boolean;
  dirty: boolean;
  appliedResult: ApplyResponse | null;
  fileName: string;
  hasFile: boolean;
  onAddRect: (rect: Omit<RedactRect, "id" | "label">) => void;
  onRemoveRect: (id: string) => void;
  onUndo: () => void;
  onApply: () => void;
  onNewFile: () => void;
  onFileSelected: (file: File) => void;
}

export default function Editor(props: Props) {
  const { hasFile } = props;
  return hasFile ? <EditorFull {...props} /> : <EditorEmpty {...props} />;
}

function EditorEmpty({ onFileSelected }: Props) {
  return (
    <div className="h-full overflow-auto">
      <DropZone onFileSelected={onFileSelected} />
    </div>
  );
}

function EditorFull({
  base64,
  rects,
  applying,
  dirty,
  appliedResult,
  fileName,
  onAddRect,
  onRemoveRect,
  onUndo,
  onApply,
  onNewFile,
}: Props) {
  const [mode, setMode] = useState<Mode>("draw");
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [scrollTargetPage, setScrollTargetPage] = useState(0);
  const [scrollToken, setScrollToken] = useState(0);

  const canUndo = rects.length > 0;
  const canApply = dirty && !applying;
  const baseName = fileName.replace(/\.pdf$/i, "") || "documento";
  const hasText = !!appliedResult && appliedResult.text.trim().length > 0;
  const isScanned = !!appliedResult && !hasText;

  function jumpToPage() {
    if (!totalPages) return;
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) return;
    const page = Math.min(Math.max(parsed, 1), totalPages);
    setPageInput(String(page));
    setScrollTargetPage(page - 1);
    setScrollToken((t) => t + 1);
  }

  const shortcuts = useMemo(
    () => [
      { key: "z", ctrl: true, handler: () => canUndo && onUndo() },
      { key: "Enter", ctrl: true, handler: () => canApply && onApply() },
      { key: "d", handler: () => setMode("draw") },
      { key: "e", handler: () => setMode("erase") },
    ],
    [canApply, canUndo, onApply, onUndo],
  );

  useKeyboardShortcuts(shortcuts, true);

  const modeAccent = mode === "draw" ? "red" : "amber";

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-6 py-3">
          {/* File chip */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-950 text-[9px] font-bold text-white">
                PDF
              </div>
              <span className="truncate text-sm font-medium text-slate-800">
                {fileName || "documento.pdf"}
              </span>
            </div>
          </div>

          {/* Section: Modo */}
          <ToolbarSection label="Modo">
            <div
              role="radiogroup"
              aria-label="Modo de edición"
              className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
            >
              <ModeButton
                active={mode === "draw"}
                onClick={() => setMode("draw")}
                shortcut="D"
                accent="red"
                icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                label="Dibujar"
              />
              <ModeButton
                active={mode === "erase"}
                onClick={() => setMode("erase")}
                shortcut="E"
                accent="amber"
                icon={<Eraser className="h-3.5 w-3.5" aria-hidden />}
                label="Borrar"
              />
            </div>
            <Tooltip
              content={
                <>
                  Deshacer último <Kbd>Ctrl+Z</Kbd>
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
          </ToolbarSection>

          {/* Section: Navegación */}
          <ToolbarSection label="Página">
            <form
              className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2"
              onSubmit={(e) => {
                e.preventDefault();
                jumpToPage();
              }}
            >
              <input
                id="page-jump"
                type="number"
                min={1}
                max={totalPages || 1}
                value={pageInput}
                aria-label="Página"
                onChange={(e) => setPageInput(e.target.value)}
                className="h-7 w-12 rounded border border-slate-300 bg-white px-2 text-sm font-medium tabular-nums text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
              />
              <span className="text-xs font-medium tabular-nums text-slate-500">
                / {totalPages || "—"}
              </span>
            </form>
            <Badge tone="neutral">
              {rects.length} {rects.length === 1 ? "zona" : "zonas"}
            </Badge>
            {dirty && <Badge tone="warning">Sin aplicar</Badge>}
            {!dirty && appliedResult && (
              <Badge tone="success">
                <Check className="h-3 w-3" aria-hidden />
                Aplicado
              </Badge>
            )}
          </ToolbarSection>

          {/* Section: Acciones */}
          <ToolbarSection label="Acciones" align="end">
            <Tooltip
              content={
                <>
                  Aplicar redacciones <Kbd>Ctrl+Enter</Kbd>
                </>
              }
            >
              <Button disabled={!canApply} onClick={onApply}>
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
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadBlob(
                      appliedResult.pdf_base64,
                      `${baseName}_redactado.pdf`,
                      "application/pdf",
                    )
                  }
                >
                  <Download className="h-4 w-4" aria-hidden />
                  PDF
                </Button>
                <Tooltip
                  content={
                    hasText
                      ? "Descargar texto censurado"
                      : "El PDF no tiene capa de texto (es una imagen escaneada). El TXT solo se genera para PDFs digitales."
                  }
                >
                  <Button
                    variant="outline"
                    disabled={!hasText}
                    onClick={() =>
                      downloadText(
                        appliedResult.text,
                        `${baseName}_redactado.txt`,
                      )
                    }
                  >
                    <FileDown className="h-4 w-4" aria-hidden />
                    TXT
                  </Button>
                </Tooltip>
              </>
            )}
            <Button variant="ghost" onClick={onNewFile} size="sm">
              <FilePlus className="h-4 w-4" aria-hidden />
              Cambiar PDF
            </Button>
          </ToolbarSection>
        </div>
        {isScanned && (
          <div className="border-t border-amber-200 bg-amber-50">
            <div className="mx-auto flex max-w-screen-2xl items-start gap-2 px-6 py-2 text-xs text-amber-900">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Este PDF es una imagen escaneada (sin capa de texto). La
                redacción visual se aplica correctamente, pero la exportación a
                TXT no está disponible.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dual panes */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto grid h-full max-w-screen-2xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-2 min-h-0">
          <Pane
            title="Original"
            subtitle="Documento sin modificar"
            accent="neutral"
          >
            <PdfPanel
              base64={base64}
              onDocLoad={setTotalPages}
              scrollToPage={scrollTargetPage}
              scrollToken={scrollToken}
              drawMode={false}
              removeMode={false}
              rects={[]}
            />
          </Pane>
          <Pane
            title="Editor"
            subtitle={
              mode === "draw"
                ? "Arrastra para dibujar una zona negra"
                : "Haz clic en una zona para retirarla"
            }
            accent={modeAccent}
          >
            <PdfPanel
              base64={base64}
              scrollToPage={scrollTargetPage}
              scrollToken={scrollToken}
              drawMode={mode === "draw"}
              removeMode={mode === "erase"}
              rects={rects}
              onRectDrawn={onAddRect}
              onRectClick={onRemoveRect}
            />
          </Pane>
        </div>
      </div>
    </div>
  );
}

function ToolbarSection({
  label,
  children,
  align = "start",
}: {
  label: string;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "end" && "ml-auto items-end",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
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
      ? "shadow-sm ring-1 ring-red-200"
      : "shadow-sm ring-1 ring-amber-200";
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
          "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
          active
            ? "bg-white font-semibold text-slate-950"
            : "font-medium text-slate-600 hover:text-slate-900",
          active && activeRing,
        )}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}

function Pane({
  title,
  subtitle,
  accent = "neutral",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: "neutral" | "red" | "amber";
  children: React.ReactNode;
}) {
  const accentBorder =
    accent === "red"
      ? "ring-2 ring-red-200/60 ring-offset-2 ring-offset-slate-50"
      : accent === "amber"
        ? "ring-2 ring-amber-200/60 ring-offset-2 ring-offset-slate-50"
        : "";
  const dotColor =
    accent === "red"
      ? "bg-red-500"
      : accent === "amber"
        ? "bg-amber-500"
        : "bg-slate-300";

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition",
        accentBorder,
      )}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", dotColor)} aria-hidden />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs font-normal text-slate-500">
              · {subtitle}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-auto bg-slate-100 p-4">{children}</div>
    </section>
  );
}
