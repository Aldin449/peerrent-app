import { Suspense } from 'react';
import LoadingComponent from '../../../components/Loader';
import OwnerBookings from '../../../components/OwnerBookings';

export default function MyBookingsPage() {
  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Moje Rezervacije</h1>
      <Suspense fallback={<LoadingComponent />}>
        <OwnerBookings />
      </Suspense>
    </main>
  );
} 