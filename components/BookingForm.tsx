// This directive tells Next.js that this is a client-side component
// Client components can use browser APIs, state, and event handlers
'use client';

// Import React and its hooks for building the component
import React, { FunctionComponent, useState } from 'react'
// Import DatePicker component for selecting dates
// This provides a user-friendly calendar interface
import DatePicker from 'react-datepicker';
// Import the CSS styles for the DatePicker component
import 'react-datepicker/dist/react-datepicker.css';
// Import our custom hook for creating bookings
// This hook handles the API call and state management
import { useCreateBooking } from '../hooks/useCreateBooking';

// Define the props that this component expects
// TypeScript interface ensures type safety
interface BookingFormProps {
    itemId: string;  // ID of the item being booked
}

// BookingForm component that allows users to select dates and submit booking requests
// This is a FunctionComponent with TypeScript typing
const BookingForm: FunctionComponent<BookingFormProps> = ({ itemId }) => {

    // State for managing the selected start date
    // useState hook creates a state variable and a function to update it
    const [startDate, setStartDate] = useState<Date | null>(null);
    // State for managing the selected end date
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Use our custom hook to handle booking creation
    // This hook provides the mutation function and loading state
    const { mutate, isPending } = useCreateBooking();

    // Function that handles form submission
    // This is called when the user clicks the submit button
    const handleSubmit = (e: React.FormEvent) => {
        // Prevent the default form submission behavior
        // This stops the page from reloading
        e.preventDefault();

        // Validation: check if both dates are selected
        // If not, return early and don't submit
        if (!startDate || !endDate) {
            return;
        }

        // Convert dates to ISO string format for the API
        // ISO format is a standard way to represent dates as strings
        const start = startDate.toISOString();
        const end = endDate.toISOString();

        // Call the mutation function to create the booking
        // This will send the data to the server
        mutate({ itemId, startDate: start, endDate: end });
    }

    return (
        // Form element that handles submission
        // onSubmit calls our handleSubmit function when submitted
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-full">
            {/* Date Selection Container */}
            {/* Flexbox layout that stacks vertically on mobile, horizontally on larger screens */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Start Date Picker */}
                {/* This allows users to select when they want to start renting */}
                <DatePicker
                    selected={startDate}           // Currently selected date
                    onChange={(date) => setStartDate(date)}  // Function called when date changes
                    selectsStart                   // This picker is for the start date
                    startDate={startDate}          // Start of the date range
                    endDate={endDate}              // End of the date range (for validation)
                    minDate={new Date()}           // Can't select dates in the past
                    placeholderText="Početni datum" // Text shown when no date is selected
                    className="border px-4 py-2 rounded w-full!" // Styling
                />
                {/* End Date Picker */}
                {/* This allows users to select when they want to end renting */}
                <DatePicker
                    selected={endDate}             // Currently selected date
                    onChange={(date) => setEndDate(date)}    // Function called when date changes
                    selectsEnd                     // This picker is for the end date
                    startDate={startDate}          // Start of the date range (for validation)
                    endDate={endDate}              // End of the date range
                    minDate={startDate || new Date()} // Can't be before start date
                    placeholderText="Završni datum"  // Text shown when no date is selected
                    className="border px-4 py-2 rounded w-full!" // Styling
                />
            </div>
            {/* Submit Button */}
            {/* Button that submits the booking request */}
            <button
                type="submit"                      // This button submits the form
                disabled={isPending}               // Disable button while request is in progress
                className="bg-black text-white py-2 px-4 rounded w-full hover:bg-gray-800 transition"
            >
                {/* Show different text based on loading state */}
                {isPending ? 'Slanje...' : 'Zatraži rezervaciju'}
            </button>
        </form>
    )
}

// Export the component so it can be used in other files
export default BookingForm
