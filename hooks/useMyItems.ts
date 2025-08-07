// hooks/useMyItems.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  images: string[];
  pricePerDay: number;
  createdAt: string;
}

interface MyItemsResponse {
  items: Item[];
  totalPages: number;
}

const getMyItems = async (page: number): Promise<MyItemsResponse> => {
  const response = await axios.get('/api/items', {
    params: {
      page,
      limit: 6,
    }
  });
  return response.data;
}

export const useMyItems = (page: number, initialData?: MyItemsResponse) => {
  return useQuery<MyItemsResponse>({
    queryKey: ['my-items', page],
    queryFn: () => getMyItems(page),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    enabled: page > 1 || !initialData,
    initialData: page === 1 && initialData ? initialData : undefined,
  });
};
