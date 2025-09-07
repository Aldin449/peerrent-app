import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistItem {
  id: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    description: string;
    pricePerDay: number;
    location: string;
    images: string | null;
    category: string | null;
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface UseWishlistReturn {
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  addToWishlist: (itemId: string) => Promise<boolean>;
  removeFromWishlist: (itemId: string) => Promise<boolean>;
  isInWishlist: (itemId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

export function useWishlist(): UseWishlistReturn {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wishlist
  const fetchWishlist = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      const data = await response.json();
      setWishlist(data.wishlist || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (itemId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to wishlist');
      }

      // Refresh wishlist
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (itemId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/wishlist?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from wishlist');
      }

      // Refresh wishlist
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
      return false;
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (itemId: string): boolean => {
    return wishlist.some(item => item.item.id === itemId);
  };

  // Refresh wishlist
  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  // Load wishlist on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [session?.user?.id]);

  return {
    wishlist,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist,
  };
}

