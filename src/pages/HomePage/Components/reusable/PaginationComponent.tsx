import { usePaginate } from "@/CustomHooks/usePaginate";

interface IProps {
  total?: number;
  take: number;
  // page: number;
  onPageChange: (newPage: number, take: number) => void;
}

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

const getPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
};

export const PaginationComponent = ({
  total,
  take,
  // page,
  onPageChange,
}: IProps) => {
  const {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goFirst,
    goToPage,
    totalPages,
    currentPage,
  } = usePaginate({ total: total || take, take, onPageChange });

  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
  const resolvedTotal = Math.max(total ?? take, 0);
  const rangeStart = resolvedTotal
    ? (safeCurrentPage - 1) * take + 1
    : 0;
  const rangeEnd = resolvedTotal
    ? Math.min(safeCurrentPage * take, resolvedTotal)
    : 0;
  const paginationItems = getPaginationItems(safeCurrentPage, safeTotalPages);

  return (
    <nav
      className="my-3 flex flex-col gap-3 border-t border-lightGray pt-3 md:flex-row md:items-center md:justify-between"
      aria-label="Pagination"
    >
      <div className="text-sm text-primaryGray">
        Showing {rangeStart}-{rangeEnd} of {resolvedTotal}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <button
          onClick={goFirst}
          disabled={!canGoBack}
          className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
          aria-label="Go to first page"
        >
          <span className="hidden sm:inline">First</span>
          <span className="sm:hidden">«</span>
        </button>

        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
          aria-label="Go to previous page"
        >
          <span className="hidden sm:inline">Prev</span>
          <span className="sm:hidden">‹</span>
        </button>

        {paginationItems.map((item) => {
          if (item === "ellipsis-left" || item === "ellipsis-right") {
            return (
              <span
                key={item}
                className="inline-flex min-w-9 select-none items-center justify-center px-1 text-sm text-primaryGray"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isActive = item === safeCurrentPage;
          return (
            <button
              key={item}
              onClick={() => goToPage(item)}
              className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm transition ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-lightGray text-primary hover:bg-lightGray/40"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Go to page ${item}`}
            >
              {item}
            </button>
          );
        })}

        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </button>

        <button
          onClick={() => goToPage(safeTotalPages)}
          disabled={!canGoForward}
          className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
          aria-label="Go to last page"
        >
          <span className="hidden sm:inline">Last</span>
          <span className="sm:hidden">»</span>
        </button>
      </div>
    </nav>
  );
};
