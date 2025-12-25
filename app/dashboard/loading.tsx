export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-3">
          <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Chargement...
        </p>
      </div>
    </div>
  )
}
