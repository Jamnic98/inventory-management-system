import { useMemo } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers array (with simple bounds or ellipsis for large page counts)
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t text-xs text-gray-600 rounded-b">
      {/* Left side: Range stats & Page size selector */}
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="font-semibold text-gray-900">{startItem}</strong> to{' '}
          <strong className="font-semibold text-gray-900">{endItem}</strong> of{' '}
          <strong className="font-semibold text-gray-900">{totalItems}</strong> results
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label htmlFor="page-size-select" className="text-gray-500">
              Per page:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            typeof page === 'number' ? (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`px-2.5 py-1 border rounded text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={`ellipsis-${idx}`} className="px-1 text-gray-400">
                {page}
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 py-1 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
        >
          Next
        </button>
      </div>
    </div>
  )
}
