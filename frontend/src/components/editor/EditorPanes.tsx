import type { Dispatch, SetStateAction } from "react";
import type { RedactRect } from "../../api";
import PdfPanel from "../PdfPanel";
import { cn } from "../../lib/cn";
import type { Mode } from "./types";

interface Props {
  base64: string;
  mode: Mode;
  rects: RedactRect[];
  onAddRect: (rect: Omit<RedactRect, "id" | "label">) => void;
  onRemoveRect: (id: string) => void;
  onDocLoad: Dispatch<SetStateAction<number>>;
  scrollTargetPage: number;
  scrollToken: number;
}

export default function EditorPanes({
  base64,
  mode,
  rects,
  onAddRect,
  onRemoveRect,
  onDocLoad,
  scrollTargetPage,
  scrollToken,
}: Props) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="mx-auto grid h-full max-w-screen-2xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-2 min-h-0">
        <Pane title="Original" subtitle="Documento sin modificar">
          <PdfPanel
            base64={base64}
            onDocLoad={onDocLoad}
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
          accent={mode === "draw" ? "red" : "amber"}
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
      ? "ring-2 ring-red-200/60 ring-offset-2 ring-offset-slate-50 dark:ring-red-900/60 dark:ring-offset-slate-950"
      : accent === "amber"
        ? "ring-2 ring-amber-200/60 ring-offset-2 ring-offset-slate-50 dark:ring-amber-900/60 dark:ring-offset-slate-950"
        : "";
  const dotColor =
    accent === "red"
      ? "bg-red-500"
      : accent === "amber"
        ? "bg-amber-500"
        : "bg-slate-300 dark:bg-slate-600";

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition dark:border-slate-800 dark:bg-slate-900",
        accentBorder,
      )}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", dotColor)} aria-hidden />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              · {subtitle}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-auto bg-slate-100 p-4 dark:bg-slate-950">
        {children}
      </div>
    </section>
  );
}
