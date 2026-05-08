import { downloadBlob, downloadText } from "../api";

interface Props {
  pdfBase64: string;
  text: string;
  originalName: string;
}

export default function DownloadPanel({ pdfBase64, text, originalName }: Props) {
  const baseName = originalName.replace(/\.pdf$/i, "");

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          downloadBlob(pdfBase64, `${baseName}_redactado.pdf`, "application/pdf")
        }
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
        </svg>
        PDF
      </button>
      <button
        onClick={() => downloadText(text, `${baseName}_redactado.txt`)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h7l3 3v13H7zM14 4v4h4M9 13h6M9 16h6" />
        </svg>
        TXT
      </button>
    </div>
  );
}
