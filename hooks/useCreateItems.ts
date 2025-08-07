import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createItem = async (data: FormData) => {
  const response = await axios.post('/api/add-item', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['create-item'],
    mutationFn: createItem,
    onError: (error: any) => {
      console.error('Error creating item:', error);
      const errorMessage = error.response?.data?.error || 'Greška prilikom kreiranja itema.';
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success('Item uspješno dodan!');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      queryClient.invalidateQueries({ queryKey: ['public-items'] });
    },
  });
};
