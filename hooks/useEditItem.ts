import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useItemRefresh } from './useItemRefresh';

const editItem = async ({ id, data }: { id: string; data: FormData }) => {
  const response = await axios.put(`/api/items/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useEditItem = () => {
  const queryClient = useQueryClient();
  const { refreshItem } = useItemRefresh();

  return useMutation({
    mutationKey: ['edit-item'],
    mutationFn: editItem,
    onError: (error: any) => {
      console.error('Error editing item:', error);
      const errorMessage = error.response?.data?.error || 'Greška prilikom editovanja itema.';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Item uspješno editovan!');
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      queryClient.invalidateQueries({ queryKey: ['public-items'] });
      
      // Osvježavamo i Next.js cache za automatsko osvježavanje
      refreshItem();
    },
  });
};