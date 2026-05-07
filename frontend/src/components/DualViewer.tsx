import { useState, useCallback } from "react";
import type { RedactRect } from "../api";
import PdfPanel from "./PdfPanel";

interface Props {
  originalBase64: string;
  rects: RedactRect[];
  onAddRect: (rect: Omit<RedactRect, "id" | "label">) => void;
  onRemoveRect: (id: string) => void;
}

export default function DualViewer({
  originalBase64,
  rects,
  onAddRect,
  onRemoveRect,
}: Props) {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<"select" | "remove" | "none">("none");

  const handleDocLoad = useCallback((numPages: number) => {
    setTotalPages(numPages);
  }, []);

  const handleNewRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      onAddRect({ page, ...rect });
    },
    [page, onAddRect]
  );

  const handleRectClick = useCallback(
    (id: string) => {
      if (mode === "remove") {
        onRemoveRect(id);
      }
    },
    [mode, onRemoveRect]
  );

  const pageRects = rects.filter((r) => r.page === page);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              &larr;
            </button>
            <span className="text-sm text-gray-700 min-w-[80px] text-center">
              Pág. {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              &rarr;
            </button>
          </div>

          <div className="h-5 w-px bg-gray-300" />

          <button
            onClick={() => setMode(mode === "select" ? "none" : "select")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              mode === "select"
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {mode === "select" ? "Dibujando..." : "Censurar zona"}
          </button>

          <button
            onClick={() => setMode(mode === "remove" ? "none" : "remove")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              mode === "remove"
                ? "bg-amber-500 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {mode === "remove" ? "Clic en zona para quitar..." : "Quitar censura"}
          </button>

          {mode !== "none" && (
            <button
              onClick={() => setMode("none")}
              className="px-3 py-1.5 rounded text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Dual panels */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-300">
          <div className="shrink-0 bg-gray-50 px-3 py-1.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Original
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4">
            <PdfPanel
              base64={originalBase64}
              pageIndex={page}
              onDocLoad={handleDocLoad}
              drawMode={false}
              removeMode={false}
              rects={[]}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 bg-gray-50 px-3 py-1.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Redactado
            </span>
            {mode === "select" && (
              <span className="text-xs text-red-600 ml-2">
                Dibuja un rectángulo sobre el texto a censurar
              </span>
            )}
            {mode === "remove" && (
              <span className="text-xs text-amber-600 ml-2">
                Haz clic en una zona negra para quitarla
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4">
            <PdfPanel
              base64={originalBase64}
              pageIndex={page}
              drawMode={mode === "select"}
              removeMode={mode === "remove"}
              rects={pageRects}
              onRectDrawn={handleNewRect}
              onRectClick={handleRectClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
