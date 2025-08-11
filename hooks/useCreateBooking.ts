// Import axios for making HTTP requests to our API
// AxiosError is used for type-safe error handling
import axios, { AxiosError } from "axios";
// Import useMutation from React Query for managing API mutations
// This provides loading states, error handling, and cache invalidation
import { useMutation } from "@tanstack/react-query";
// Import toast for showing user-friendly notifications
// This provides better UX than console logs
import { toast } from "sonner";

// Define the structure of parameters needed to create a booking
// TypeScript type ensures we pass the correct data structure
type CreateBookingParams = {
  itemId: string;      // ID of the item being booked
  startDate: string;   // Start date in ISO string format
  endDate: string;     // End date in ISO string format
};

// Function that makes the actual API call to create a booking
// This is an async function because HTTP requests take time
const createBooking = async ({ itemId, startDate, endDate }: CreateBookingParams) => {
  // Make a POST request to our bookings API endpoint
  // POST is used because we're creating new data
  const response = await axios.post('/api/bookings', {
    itemId,
    startDate,
    endDate,
  });

  // Check if the request was successful
  // HTTP 200 means the request was processed successfully
  if (response.status !== 200) {
    // If not successful, throw an error with details
    throw new Error(response.data.error || 'Failed to create booking');
  }

  // Return the created booking data from the response
  return response.data.booking;
}

// Custom hook that provides booking creation functionality
// This hook encapsulates all the logic for creating bookings
export const useCreateBooking = () => {
  // Use React Query's useMutation hook
  // This provides loading states, error handling, and success callbacks
  return useMutation({
    // Unique key for this mutation
    // Used by React Query for caching and debugging
    mutationKey: ['createBooking'],
    // The function that performs the actual API call
    mutationFn: createBooking,
    // Function called when the API call fails
    onError: (error:AxiosError) => {
      // Log the error for debugging purposes
      console.error('Booking creation failed:', error);
      // Check if it's a 400 error (bad request)
      if(error.status === 400){
        // Show user-friendly error message in Bosnian
        toast.error('Već ste poslali zahtjev za iznajmljivanje')
      }
    },
    // Function called when the API call succeeds
    onSuccess: () => {
      // Show success message to the user
      toast.success('Poslan je zahtjev za iznajmljivanje');
      // TODO: Invalidate and refetch relevant queries
      // This would refresh the UI to show the new booking
    },
  });
};