'use client';

import { useUserRentals, UserRental } from '../hooks/useUserRentals';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, User, Euro, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function UserRentals() {
  // State za paginaciju - korisnik može mijenjati stranicu
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed, cancelled
  
  // Hook za dohvatanje podataka sa paginacijom
  const { data, isLoading, error } = useUserRentals(currentPage, itemsPerPage);

  // Filter data based on status - koristi novu strukturu podataka
  const filteredRentals = useMemo(() => {
    if (!data?.rentals) return [];
    
    const rentals = data.rentals;
    console.log('Trenutna stranica rezervacija:', rentals);
    switch (statusFilter) {
      case 'active':
        return rentals.filter(rental => rental.status === 'PENDING' || rental.status === 'APPROVED');
      case 'completed':
        return rentals.filter(rental => rental.status === 'COMPLETED');
      case 'cancelled':
        return rentals.filter(rental => rental.status === 'REJECTED' || rental.status === 'CANCELLED');
      default:
        return rentals;
    }
  }, [data?.rentals, statusFilter]);

  // Funkcija za promjenu stranice
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Resetuj filter kada mijenjaš stranicu
    setStatusFilter('all');
  };

  // Funkcija za promjenu broja stavki po stranici
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Resetuj na prvu stranicu
    setStatusFilter('all');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Na čekanju';
      case 'APPROVED':
        return 'Odobreno';
      case 'COMPLETED':
        return 'Završeno';
      case 'REJECTED':
        return 'Odbijeno';
      case 'CANCELLED':
        return 'Otkazano';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Učitavanje vaših iznajmljivanja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Greška pri učitavanju vaših iznajmljivanja.</p>
      </div>
    );
  }

  const rentals = data?.rentals || [];

  if (rentals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Nema iznajmljivanja
        </h3>
        <p className="text-gray-500 mb-6">
          Još niste iznajmili nijedan predmet
        </p>
        <Link
          href="/"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          Pretraži predmete
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Moja Iznajmljivanja
        </h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Svi statusi</option>
              <option value="active">Aktivni</option>
              <option value="completed">Završeni</option>
              <option value="cancelled">Otkazani</option>
            </select>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Prikaži:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex gap-2 text-sm">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {filteredRentals.length} od {data?.pagination.totalRentals} ukupno
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Aktivni</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{data?.totalActive || 0}</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Završeni</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{data?.totalCompleted || 0}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Otkazani</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{data?.totalCancelled || 0}</p>
        </div>
      </div>

      {/* Rentals List */}
      <div className={`space-y-4 ${filteredRentals.length > 3 ? 'h-[710px] overflow-y-auto' : ''}`}>
        {filteredRentals.map((rental) => (
          <div
            key={rental.id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Item Image */}
              <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {rental.itemImages && rental.itemImages.length > 0 ? (
                  <Image
                    src={rental.itemImages[0]}
                    alt={rental.itemTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-2xl">📦</span>
                  </div>
                )}
              </div>

              {/* Rental Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">
                      {rental.itemTitle}
                    </h3>
                    {rental.itemCategory && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {rental.itemCategory}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(rental.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                      {getStatusText(rental.status)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {rental.itemDescription}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{rental.itemLocation}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    <span>od {rental.ownerName}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-green-600 font-medium">
                    {/* <Euro className="w-4 h-4 mr-2" /> */ }
                    {rental.totalDays === 0? <span>€{rental.pricePerDay} 1 dan </span> : <span>€{rental.totalCost} ({rental.totalDays} dana)</span>}
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400">
                  <span>Rezervisano: {new Date(rental.createdAt).toLocaleDateString()}</span>
                  {rental.completedAt && (
                    <span>Završeno: {new Date(rental.completedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Action buttons for active rentals */}
                {(rental.status === 'PENDING' || rental.status === 'APPROVED') && (
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/items/${rental.itemId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                    >
                      Pogledaj predmet
                    </Link>
                    <Link
                      href={`/conversations`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium underline"
                    >
                      Kontaktiraj vlasnika
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredRentals.length === 0 && rentals.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">Nema rezultata za odabrani filter statusa.</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Prikaži sve rezultate
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Prikazujem stranicu {data.pagination.currentPage} od {data.pagination.totalPages} 
            ({data.pagination.totalRentals} ukupno rezervacija)
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(data.pagination.currentPage - 1)}
              disabled={!data.pagination.hasPrevPage}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                data.pagination.hasPrevPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Prethodna
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {/* Show first page */}
              {data.pagination.currentPage > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  {data.pagination.currentPage > 4 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, data.pagination.currentPage - 2);
                const pageNum = startPage + i;
                
                if (pageNum > data.pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === data.pagination.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Show last page */}
              {data.pagination.currentPage < data.pagination.totalPages - 2 && (
                <>
                  {data.pagination.currentPage < data.pagination.totalPages - 3 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(data.pagination.totalPages)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {data.pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(data.pagination.currentPage + 1)}
              disabled={!data.pagination.hasNextPage}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                data.pagination.hasNextPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Sljedeća
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
