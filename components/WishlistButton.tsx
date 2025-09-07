'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlist } from '../hooks/useWishlist';
import { toast } from 'sonner';

interface WishlistButtonProps {
  itemId: string;
  className?: string;
}

export default function WishlistButton({ itemId, className = '' }: WishlistButtonProps) {
  const { data: session } = useSession();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show button if user is not logged in
  if (!session?.user?.id) {
    return null;
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the heart
    e.stopPropagation(); // Stop event bubbling

    if (isLoading) return;

    setIsLoading(true);

    try {
      const isCurrentlyInWishlist = isInWishlist(itemId);
      
      if (isCurrentlyInWishlist) {
        const success = await removeFromWishlist(itemId);
        if (success) {
          toast.success('Uklonjeno iz liste želja');
        } else {
          toast.error('Greška pri uklanjanju iz liste želja');
        }
      } else {
        const success = await addToWishlist(itemId);
        if (success) {
          toast.success('Dodano u listu želja');
        } else {
          toast.error('Greška pri dodavanju u listu želja');
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Greška pri ažuriranju liste želja');
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorited = isInWishlist(itemId);

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`
        absolute top-3 right-3 z-10
        w-10 h-10 rounded-full
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        ${isFavorited 
          ? 'bg-red-500 text-white shadow-lg' 
          : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? 'Ukloni iz liste želja' : 'Dodaj u listu želja'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}
