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

interface UserRentalsResponse {
  allRentals: UserRental[];
  activeRentals: UserRental[];
  completedRentals: UserRental[];
  cancelledRentals: UserRental[];
  totalRentals: number;
  totalActive: number;
  totalCompleted: number;
  totalCancelled: number;
}

const fetchUserRentals = async (): Promise<UserRentalsResponse> => {
  const response = await axios.get('/api/bookings/user-rentals');
  return response.data;
};

export const useUserRentals = () => {
  return useQuery({
    queryKey: ['user-rentals'],
    queryFn: fetchUserRentals,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export type { UserRental, UserRentalsResponse };
