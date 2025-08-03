import { usePaginate } from "@/CustomHooks/usePaginate";

interface IProps {
  total?: number;
  take: number;
  // page: number;
  onPageChange: (newPage: number, take: number) => void;
}

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

  return (
    <div className="flex justify-end gap-1 text-gray my-2">
      <button
        onClick={goFirst}
        disabled={!canGoBack}
        className={`border p-1 rounded-md ${
          canGoBack
            ? "border-primary text-primary"
            : "border-lightGray opacity-50"
        }`}
      >
        <span className="hidden sm:inline">First page</span>
        <span className="inline sm:hidden text-xs">First</span>
      </button>

      <button
        onClick={goBack}
        disabled={!canGoBack}
        className={`border p-1 rounded-md ${
          canGoBack
            ? "border-primary text-primary"
            : "border-lightGray opacity-50"
        }`}
      >
        <span className="hidden sm:inline">Previous page</span>
        <span className="inline sm:hidden text-xs">Previous</span>
      </button>

      <button
        onClick={goForward}
        disabled={!canGoForward}
        className={`border p-1 rounded-md ${
          canGoForward
            ? "border-primary text-primary"
            : "border-lightGray opacity-50"
        }`}
      >
        <span className="hidden sm:inline">Next page</span>
        <span className="inline sm:hidden text-xs">Next</span>
      </button>

      <button
        onClick={() => goToPage(totalPages)}
        disabled={!canGoForward}
        className={`border p-1 rounded-md ${
          canGoForward
            ? "border-primary text-primary"
            : "border-lightGray opacity-50"
        }`}
      >
        <span className="hidden sm:inline">Last page</span>
        <span className="inline sm:hidden text-xs">Last</span>
      </button>
    </div>
  );
};
