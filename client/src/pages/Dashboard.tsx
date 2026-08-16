import { RefreshCw } from 'lucide-react'

import { UseFirstWidget } from '../components'
import { useDashboard } from '../hooks/useDashboard'

export default function Dashboard() {
  const { data, isLoading, isError, isFetching, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
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
          className="px-3 py-1 bg-white text-red-700 border border-red-300 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Dashboard
            {isFetching && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          </h1>
          <p className="text-xs text-slate-500">
            Overview of active opened items and pantry status
          </p>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature 1: Use First / Opened Items */}
        <UseFirstWidget items={data?.useFirstList || []} />
      </div>
    </div>
  )
}
