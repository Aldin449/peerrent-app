// Import the PublicItemList component that displays all available items
// This component handles the main content of the homepage
import PublicItemList from '../../components/PublicItemList';

// Define the props that this page component expects
// searchParams is a Promise because Next.js 15 makes URL parameters async
interface HomePageProps {
  searchParams?: Promise<{
    page?: string;    // Current page number from URL (for pagination)
    search?: string;  // Search term from URL (for filtering items)
  }>;
}

// Main homepage component that serves as the landing page
// This is an async component because it passes async searchParams to child components
export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Iznajmi ili iznajmljuj stvari
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Povežite se sa svojom zajednicom i pronađite ili ponudite stvari koje trebate
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-lg font-semibold">🔍 Pronađi</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-lg font-semibold">📦 Ponudi</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-lg font-semibold">🤝 Poveži</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <PublicItemList searchParams={searchParams} />
      </main>
    </div>
  );
}
