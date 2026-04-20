"use client"

export default function PaginationTableNoLink({
  currentPage,
  setCurrentPage,
  totalPages,
}) {
  return (
    <>
      {totalPages > 1 && (
        <div class="flex items-center justify-center py-10">
          <nav
            class="flex items-center -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <a
              href="#"
              class={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${currentPage == 1 && "pointer-events-none opacity-50 cursor-not-allowed"}`}
            >
              <span class="sr-only">Previous</span>
              <svg
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
              const isFirstPage = page === 1;
              const isLastPage = page === totalPages;
              const isNearStart = currentPage <= 3 && page <= 5;
              const isNearEnd =
                currentPage >= totalPages - 2 && page >= totalPages - 4;

              if (
                isFirstPage ||
                isLastPage ||
                isNearCurrentPage ||
                isNearStart ||
                isNearEnd
              ) {
                return (
                  <a
                    href="#"
                    class={`relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${page === currentPage ? "text-orange-500" : ""}`}
                  >
                    {page}
                  </a>
                );
              }


              return null;
            })}
            <a
              href="#"
              class={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${currentPage == totalPages && "pointer-events-none opacity-50 cursor-not-allowed"}`}
            >
              <span class="sr-only">Next</span>
              <svg
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
          </nav>
        </div>
      )}
    </>
  );
}

//     <a href="#" aria-current="page" class="relative z-10 inline-flex items-center border border-indigo-500 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 focus:z-20">1</a>

//     <a href="#" class="relative hidden items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 md:inline-flex">3</a>

//     <span class="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">...</span>

//     <a href="#" class="relative hidden items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 md:inline-flex">8</a>

//     <a href="#" class="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20">9</a>

//   </nav>
// </div>
