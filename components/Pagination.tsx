'use client';

import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: {
    page?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

const Pagination = ({ currentPage, totalPages, searchParams }: PaginationProps) => {
  // Debug logging
  console.log('Pagination render:', { currentPage, totalPages, searchParams });

  // Don't show pagination if there's only 1 page or less
  if (totalPages <= 1) {
    console.log('Not showing pagination - only 1 page or less');
    return null;
  }

  // Create URL with preserved search parameters
  const createUrl = (page: number) => {
    const params = new URLSearchParams();

    // Preserve all search parameters
    if (searchParams?.search) params.set('search', searchParams.search);
    if (searchParams?.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams?.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams?.category) params.set('category', searchParams.category);
    if (searchParams?.sortBy) params.set('sortBy', searchParams.sortBy);
    if (searchParams?.sortOrder) params.set('sortOrder', searchParams.sortOrder);

    // ALWAYS add page parameter to ensure proper navigation
    params.set('page', page.toString());

    const url = `?${params.toString()}`;
    console.log(`Creating URL for page ${page}:`, url);
    return url;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Debug Info */}
      <div className="absolute top-0 left-0 bg-yellow-100 p-2 rounded text-xs">
        Debug: Page {currentPage} of {totalPages} | Can go back: {currentPage > 1 ? 'Yes' : 'No'}
      </div>


      {/* Previous Button */}
      {currentPage > 1 ? (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            const url = createUrl(currentPage - 1);
            window.location.href = url;
          }}
        >
          ← Prethodna
        </button>
      ) : (
        <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
          ← Prethodna
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex gap-1">
        {/* Show first page */}
        {currentPage > 3 && (
          <>
            <Link
              href={createUrl(1)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              1
            </Link>
            {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}

        {/* Show pages around current page */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const startPage = Math.max(1, currentPage - 2);
          const pageNum = startPage + i;

          if (pageNum > totalPages) return null;

          return (
            <Link
              key={pageNum}
              href={createUrl(pageNum)}
              className={`px-3 py-2 rounded-lg transition-colors ${pageNum === currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {pageNum}
            </Link>
          );
        })}

        {/* Show last page */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
            <Link
              href={createUrl(totalPages)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {totalPages}
            </Link>
          </>
        )}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            console.log('Next button clicked!');
            console.log('Current page:', currentPage);
            console.log('Going to page:', currentPage + 1);
            const url = createUrl(currentPage + 1);
            console.log('URL:', url);
            window.location.href = url;
          }}
        >
          Sljedeća →
        </button>
      ) : (
        <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
          Sljedeća →
        </span>
      )}
    </div>
  );
};

export default Pagination;