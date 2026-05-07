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
        className="px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
      >
        Descargar PDF
      </button>
      <button
        onClick={() => downloadText(text, `${baseName}_redactado.txt`)}
        className="px-3 py-1.5 text-sm bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
      >
        Descargar TXT
      </button>
    </div>
  );
}
