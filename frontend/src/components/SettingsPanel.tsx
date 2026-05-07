import { useState } from "react";
import type { RedactSettings } from "../api";

interface Props {
  settings: RedactSettings;
  onChange: (s: RedactSettings) => void;
}

const ALL_CATEGORIES = [
  { id: "private_person", label: "Personas" },
  { id: "private_address", label: "Direcciones" },
  { id: "private_email", label: "Emails" },
  { id: "private_phone", label: "Teléfonos" },
  { id: "private_url", label: "URLs" },
  { id: "private_date", label: "Fechas" },
  { id: "account_number", label: "Cuentas bancarias" },
  { id: "secret", label: "Secretos" },
];

const LANGUAGE_PRESETS = ["spa", "eng", "spa+eng", "fra"];

export default function SettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<RedactSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-800">Configuración</span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Umbral de confianza: {settings.confidence_threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) =>
                update({ confidence_threshold: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Más sensible (0.0)</span>
              <span>Más preciso (1.0)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Idioma OCR
            </label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGE_PRESETS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => update({ ocr_language: lang })}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    settings.ocr_language === lang
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {lang}
                </button>
              ))}
              <input
                type="text"
                value={settings.ocr_language}
                onChange={(e) => update({ ocr_language: e.target.value })}
                placeholder="Código Tesseract"
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm w-36"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías PII a censurar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={settings.categories.includes(cat.id)}
                    onChange={(e) => {
                      const cats = e.target.checked
                        ? [...settings.categories, cat.id]
                        : settings.categories.filter((c) => c !== cat.id);
                      update({ categories: cats });
                    }}
                    className="rounded border-gray-300"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estilo de reemplazo
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={settings.replacement_style === "label"}
                  onChange={() => update({ replacement_style: "label" })}
                />
                Etiqueta <code className="text-xs bg-gray-100 px-1 rounded">[PRIVATE_PERSON]</code>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={settings.replacement_style === "block"}
                  onChange={() => update({ replacement_style: "block" })}
                />
                Bloque <span className="font-mono">████████</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
