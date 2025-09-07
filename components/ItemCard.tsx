'use client';

import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import TrustIndicators from './TrustIndicators';

interface Item {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  location: string;
  images: string[] | string | null;
  category?: string | null;
  user: {
    name: string | null;
    email: string;
    averageRating?: number | null;
    ratingsCount?: number | null;
    emailVerified?: boolean;
    createdAt?: string | null;
  };
}

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  // Objašnjenje: Pošto 'item.images' može biti niz stringova ili null, 
  // moramo osigurati da uvijek radimo sa nizom stringova.
  // Ako je 'item.images' već niz, koristimo ga direktno.
  // Ako je null, koristimo prazan niz kao podrazumijevanu vrijednost.
  // Ova provjera sprječava greške prilikom parsiranja i koristi tipove TypeScript-a.

  // Objašnjenje: Provjeravamo da li je 'item.images' već niz stringova.
  // Ako jeste, koristimo ga direktno. Ako nije (npr. ako je string), pokušavamo ga parsirati kao JSON.
  // Ova provjera je važna kako bismo izbjegli greške prilikom prikaza slika.
  // Također, dodajemo fallback na prazan niz ako parsiranje ne uspije.

  let images: string[] = [];

  if (Array.isArray(item.images)) {
    // Ako je 'item.images' već niz, koristimo ga direktno.
    images = item.images;
  } else if (typeof item.images === 'string') {
    try {
      // Ako je 'item.images' string, pokušavamo ga parsirati kao JSON.
      images = JSON.parse(item.images);
    } catch (e) {
      // Ako parsiranje ne uspije, postavljamo prazan niz i ispisujemo grešku.
      console.error('Greška pri parsiranju item.images:', e);
      images = [];
    }
  }

  // Ispisujemo slike u konzolu radi debugovanja
  console.log('item images:', images);

  return (
    <div className="relative border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      {/* Wishlist Button */}
      <WishlistButton itemId={item.id} />
      
      {/* Item Link */}
      <Link
        href={`/items/${item.id}`}
        className="block"
      >
        {/* Item Image */}
        {item.images && item.images.length > 0 && (
          <div className="mb-3 relative overflow-hidden rounded-lg">
            <Image
              src={images[0]}
              alt={item.title}
              width={300}
              height={200}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Item Details */}
        <div className="space-y-2">
          <h2 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {item.title}
          </h2>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>📍</span>
            <span className="line-clamp-1">{item.location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-green-600">
              💰 {item.pricePerDay} KM/dan
            </p>
            
            {item.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {item.category}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              👤 {item.user.name}
            </p>
            <TrustIndicators
              userData={{
                emailVerified: item.user.emailVerified || false,
                phoneNumber: null, // Not available in current data
                location: null, // Not available in current data
                averageRating: item.user.averageRating,
                ratingsCount: item.user.ratingsCount,
                createdAt: item.user.createdAt,
                itemCount: 0, // Not available in current data
                bookingCount: 0, // Not available in current data
                messageCount: 0 // Not available in current data
              }}
              showScore={false}
              showBadges={true}
              maxBadges={2}
              size="sm"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

