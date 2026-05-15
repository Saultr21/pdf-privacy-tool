import { Download, FileDown } from "lucide-react";
import { downloadBlob, downloadText } from "../api";
import { Button } from "./ui/Button";

interface Props {
  pdfBase64: string;
  text: string;
  originalName: string;
}

export default function DownloadPanel({ pdfBase64, text, originalName }: Props) {
  const baseName = originalName.replace(/\.pdf$/i, "") || "documento";

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() =>
          downloadBlob(pdfBase64, `${baseName}_redactado.pdf`, "application/pdf")
        }
      >
        <Download className="h-4 w-4" aria-hidden />
        Descargar PDF
      </Button>
      <Button
        variant="outline"
        onClick={() => downloadText(text, `${baseName}_redactado.txt`)}
      >
        <FileDown className="h-4 w-4" aria-hidden />
        TXT
      </Button>
    </div>
  );
}
