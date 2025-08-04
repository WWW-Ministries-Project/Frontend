import { useEffect, useMemo } from "react";
import { usePaginationQueryParams } from "./usePaginationQueryParams";

export function usePaginate({
  total,
  totalPages,
  take,
  onPageChange,
}: {
  total: number;
  take: number;
  totalPages?: number;
  onPageChange: (newPage: number, take: number) => void;
}) {
  const { page, setPage, take: limit } = usePaginationQueryParams(take);
  const memoizedTotalPages = useMemo(
    () => Math.ceil(total / take),
    [total, take]
  );
  const computedTotalPages = totalPages ?? memoizedTotalPages;

  const canGoBack = page > 1;
  const canGoForward = page < computedTotalPages;

  const goBack = () => canGoBack && setPage(page - 1);
  const goForward = () => canGoForward && setPage(page + 1);
  const goFirst = () => page !== 1 && setPage(1);
  const goToPage = (pageIndex: number) =>
    pageIndex >= 1 && pageIndex <= computedTotalPages && setPage(pageIndex);

  useEffect(() => {
    onPageChange?.(page, limit);
  }, [page, limit]);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goToPage,
    goFirst,
    totalPages: computedTotalPages,
    currentPage: page,
  };
}
