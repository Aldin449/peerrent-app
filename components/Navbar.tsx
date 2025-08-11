'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import axios from 'axios';
import NotificationWrapper from './NotificationWrapper';

const Navbar = () => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const prefetchMyItems = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['my-items'],
      queryFn: async () => {
        const res = await axios.get('/api/items');
        return res.data;
      },
    });
  }, [queryClient]);

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center relative">
      <Link href="/" className="text-xl font-bold">
        PeerRent
      </Link>

      <div className="flex gap-4 items-center">
        <Link href="/add-item" className="hover:underline">
          Dodaj Item
        </Link>

        <Link
          href="/my-items"
          onMouseEnter={prefetchMyItems}
          className="hover:underline"
        >
          Moji Itemi
        </Link>

        <Link href="/my-bookings" className="hover:underline">
          Moje Rezervacije
        </Link>

        <Link href="/conversations" className="hover:underline">
          Razgovori
        </Link>

        {session?.user && <NotificationWrapper />}

        {status === 'loading' ? (
          <span>Učitavanje...</span>
        ) : session?.user ? (
          <>
            <span className="text-sm hidden sm:inline">
              Zdravo, {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-red-600 hover:underline"
            >
              Odjava
            </button>
          </>
        ) : (
          <Link href="/login" className="text-blue-600 hover:underline">
            Prijava
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
