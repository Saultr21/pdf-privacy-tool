export default function ProcessingStatus() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4" />
      <p className="text-gray-700 font-medium text-lg">Procesando...</p>
      <p className="text-sm text-gray-500 mt-2">
        La primera vez, el modelo se descarga (~3 GB). Puede tardar varios minutos.
      </p>
    </div>
  );
}
