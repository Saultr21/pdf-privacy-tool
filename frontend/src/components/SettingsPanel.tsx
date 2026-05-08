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
  const [open, setOpen] = useState(true);

  const update = (partial: Partial<RedactSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-slate-200 px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Configuración</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            OCR, confianza y categorías
          </p>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-6 p-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Confianza
              </label>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {settings.confidence_threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) =>
                update({ confidence_threshold: parseFloat(e.target.value) })
              }
              className="w-full accent-slate-900"
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
              <span>Más sensible</span>
              <span>Más preciso</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Idioma OCR
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_PRESETS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => update({ ocr_language: lang })}
                  className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                    settings.ocr_language === lang
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {lang}
                </button>
              ))}
              <input
                type="text"
                value={settings.ocr_language}
                onChange={(e) => update({ ocr_language: e.target.value })}
                placeholder="Código"
                className="w-28 rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Categorías
            </label>
            <div className="grid gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {cat.label}
                  <input
                    type="checkbox"
                    checked={settings.categories.includes(cat.id)}
                    onChange={(e) => {
                      const cats = e.target.checked
                        ? [...settings.categories, cat.id]
                        : settings.categories.filter((c) => c !== cat.id);
                      update({ categories: cats });
                    }}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reemplazo TXT
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update({ replacement_style: "label" })}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  settings.replacement_style === "label"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Etiqueta
              </button>
              <button
                onClick={() => update({ replacement_style: "block" })}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  settings.replacement_style === "block"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                ***
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
