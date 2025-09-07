'use client';

import { useRentalHistory } from '../hooks/useRentalHistory';
import Image from 'next/image';
import { Calendar, MapPin, User, Euro, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function RentalHistory() {
  const { data, isLoading, error } = useRentalHistory();
  const [priceFilter, setPriceFilter] = useState('all'); // all, low, medium, high

  // Filter data based on price range
  const filteredHistory = useMemo(() => {
    if (!data?.history) return [];
    
    const history = data.history;
    
    switch (priceFilter) {
      case 'low':
        return history.filter(rental => rental.totalCost <= 50);
      case 'medium':
        return history.filter(rental => rental.totalCost > 50 && rental.totalCost <= 200);
      case 'high':
        return history.filter(rental => rental.totalCost > 200);
      default:
        return history;
    }
  }, [data?.history, priceFilter]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Učitavanje istorije...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Greška pri učitavanju istorije.</p>
      </div>
    );
  }

  const history = data?.history || [];

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Nema istorije iznajmljivanja
        </h3>
        <p className="text-gray-500">
          Još niste iznajmili nijedan predmet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Historija Iznajmljivanja
        </h2>
        <div className="flex items-center gap-4">
          {/* Price Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Sve cijene</option>
              <option value="low">Ispod €50</option>
              <option value="medium">€50 - €200</option>
              <option value="high">Preko €200</option>
            </select>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {filteredHistory.length} od {data?.totalRentals} iznajmljivanja
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((rental) => (
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
                <h3 className="font-semibold text-lg text-gray-800 mb-2">
                  {rental.itemTitle}
                </h3>
                
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
                    <Euro className="w-4 h-4 mr-2" />
                    <span>€{rental.totalCost} ({rental.totalDays} dana)</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Završeno: {new Date(rental.completedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredHistory.length === 0 && history.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">Nema rezultata za odabrani filter cijene.</p>
          <button
            onClick={() => setPriceFilter('all')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Prikaži sve rezultate
          </button>
        </div>
      )}
    </div>
  );
}
