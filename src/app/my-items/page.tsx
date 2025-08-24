import { Suspense } from 'react';
import LoadingComponent from '../../../components/Loader';
import MyItems from '../../../components/MyItems';

interface MyItemsPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default function MyItemsPage({ searchParams }: MyItemsPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Moji Predmeti</h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Upravljajte svojim predmetima i vidite sve rezervacije
            </p>
          </div>
        </div>
      </div>

      {/* Items Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingComponent />}>
          <MyItems searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
