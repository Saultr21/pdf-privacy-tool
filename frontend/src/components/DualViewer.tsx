import { useState } from "react";
import type { ApplyResponse, RedactRect } from "../api";
import DownloadPanel from "./DownloadPanel";
import PdfPanel from "./PdfPanel";

interface Props {
  originalBase64: string;
  rects: RedactRect[];
  stats: { pages: number; ocr: number; pii: number };
  dirty: boolean;
  appliedResult: ApplyResponse | null;
  fileName: string;
  onAddRect: (rect: Omit<RedactRect, "id" | "label">) => void;
  onRemoveRect: (id: string) => void;
}

export default function DualViewer({
  originalBase64,
  rects,
  stats,
  dirty,
  appliedResult,
  fileName,
  onAddRect,
  onRemoveRect,
}: Props) {
  const [mode, setMode] = useState<"select" | "remove" | "none">("none");
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [scrollTargetPage, setScrollTargetPage] = useState(0);
  const [scrollToken, setScrollToken] = useState(0);

  function jumpToPage() {
    if (!totalPages) return;
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) return;
    const page = Math.min(Math.max(parsed, 1), totalPages);
    setPageInput(String(page));
    setScrollTargetPage(page - 1);
    setScrollToken((token) => token + 1);
  }

  const toolButton =
    "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMode(mode === "select" ? "none" : "select")}
              className={`${toolButton} ${
                mode === "select"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 17h16M7 4v16M17 4v16" />
              </svg>
              Censurar zona
            </button>

            <button
              onClick={() => setMode(mode === "remove" ? "none" : "remove")}
              className={`${toolButton} ${
                mode === "remove"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Quitar censura
            </button>

            {mode !== "none" && (
              <button
                onClick={() => setMode("none")}
                className="h-9 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Cancelar
              </button>
            )}

            <div className="h-6 w-px bg-slate-200" />

            <form
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2"
              onSubmit={(e) => {
                e.preventDefault();
                jumpToPage();
              }}
            >
              <label className="text-xs font-semibold text-slate-600" htmlFor="page-jump">
                Página
              </label>
              <input
                id="page-jump"
                type="number"
                min={1}
                max={totalPages || 1}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="h-7 w-16 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500"
              />
              <span className="text-xs font-medium text-slate-500">/ {totalPages || "-"}</span>
              <button
                type="submit"
                disabled={!totalPages}
                className="h-7 rounded-md bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ir
              </button>
            </form>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1.5">
              <StatPill tone="blue">{stats.pages} pág.</StatPill>
              <StatPill tone="amber">{stats.ocr} OCR</StatPill>
              <StatPill tone="red">{rects.length} zonas</StatPill>
              {dirty && <StatPill tone="orange">Sin aplicar</StatPill>}
            </div>
            {appliedResult && !dirty && (
              <DownloadPanel
                pdfBase64={appliedResult.pdf_base64}
                text={appliedResult.text}
                originalName={fileName}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-8 py-6">
        <div className="mx-auto grid h-full max-w-[1800px] grid-cols-2 gap-6 min-h-0">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <PanelHeader title="Original" />
            <div className="flex-1 overflow-auto bg-slate-200 p-6">
              <PdfPanel
                base64={originalBase64}
                onDocLoad={setTotalPages}
                scrollToPage={scrollTargetPage}
                scrollToken={scrollToken}
                drawMode={false}
                removeMode={false}
                rects={[]}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <PanelHeader
              title="Redactado"
              detail={
                mode === "select"
                  ? "Dibuja un rectángulo"
                  : mode === "remove"
                    ? "Clic en una zona negra"
                    : undefined
              }
              tone={mode === "select" ? "red" : mode === "remove" ? "amber" : "slate"}
            />
            <div className="flex-1 overflow-auto bg-slate-200 p-6">
              <PdfPanel
                base64={originalBase64}
                scrollToPage={scrollTargetPage}
                scrollToken={scrollToken}
                drawMode={mode === "select"}
                removeMode={mode === "remove"}
                rects={rects}
                onRectDrawn={onAddRect}
                onRectClick={onRemoveRect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "amber" | "red" | "orange";
}) {
  const classes = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  }[tone];

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

function PanelHeader({
  title,
  detail,
  tone = "slate",
}: {
  title: string;
  detail?: string;
  tone?: "slate" | "red" | "amber";
}) {
  const detailClass =
    tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </span>
      {detail && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${detailClass}`}>
          {detail}
        </span>
      )}
    </div>
  );
}
