export default function ProcessingStatus() {
  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
      </div>
      <p className="text-base font-semibold text-slate-900">Procesando documento</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        El primer análisis puede tardar si el modelo todavía no está cargado.
      </p>
    </div>
  );
}
