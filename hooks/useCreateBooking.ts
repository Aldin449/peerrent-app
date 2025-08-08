import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type CreateBookingParams = {
  itemId: string;
  startDate: string;
  endDate: string;
};

const createBooking = async ({ itemId, startDate, endDate }: CreateBookingParams) => {
  const response = await axios.post('/api/bookings', {
    itemId,
    startDate,
    endDate,
  });

  if (response.status !== 200) {
    throw new Error(response.data.error || 'Failed to create booking');
  }

  return response.data.booking;
}

export const useCreateBooking = () => {
  return useMutation({
    mutationKey: ['createBooking'],
    mutationFn: createBooking,
    onError: (error:AxiosError) => {
      console.error('Booking creation failed:', error);
      if(error.status === 400){
        toast.error('Već ste poslali zahtjev za iznajmljivanje')
      }
    },
     onSuccess: () => {
      toast.success('Poslan je zahtjev za iznajmljivanje');
      // Invalidate and refetch relevant queries
    },
  });
};