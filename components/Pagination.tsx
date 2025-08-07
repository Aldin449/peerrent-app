import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: {
    page?: string;
    search?: string;
  };
}

const Pagination = ({ currentPage, totalPages, searchParams }: PaginationProps) => {
  const pagesToShow = 5;

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= pagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= pagesToShow - 2) {
        for (let i = 1; i <= pagesToShow - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - (pagesToShow - 2)) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - (pagesToShow - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams?.search) {
      params.set('search', searchParams.search);
    }
    if (page > 1) {
      params.set('page', page.toString());
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center gap-4 mt-6">
      {/* Prethodna stranica */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          ← Prethodna
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-200 rounded opacity-50 cursor-not-allowed">
          ← Prethodna
        </span>
      )}

      {/* Prikaz broja stranica */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={index} className="self-center text-gray-600">
              ...
            </span>
          );
        }

        const pageNumber = Number(page);
        const isCurrentPage = currentPage === pageNumber;

        return (
          <Link
            key={index}
            href={createPageUrl(pageNumber)}
            className={`px-4 py-2 rounded transition ${
              isCurrentPage 
                ? 'bg-gray-400 cursor-default' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {page}
          </Link>
        );
      })}

      {/* Sljedeća stranica */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Sljedeća →
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-200 rounded opacity-50 cursor-not-allowed">
          Sljedeća →
        </span>
      )}
    </div>
  );
};

export default Pagination;
