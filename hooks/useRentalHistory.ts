import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface RentalHistoryItem {
  id: string;
  itemTitle: string;
  itemDescription: string;
  itemLocation: string;
  itemImages: string[];
  ownerName: string;
  startDate: string;
  endDate: string;
  completedAt: string;
  totalDays: number;
  totalCost: number;
}

interface RentalHistoryResponse {
  history: RentalHistoryItem[];
  totalRentals: number;
}

const fetchRentalHistory = async (): Promise<RentalHistoryResponse> => {
  const response = await axios.get('/api/bookings/history');
  return response.data;
};

export const useRentalHistory = () => {
  return useQuery({
    queryKey: ['rental-history'],
    queryFn: fetchRentalHistory,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
