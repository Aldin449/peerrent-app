import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ItemCard from '../../../components/ItemCard';

export default async function MyFavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user's wishlist items
  const wishlistItems = await prisma.wishlist.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      item: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Moja lista želja
        </h1>
        <p className="text-gray-600">
          {wishlistItems.length === 0 
            ? 'Nemate sačuvanih stavki u listi želja'
            : `Imate ${wishlistItems.length} sačuvanih stavki`
          }
        </p>
      </div>

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💝</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Vaša lista želja je prazna
          </h2>
          <p className="text-gray-500 mb-6">
            Dodajte stavke koje vas zanimaju klikom na srce
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Pretraži stavke
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((wishlistItem) => (
            <ItemCard key={wishlistItem.id} item={wishlistItem.item} />
          ))}
        </div>
      )}
    </div>
  );
}

