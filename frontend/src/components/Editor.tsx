import { useMemo, useState } from "react";
import type { ApplyResponse, RedactRect } from "../api";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import DropZone from "./DropZone";
import EditorPanes from "./editor/EditorPanes";
import EditorToolbar from "./editor/EditorToolbar";
import type { Mode } from "./editor/types";

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
  if (!props.hasFile) {
    return (
      <div className="h-full overflow-auto">
        <DropZone onFileSelected={props.onFileSelected} />
      </div>
    );
  }
  return <EditorWithFile {...props} />;
}

function EditorWithFile({
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
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollTargetPage, setScrollTargetPage] = useState(0);
  const [scrollToken, setScrollToken] = useState(0);

  const canUndo = rects.length > 0;
  const canApply = dirty && !applying;

  function jumpToPage(page: number) {
    if (!totalPages) return;
    const clamped = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(clamped);
    setScrollTargetPage(clamped - 1);
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

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <EditorToolbar
        fileName={fileName}
        mode={mode}
        onModeChange={setMode}
        rectsCount={rects.length}
        totalPages={totalPages}
        currentPage={currentPage}
        onJumpPage={jumpToPage}
        dirty={dirty}
        applying={applying}
        canUndo={canUndo}
        onUndo={onUndo}
        onApply={onApply}
        onNewFile={onNewFile}
        appliedResult={appliedResult}
      />
      <EditorPanes
        base64={base64}
        mode={mode}
        rects={rects}
        onAddRect={onAddRect}
        onRemoveRect={onRemoveRect}
        onDocLoad={setTotalPages}
        scrollTargetPage={scrollTargetPage}
        scrollToken={scrollToken}
      />
    </div>
  );
}
