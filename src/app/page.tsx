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
    // Main container with max width and centered layout
    // max-w-6xl prevents the content from becoming too wide on large screens
    // mx-auto centers the content horizontally
    <main className="max-w-6xl mx-auto">
      {/* Page title that explains what the site does */}
      <h1 className="text-3xl font-bold mb-6">Iznajmi ili iznajmljuj stvari</h1>
      
      {/* Render the PublicItemList component with search parameters */}
      {/* This component handles displaying items, search, and pagination */}
      <PublicItemList searchParams={searchParams} />
    </main>
  );
}
