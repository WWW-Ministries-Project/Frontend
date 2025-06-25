import React from 'react';

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
  totalPages,
}: Props): JSX.Element => {
  // Calculate current page from the navigation state
  const getCurrentPage = (): number => {
    if (!canGoBack) return 1; // First page
    if (!canGoForward) return totalPages; // Last page
    
    // For middle pages, we need to track it internally
    // Since we can't determine exact page from just canGoBack/canGoForward,
    // we'll maintain internal state
    return currentPageRef.current;
  };

  // Use ref to track current page without causing re-renders
  const currentPageRef = React.useRef(1);
  
  // Update current page when navigation buttons are used
  const handleGoBack = () => {
    if (canGoBack) {
      currentPageRef.current = Math.max(1, currentPageRef.current - 1);
      goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      currentPageRef.current = Math.min(totalPages, currentPageRef.current + 1);
      goForward();
    }
  };

  const handleGoFirst = () => {
    currentPageRef.current = 1;
    goFirst();
  };

  const handleGoToPage = (page: number) => {
    currentPageRef.current = page + 1; // Convert from 0-indexed to 1-indexed
    goToPage(page);
  };

  const currentPage = getCurrentPage();
  // Generate page numbers to display with smart truncation
  const getVisiblePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination logic
      const halfVisible = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      // Adjust start if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      // Add first page
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      // Add last page
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
      
      // Remove duplicates while preserving order
      return pages.filter((page, index, arr) => 
        arr.findIndex(p => p === page) === index
      );
    }
    
    return pages;
  };

  const visiblePages = getVisiblePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Page info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Page <span className="font-semibold">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First button */}
        <button
          onClick={handleGoFirst}
          disabled={!canGoBack}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${canGoBack 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100' 
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
            }
          `}
          title="Go to first page"
        >
          <span className="hidden sm:inline">First</span>
          <span className="sm:hidden">⟪</span>
        </button>

        {/* Previous button */}
        <button
          onClick={handleGoBack}
          disabled={!canGoBack}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${canGoBack 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100' 
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
            }
          `}
          title="Go to previous page"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">‹</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1 sm:mx-2">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400 text-sm">
                  ...
                </span>
              );
            }

            const pageNumber = typeof page === 'number' ? page : parseInt(page.toString());
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => handleGoToPage(pageNumber - 1)} // Convert to 0-indexed for the callback
                className={`
                  min-w-[2.5rem] h-10 px-2 text-sm font-medium rounded-lg border transition-all duration-200
                  ${isActive
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
                  }
                `}
                title={`Go to page ${pageNumber}`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleGoForward}
          disabled={!canGoForward}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${canGoForward 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100' 
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
            }
          `}
          title="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </button>

        {/* Last button */}
        <button
          onClick={() => handleGoToPage(totalPages - 1)} // Convert to 0-indexed
          disabled={!canGoForward}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${canGoForward 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100' 
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
            }
          `}
          title="Go to last page"
        >
          <span className="hidden sm:inline">Last</span>
          <span className="sm:hidden">⟫</span>
        </button>
      </div>
    </div>
  );
};

export default PaginationComponent;