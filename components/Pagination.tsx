// Import Next.js Link component for client-side navigation between pages
// This prevents full page reloads and provides better user experience
import Link from 'next/link';

// Define the structure of props that this component expects to receive
// This is TypeScript interface that ensures type safety
interface PaginationProps {
  currentPage: number;        // Which page the user is currently viewing
  totalPages: number;         // Total number of pages available
  searchParams?: {            // Optional: URL search parameters to preserve when navigating
    page?: string;           // Current page number as string (from URL)
    search?: string;         // Search term if user is filtering items
  };
}

// Main Pagination component that creates navigation controls for browsing through pages
// This is necessary when you have many items and need to split them across multiple pages
const Pagination = ({ currentPage, totalPages, searchParams }: PaginationProps) => {
  // Maximum number of page buttons to show at once
  // This prevents the pagination from becoming too wide on screens
  const pagesToShow = 5;

  // Function that calculates which page numbers to display
  // This creates a smart pagination that shows ellipsis (...) when there are many pages
  const getPageNumbers = () => {
    const pages = []; // Array to store page numbers and ellipsis

    // Case 1: If total pages is small, show all page numbers
    // This is simple and clean when there aren't many pages
    if (totalPages <= pagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Case 2: User is near the beginning (first few pages)
      // Show first few pages, then ellipsis, then last page
      if (currentPage <= pagesToShow - 2) {
        for (let i = 1; i <= pagesToShow - 1; i++) {
          pages.push(i);
        }
        pages.push('...'); // Ellipsis indicates skipped pages
        pages.push(totalPages); // Always show the last page
      } 
      // Case 3: User is near the end (last few pages)
      // Show first page, then ellipsis, then last few pages
      else if (currentPage >= totalPages - (pagesToShow - 2)) {
        pages.push(1); // Always show the first page
        pages.push('...');
        for (let i = totalPages - (pagesToShow - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } 
      // Case 4: User is in the middle
      // Show first page, ellipsis, current page and neighbors, ellipsis, last page
      else {
        pages.push(1);
        pages.push('...');
        // Show current page and one page on each side
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Function that creates the URL for each page link
  // This preserves search parameters when navigating between pages
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(); // Create URL parameters object
    
    // If there's a search term, keep it in the URL
    // This ensures the search filter persists when changing pages
    if (searchParams?.search) {
      params.set('search', searchParams.search);
    }
    
    // Only add page parameter if it's not page 1
    // This keeps URLs clean (page 1 doesn't need ?page=1)
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    // Return the query string, or empty string if no parameters
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Calculate which page numbers to display
  const pages = getPageNumbers();

  return (
    <div className="flex justify-center gap-4 mt-6">
      {/* Previous Page Button */}
      {/* Show clickable link if not on first page, otherwise show disabled button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          ← Prethodna
        </Link>
      ) : (
        // Disabled button when on first page (can't go back further)
        <span className="px-4 py-2 bg-gray-200 rounded opacity-50 cursor-not-allowed">
          ← Prethodna
        </span>
      )}

      {/* Page Number Buttons */}
      {/* Render each page number or ellipsis */}
      {pages.map((page, index) => {
        // If it's an ellipsis, show it as text (not clickable)
        if (page === '...') {
          return (
            <span key={index} className="self-center text-gray-600">
              ...
            </span>
          );
        }

        // Convert page to number and check if it's the current page
        const pageNumber = Number(page);
        const isCurrentPage = currentPage === pageNumber;

        return (
          <Link
            key={index}
            href={createPageUrl(pageNumber)}
            className={`px-4 py-2 rounded transition ${
              isCurrentPage 
                ? 'bg-gray-400 cursor-default'  // Current page: darker background, no hover
                : 'bg-gray-200 hover:bg-gray-300' // Other pages: lighter background with hover effect
            }`}
            aria-current={isCurrentPage ? 'page' : undefined} // Accessibility: mark current page for screen readers
          >
            {page}
          </Link>
        );
      })}

      {/* Next Page Button */}
      {/* Show clickable link if not on last page, otherwise show disabled button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Sljedeća →
        </Link>
      ) : (
        // Disabled button when on last page (can't go forward further)
        <span className="px-4 py-2 bg-gray-200 rounded opacity-50 cursor-not-allowed">
          Sljedeća →
        </span>
      )}
    </div>
  );
};

// Export the component so it can be used in other files
export default Pagination;
