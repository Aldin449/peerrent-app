'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { FunctionComponent } from 'react'
import { toast } from 'sonner';

interface ClientBookingActionProps {
    bookingId: string;
    itemId: string;
   
}
const ClientBookingAction: FunctionComponent<ClientBookingActionProps> = ({ bookingId }) => {
     const router = useRouter();

    const mutation = useMutation({
        mutationKey: ['update-booking-status', bookingId],
        mutationFn: async (newStatus: 'APPROVED' | 'DECLINED') => {
            console.log(`Updating booking ${bookingId} status to: ${newStatus}`);
            await axios.put(`/api/bookings/${bookingId}/status`, { status: newStatus });
        },
        onSuccess: (_data, newStatus) => {
            // Optionally, you can add success handling logic here
            toast.success(`Rezervacija je ${newStatus === 'APPROVED' ? 'odobrena' : 'odbijena'}`);
            router.refresh(); // Refresh the page or data after mutation
        },
        onError: (error) => {
            console.error('Error updating booking status:', error);
            toast.error('Greška prilikom ažuriranja statusa.');
        }
    });

    const handleStatusChange = async (newStatus: 'APPROVED' | 'DECLINED') => {
        console.log(`Changing status to: ${newStatus}`);
        mutation.mutate(newStatus);
    }
    
    return (
        <div className="flex gap-2 mt-3">
            <button
                onClick={() => handleStatusChange('APPROVED')}
                disabled={mutation.isPending}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
            >
                {mutation.isPending ? 'Odobravanje...' : 'Odobri'}
            </button>
            <button
                onClick={() => handleStatusChange('DECLINED')}
                disabled={mutation.isPending}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
            >
                {mutation.isPending ? 'Odbijanje...' : 'Odbij'}
            </button>
        </div>
    )
}

export default ClientBookingAction;
