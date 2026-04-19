"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export default function PaginationTableNoLink({
  currentPage,
  setCurrentPage,
  totalPages,
}) {
  return (
    <>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
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
                  <PaginationItem key={page}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                      className={cn(page === currentPage && "bg-accent")}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                );
              }

              if (page === 2 || page === totalPages - 1) {
                return (
                  <PaginationItem key={page}>
                    <span className="flex h-9 w-9 items-center justify-center">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More pages</span>
                    </span>
                  </PaginationItem>
                );
              }

              return null;
            })}
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
