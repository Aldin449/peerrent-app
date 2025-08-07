import PublicItemList from '../../components/PublicItemList';

interface HomePageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Iznajmi ili iznajmljuj stvari</h1>
      <PublicItemList searchParams={searchParams} />
    </main>
  );
}
