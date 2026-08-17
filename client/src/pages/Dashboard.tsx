import { RefreshCw } from 'lucide-react'

import { useAuth } from '../hooks/useAuth' // Import your auth hook or context
import { useDashboard } from '../hooks/useDashboard'
import { LowStockWidget, UseFirstWidget } from '../components'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading, isError, isFetching, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        Loading dashboard...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-sm text-red-600 flex items-center justify-between bg-red-50 rounded-xl border border-red-200">
        <span>Failed to load dashboard data.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1 bg-white text-red-700 border border-red-300 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Dashboard
            {isFetching && <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />}
          </h1>
          <p className="text-xs text-slate-500">
            Overview of active opened items, restock alerts, and pantry status
          </p>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 gap-6">
        {/* Feature 1: Use First / Opened Items */}
        <UseFirstWidget items={data?.useFirstList || []} />

        {/* Feature 2: Low Stock / Restock Items */}
        <LowStockWidget items={data?.restockList || []} currentUserId={user?.id} />
      </div>
    </div>
  )
}
