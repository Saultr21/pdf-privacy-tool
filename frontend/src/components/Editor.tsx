import { useMemo, useState } from "react";
import {
  Download,
  Eraser,
  FileDown,
  FilePlus,
  Info,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ApplyResponse, RedactRect } from "../api";
import { downloadBlob, downloadText } from "../api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Kbd, Tooltip } from "./ui/Tooltip";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import DropZone from "./DropZone";
import PdfPanel from "./PdfPanel";

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

export default function Editor({
  base64,
  rects,
  applying,
  dirty,
  appliedResult,
  fileName,
  hasFile,
  onAddRect,
  onRemoveRect,
  onUndo,
  onApply,
  onNewFile,
  onFileSelected,
}: Props) {
  const [mode, setMode] = useState<Mode>("draw");
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [scrollTargetPage, setScrollTargetPage] = useState(0);
  const [scrollToken, setScrollToken] = useState(0);

  const canUndo = rects.length > 0;
  const canApply = hasFile && dirty && !applying;
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

  useKeyboardShortcuts(shortcuts, hasFile);

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Modo de edición"
              className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
            >
              <Tooltip
                content={
                  <>
                    Dibujar zona <Kbd>D</Kbd>
                  </>
                }
              >
                <button
                  role="radio"
                  aria-checked={mode === "draw"}
                  disabled={!hasFile}
                  onClick={() => setMode("draw")}
                  className={
                    mode === "draw"
                      ? "inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-40"
                      : "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-40"
                  }
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Dibujar
                </button>
              </Tooltip>
              <Tooltip
                content={
                  <>
                    Borrar zona <Kbd>E</Kbd>
                  </>
                }
              >
                <button
                  role="radio"
                  aria-checked={mode === "erase"}
                  disabled={!hasFile}
                  onClick={() => setMode("erase")}
                  className={
                    mode === "erase"
                      ? "inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-40"
                      : "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-40"
                  }
                >
                  <Eraser className="h-3.5 w-3.5" aria-hidden />
                  Borrar
                </button>
              </Tooltip>
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

            <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

            <form
              className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2"
              onSubmit={(e) => {
                e.preventDefault();
                jumpToPage();
              }}
            >
              <label
                className="text-xs font-medium text-slate-600"
                htmlFor="page-jump"
              >
                Página
              </label>
              <input
                id="page-jump"
                type="number"
                min={1}
                max={totalPages || 1}
                disabled={!hasFile}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="h-7 w-14 rounded border border-slate-300 bg-white px-2 text-sm font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-40"
              />
              <span className="text-xs font-medium text-slate-500">
                / {totalPages || "—"}
              </span>
            </form>

            {hasFile && (
              <>
                <Badge tone="neutral">
                  {rects.length} {rects.length === 1 ? "zona" : "zonas"}
                </Badge>
                {dirty && <Badge tone="warning">Sin aplicar</Badge>}
                {!dirty && appliedResult && (
                  <Badge tone="success">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Aplicado
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasFile && (
              <>
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

                <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
              </>
            )}

            <Button variant="outline" onClick={onNewFile}>
              <FilePlus className="h-4 w-4" aria-hidden />
              {hasFile ? "Otro PDF" : "Nuevo PDF"}
            </Button>
          </div>
        </div>
        {isScanned && (
          <div className="border-t border-amber-200 bg-amber-50">
            <div className="mx-auto flex max-w-screen-2xl items-start gap-2 px-6 py-2 text-xs text-amber-900">
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

      <div className="flex-1 min-h-0 overflow-hidden">
        {hasFile ? (
          <div className="mx-auto grid h-full max-w-screen-2xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-2 min-h-0">
            <Pane title="Original">
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
              title="Redactado"
              detail={
                mode === "draw"
                  ? "Arrastra para dibujar"
                  : "Clic en una zona para borrar"
              }
              tone={mode === "draw" ? "danger" : "warning"}
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
        ) : (
          <div className="h-full overflow-auto bg-slate-100">
            <div className="mx-auto h-full max-w-5xl px-6 py-6">
              <DropZone onFileSelected={onFileSelected} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Pane({
  title,
  detail,
  tone = "neutral",
  children,
}: {
  title: string;
  detail?: string;
  tone?: "neutral" | "danger" | "warning";
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {detail && (
          <Badge
            tone={
              tone === "danger"
                ? "danger"
                : tone === "warning"
                  ? "warning"
                  : "neutral"
            }
          >
            {detail}
          </Badge>
        )}
      </header>
      <div className="flex-1 overflow-auto bg-slate-100 p-4">{children}</div>
    </section>
  );
}
