'use client';
import React, { FunctionComponent, useState } from 'react'
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCreateBooking } from '../hooks/useCreateBooking';


interface BookingFormProps {
    itemId: string;
}

const BookingForm: FunctionComponent<BookingFormProps> = ({ itemId }) => {

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const { mutate, isPending } = useCreateBooking();


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate) {
            return;
        }

        const start = startDate.toISOString();
        const end = endDate.toISOString();

        mutate({ itemId, startDate: start, endDate: end });
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    placeholderText="Početni datum"
                    className="border px-4 py-2 rounded w-full!"
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    placeholderText="Završni datum"
                    className="border px-4 py-2 rounded w-full!"
                />
            </div>
            <button
                type="submit"
                disabled={isPending}
                className="bg-black text-white py-2 px-4 rounded w-full hover:bg-gray-800 transition"
            >
                {isPending ? 'Slanje...' : 'Zatraži rezervaciju'}
            </button>
        </form>
    )
}

export default BookingForm
