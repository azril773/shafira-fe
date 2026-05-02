"use client"

export default function PaginationTableNoLink({
  currentPage,
  setCurrentPage,
  totalPages,
}) {
  const go = (page) => {
    if (!setCurrentPage) return
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  if (!totalPages || totalPages <= 1) return null

  const pages = []
  for (let p = 1; p <= totalPages; p++) {
    const isNearCurrentPage = Math.abs(p - currentPage) <= 2
    const isFirstPage = p === 1
    const isLastPage = p === totalPages
    const isNearStart = currentPage <= 3 && p <= 5
    const isNearEnd = currentPage >= totalPages - 2 && p >= totalPages - 4
    if (
      isFirstPage ||
      isLastPage ||
      isNearCurrentPage ||
      isNearStart ||
      isNearEnd
    ) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…")
    }
  }

  return (
    <div className="flex items-center justify-center py-6">
      <nav
        className="flex items-center -space-x-px rounded-md shadow-sm"
        aria-label="Pagination"
      >
        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="sr-only">Previous</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {pages.map((page, idx) =>
          page === "…" ? (
            <span
              key={`gap-${idx}`}
              className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => go(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:z-20 ${
                page === currentPage
                  ? "bg-orange-50 text-orange-600 z-10"
                  : "bg-white text-gray-500"
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="sr-only">Next</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </nav>
    </div>
  )
}
