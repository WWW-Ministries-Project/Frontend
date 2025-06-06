interface Props {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  goFirst: () => void;
  goToPage: (page: number) => void;
  totalPages: number;
}

const PaginationComponent = ({
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  goFirst,
  goToPage,
  ...rest
}: Props): JSX.Element => {
  return (
    <div className={`flex justify-end gap-1 text-gray my-2`}>
      <button
        onClick={goFirst}
        className={
          canGoBack
            ? "border border-primary p-1 sm rounded-md text-primary"
            : "border border-lightGray p-1 rounded-md opacity-50"
        }
      >
        <span className="hidden sm:inline">First page</span>
        <span className="inline sm:hidden text-xs">First</span>
      </button>
      <button
        className={
          canGoBack
            ? "border border-primary p-1 rounded-md text-primary"
            : "border border-lightGray p-1 rounded-md opacity-50"
        }
        disabled={!canGoBack}
        onClick={() => goBack()}
      >
        <span className="hidden sm:inline">Previous page</span>
        <span className="inline sm:hidden text-xs">Previous</span>
      </button>
      <button
        className={
          canGoForward
            ? "border border-primary p-1 rounded-md text-primary"
            : "border border-lightGray p-1 rounded-md opacity-50"
        }
        disabled={!canGoForward}
        onClick={() => goForward()}
      >
        <span className="hidden sm:inline">Next page</span>
        <span className="inline sm:hidden text-xs">Next</span>
      </button>
      <button
        className={
          canGoForward
            ? "border border-primary p-1 rounded-md text-primary"
            : "border border-lightGray p-1 rounded-md opacity-50"
        }
        onClick={() => goToPage(rest.totalPages - 1)}
      >
        <span className="hidden sm:inline">Last page</span>
        <span className="inline sm:hidden text-xs">Last</span>
      </button>
    </div>
  );
};

export default PaginationComponent;
