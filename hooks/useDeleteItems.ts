import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useItemRefresh } from './useItemRefresh';

const deleteItem = async (id: string) => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Greška prilikom brisanja itema');
  }
  
  return response.json();
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const { refreshItem } = useItemRefresh();

  return useMutation({
    mutationKey: ['delete-item'],
    mutationFn: deleteItem,
    onError: (error: any) => {
      console.error('Error deleting item:', error);
      const errorMessage = error.message || 'Greška prilikom brisanja itema.';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Item uspješno obrisan!');
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      queryClient.invalidateQueries({ queryKey: ['public-items'] });
      
      // Osvježavamo i Next.js cache za automatsko osvježavanje
      refreshItem();
    },
  });
};