import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { RedactRect } from "../api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface DrawnRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageSize {
  w: number;
  h: number;
}

interface Props {
  base64: string;
  onDocLoad?: (numPages: number) => void;
  scrollToPage?: number;
  scrollToken?: number;
  drawMode: boolean;
  removeMode: boolean;
  rects: RedactRect[];
  onRectDrawn?: (rect: DrawnRect) => void;
  onRectClick?: (id: string) => void;
}

export default function PdfPanel({
  base64,
  onDocLoad,
  scrollToPage,
  scrollToken,
  drawMode,
  removeMode,
  rects,
  onRectDrawn,
  onRectClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [numPages, setNumPages] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState({ page: 0, x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<DrawnRect | null>(null);
  const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
  const [containerWidth, setContainerWidth] = useState(600);
  const [hoveredRect, setHoveredRect] = useState<string | null>(null);

  const fileData = useMemo(() => {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return { data: arr };
  }, [base64]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(Math.max(320, el.clientWidth - 32));
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (scrollToPage === undefined || scrollToPage < 0) return;
    pageRefs.current[scrollToPage]?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }, [scrollToPage, scrollToken]);

  const handleDocLoad = useCallback(
    (pdf: { numPages: number }) => {
      setNumPages(pdf.numPages);
      onDocLoad?.(pdf.numPages);
    },
    [onDocLoad]
  );

  const handlePageLoad = useCallback(
    (pageIndex: number, page: { originalWidth: number; originalHeight: number }) => {
      setPageSizes((prev) => {
        const current = prev[pageIndex];
        if (
          current &&
          current.w === page.originalWidth &&
          current.h === page.originalHeight
        ) {
          return prev;
        }
        return {
          ...prev,
          [pageIndex]: { w: page.originalWidth, h: page.originalHeight },
        };
      });
    },
    []
  );

  const getDisplayWidth = useCallback(
    (pageIndex: number) => {
      const size = pageSizes[pageIndex];
      return size ? Math.min(containerWidth, size.w * 1.5) : containerWidth;
    },
    [containerWidth, pageSizes]
  );

  const getScale = useCallback(
    (pageIndex: number) => {
      const size = pageSizes[pageIndex];
      return size ? getDisplayWidth(pageIndex) / size.w : 1;
    },
    [getDisplayWidth, pageSizes]
  );

  const getRelPos = useCallback(
    (pageIndex: number, e: React.MouseEvent) => {
      const canvas = (e.currentTarget as HTMLElement).querySelector("canvas");
      const size = pageSizes[pageIndex];
      if (!canvas || !size) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * size.w,
        y: ((e.clientY - rect.top) / rect.height) * size.h,
      };
    },
    [pageSizes]
  );

  const onMouseDown = useCallback(
    (pageIndex: number, e: React.MouseEvent) => {
      if (!drawMode) return;
      e.preventDefault();
      const pt = getRelPos(pageIndex, e);
      setStartPt({ page: pageIndex, ...pt });
      setDrawing(true);
      setCurrentRect(null);
    },
    [drawMode, getRelPos]
  );

  const onMouseMove = useCallback(
    (pageIndex: number, e: React.MouseEvent) => {
      if (!drawing || startPt.page !== pageIndex) return;
      const pt = getRelPos(pageIndex, e);
      setCurrentRect({
        page: pageIndex,
        x: Math.min(startPt.x, pt.x),
        y: Math.min(startPt.y, pt.y),
        width: Math.abs(pt.x - startPt.x),
        height: Math.abs(pt.y - startPt.y),
      });
    },
    [drawing, getRelPos, startPt]
  );

  const onMouseUp = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    if (currentRect && currentRect.width > 2 && currentRect.height > 2) {
      onRectDrawn?.(currentRect);
    }
    setCurrentRect(null);
  }, [currentRect, drawing, onRectDrawn]);

  const cursor = drawMode ? "crosshair" : removeMode ? "pointer" : "default";

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={fileData}
        onLoadSuccess={handleDocLoad}
        loading={
          <div className="mx-auto bg-white rounded shadow flex items-center justify-center text-gray-400 w-full max-w-[720px] aspect-[1/1.4]">
            Cargando PDF...
          </div>
        }
        error={
          <div className="mx-auto bg-red-50 rounded shadow flex items-center justify-center text-red-500 text-sm w-full max-w-[720px] aspect-[1/1.4]">
            Error al cargar el PDF
          </div>
        }
        className="flex flex-col items-center gap-6"
      >
        {Array.from({ length: numPages }, (_, pageIndex) => {
          const pageRects = rects.filter((r) => r.page === pageIndex);
          const pageSize = pageSizes[pageIndex];
          const displayWidth = getDisplayWidth(pageIndex);
          const scale = getScale(pageIndex);

          return (
            <div
              key={pageIndex}
              ref={(el) => {
                pageRefs.current[pageIndex] = el;
              }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-[11px] font-medium text-gray-500">
                Página {pageIndex + 1}
              </div>
              <div
                onMouseDown={(e) => onMouseDown(pageIndex, e)}
                onMouseMove={(e) => onMouseMove(pageIndex, e)}
                onMouseUp={onMouseUp}
                onMouseLeave={() => {
                  if (drawing && startPt.page === pageIndex) {
                    setDrawing(false);
                    setCurrentRect(null);
                  }
                }}
                className="relative inline-block"
                style={{ cursor }}
              >
                <Page
                  pageIndex={pageIndex}
                  width={displayWidth}
                  onLoadSuccess={(page) => handlePageLoad(pageIndex, page)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />

                {pageSize && (
                  <svg
                    className="absolute top-0 left-0"
                    style={{
                      width: pageSize.w * scale,
                      height: pageSize.h * scale,
                      pointerEvents: removeMode ? "auto" : "none",
                    }}
                    viewBox={`0 0 ${pageSize.w} ${pageSize.h}`}
                  >
                    {pageRects.map((r) => (
                      <rect
                        key={r.id}
                        x={r.x}
                        y={r.y}
                        width={r.width}
                        height={r.height}
                        fill={
                          hoveredRect === r.id && removeMode
                            ? "rgba(239, 68, 68, 0.5)"
                            : "black"
                        }
                        stroke={
                          hoveredRect === r.id && removeMode
                            ? "rgb(239, 68, 68)"
                            : "none"
                        }
                        strokeWidth={hoveredRect === r.id && removeMode ? 2 : 0}
                        style={{
                          cursor: removeMode ? "pointer" : "default",
                          pointerEvents: removeMode ? "auto" : "none",
                        }}
                        onMouseEnter={() => removeMode && setHoveredRect(r.id)}
                        onMouseLeave={() => setHoveredRect(null)}
                        onClick={(e) => {
                          if (removeMode) {
                            e.stopPropagation();
                            onRectClick?.(r.id);
                          }
                        }}
                      />
                    ))}
                    {currentRect && currentRect.page === pageIndex && (
                      <rect
                        x={currentRect.x}
                        y={currentRect.y}
                        width={currentRect.width}
                        height={currentRect.height}
                        fill="rgba(220, 38, 38, 0.3)"
                        stroke="rgb(220, 38, 38)"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                      />
                    )}
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </Document>
    </div>
  );
}
