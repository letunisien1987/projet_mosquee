export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          {/* Spinner animé */}
          <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Chargement...
        </p>
      </div>
    </div>
  )
}
