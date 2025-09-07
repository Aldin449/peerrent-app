import { Suspense } from 'react';
import LoadingComponent from '../../../components/Loader';
import RentalHistory from '../../../components/RentalHistory';

export default function RentalHistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Historija Iznajmljivanja</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Pregledajte sva vaša prethodna iznajmljivanja i aktivnosti
            </p>
          </div>
        </div>
      </div>

      {/* Rental History Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingComponent />}>
          <RentalHistory />
        </Suspense>
      </main>
    </div>
  );
}
