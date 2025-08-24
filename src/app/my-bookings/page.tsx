import { Suspense } from 'react';
import LoadingComponent from '../../../components/Loader';
import OwnerBookings from '../../../components/OwnerBookings';

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Moje Rezervacije</h1>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto">
              Pratite sve svoje rezervacije i upravljajte njima
            </p>
          </div>
        </div>
      </div>

      {/* Bookings Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingComponent />}>
          <OwnerBookings />
        </Suspense>
      </main>
    </div>
  );
} 