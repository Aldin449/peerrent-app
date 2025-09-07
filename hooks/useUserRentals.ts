import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface UserRental {
  id: string;
  itemId: string;
  itemTitle: string;
  itemDescription: string;
  itemLocation: string;
  itemImages: string[];
  itemCategory: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerProfilePicture: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  isCompleted: boolean;
  completedAt: string | null;
  totalDays: number;
  totalCost: number;
  pricePerDay: number;
}

// Interface za paginacijske metapodatke
interface PaginationInfo {
  currentPage: number;        // Trenutna stranica
  totalPages: number;         // Ukupan broj stranica
  totalRentals: number;       // Ukupan broj rezervacija
  limit: number;              // Broj stavki po stranici
  hasNextPage: boolean;       // Ima li sljedeću stranicu
  hasPrevPage: boolean;       // Ima li prethodnu stranicu
  nextPage: number | null;    // Broj sljedeće stranice
  prevPage: number | null;    // Broj prethodne stranice
}

// Interface za odgovor API-ja sa paginacijom
interface UserRentalsResponse {
  rentals: UserRental[];           // Samo trenutna stranica rezervacija
  pagination: PaginationInfo;      // Paginacijski metapodaci
  activeRentals: UserRental[];     // Aktivne rezervacije (trenutna stranica)
  completedRentals: UserRental[];  // Završene rezervacije (trenutna stranica)
  cancelledRentals: UserRental[];  // Otkazane rezervacije (trenutna stranica)
  totalActive: number;             // Broj aktivnih na trenutnoj stranici
  totalCompleted: number;          // Broj završenih na trenutnoj stranici
  totalCancelled: number;          // Broj otkazanih na trenutnoj stranici
}

const fetchUserRentals = async (page: number, limit: number): Promise<UserRentalsResponse> => {
  const response = await axios.get(`/api/bookings/user-rentals?page=${page}&limit=${limit}`);
  return response.data;
};

export const useUserRentals = (page: number, limit: number) => {
  return useQuery({
    queryKey: ['user-rentals', page, limit],
    queryFn: () => fetchUserRentals(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export type { UserRental, UserRentalsResponse, PaginationInfo };
