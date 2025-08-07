import axios from "axios";
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
    onError: (error) => {
      console.error('Booking creation failed:', error);
    },
     onSuccess: () => {
      toast.success('Item uspješno iznajmljen!');
      // Invalidate and refetch relevant queries
    },
  });
};