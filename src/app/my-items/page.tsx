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
    <main className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Moji Itemi</h1>
      <Suspense fallback={<LoadingComponent />}>
        <MyItems searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
