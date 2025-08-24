import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook za automatsko osvježavanje podataka o item-u
 * Koristi Next.js router.refresh() za osvježavanje server-side podataka
 */
export function useItemRefresh() {
  const router = useRouter();

  /**
   * Osvježava trenutnu stranicu i sve relevantne podatke
   * Ovo će automatski osvježiti i server-side i client-side podatke
   */
  const refreshItem = useCallback(() => {
    router.refresh();
  }, [router]);

  /**
   * Osvježava specifičnu putanju
   * Korisno kada želite osvježiti samo određene podatke
   */
  const refreshPath = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return {
    refreshItem,
    refreshPath,
  };
}
