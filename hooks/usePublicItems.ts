import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const fetchPaginatedItems = async (page: number, search: string) => {
  const response = await axios.get(`/api/public-items`, {
    params: {
      page,
      limit: 6,
      search
    }
  });
  return response.data;
};

export const usePaginatedPublicItems = (page: number, search: string) => {
  return useQuery({
    queryKey: ['public-items', page, search],
    queryFn: () => fetchPaginatedItems(page, search),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
};
