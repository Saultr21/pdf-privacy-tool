import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { RedactRect } from "../api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  base64: string;
  pageIndex: number;
  onDocLoad?: (numPages: number) => void;
  drawMode: boolean;
  removeMode: boolean;
  rects: RedactRect[];
  onRectDrawn?: (rect: { x: number; y: number; width: number; height: number }) => void;
  onRectClick?: (id: string) => void;
}

export default function PdfPanel({
  base64,
  pageIndex,
  onDocLoad,
  drawMode,
  removeMode,
  rects,
  onRectDrawn,
  onRectClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [pdfPageSize, setPdfPageSize] = useState<{ w: number; h: number } | null>(null);
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
    const update = () => setContainerWidth(el.clientWidth - 32);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleDocLoad = useCallback(
    (pdf: { numPages: number }) => {
      onDocLoad?.(pdf.numPages);
    },
    [onDocLoad]
  );

  const handlePageLoad = useCallback(
    (page: { originalWidth: number; originalHeight: number }) => {
      setPdfPageSize((prev) => {
        if (prev && prev.w === page.originalWidth && prev.h === page.originalHeight)
          return prev;
        return { w: page.originalWidth, h: page.originalHeight };
      });
    },
    []
  );

  const displayWidth = pdfPageSize
    ? Math.min(containerWidth, pdfPageSize.w * 1.5)
    : containerWidth;

  const scale = pdfPageSize ? displayWidth / pdfPageSize.w : 1;

  const getRelPos = useCallback(
    (e: React.MouseEvent) => {
      const canvas = (e.currentTarget as HTMLElement).querySelector("canvas");
      if (!canvas || !pdfPageSize) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * pdfPageSize.w,
        y: ((e.clientY - rect.top) / rect.height) * pdfPageSize.h,
      };
    },
    [pdfPageSize]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!drawMode) return;
      e.preventDefault();
      const pt = getRelPos(e);
      setStartPt(pt);
      setDrawing(true);
      setCurrentRect(null);
    },
    [drawMode, getRelPos]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing) return;
      const pt = getRelPos(e);
      setCurrentRect({
        x: Math.min(startPt.x, pt.x),
        y: Math.min(startPt.y, pt.y),
        width: Math.abs(pt.x - startPt.x),
        height: Math.abs(pt.y - startPt.y),
      });
    },
    [drawing, startPt, getRelPos]
  );

  const onMouseUp = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    if (currentRect && currentRect.width > 2 && currentRect.height > 2) {
      onRectDrawn?.(currentRect);
    }
    setCurrentRect(null);
  }, [drawing, currentRect, onRectDrawn]);

  const cursor = drawMode ? "crosshair" : removeMode ? "pointer" : "default";

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          if (drawing) {
            setDrawing(false);
            setCurrentRect(null);
          }
        }}
        className="relative inline-block"
        style={{ cursor }}
      >
        <Document
          file={fileData}
          onLoadSuccess={handleDocLoad}
          loading={
            <div
              className="bg-white rounded shadow flex items-center justify-center text-gray-400"
              style={{ width: displayWidth, height: displayWidth * 1.4 }}
            >
              Cargando PDF...
            </div>
          }
          error={
            <div
              className="bg-red-50 rounded shadow flex items-center justify-center text-red-500 text-sm"
              style={{ width: displayWidth, height: displayWidth * 1.4 }}
            >
              Error al cargar el PDF
            </div>
          }
        >
          <Page
            pageIndex={pageIndex}
            width={displayWidth}
            onLoadSuccess={handlePageLoad}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
        </Document>

        {/* Rect overlays */}
        {pdfPageSize && (
          <svg
            className="absolute top-0 left-0"
            style={{
              width: pdfPageSize.w * scale,
              height: pdfPageSize.h * scale,
              pointerEvents: removeMode ? "auto" : "none",
            }}
            viewBox={`0 0 ${pdfPageSize.w} ${pdfPageSize.h}`}
          >
            {rects.map((r) => (
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
                  hoveredRect === r.id && removeMode ? "rgb(239, 68, 68)" : "none"
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
            {/* Current drawing rect */}
            {currentRect && (
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
}
