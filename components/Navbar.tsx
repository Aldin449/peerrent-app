'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import axios from 'axios';
import NotificationWrapper from './NotificationWrapper';
import { Menu, X, User, LogOut, Plus, Package, Calendar, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const prefetchMyItems = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['my-items'],
      queryFn: async () => {
        const res = await axios.get('/api/items');
        return res.data;
      },
    });
  }, [queryClient]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="border-b shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            PeerRent
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/add-item" 
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              <Plus size={16} className="mr-1" />
              Dodaj Item
            </Link>

            <Link
              href="/my-items"
              onMouseEnter={prefetchMyItems}
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              <Package size={16} className="mr-1" />
              Moji Itemi
            </Link>

            <Link 
              href="/my-bookings" 
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              <Calendar size={16} className="mr-1" />
              Rezervacije
            </Link>

            <Link 
              href="/conversations" 
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              <MessageSquare size={16} className="mr-1" />
              Razgovori
            </Link>


            {session?.user && <NotificationWrapper />}

            {status === 'loading' ? (
              <div className="px-4 py-2 text-gray-500">Učitavanje...</div>
            ) : session?.user ? (
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-700 font-medium hidden lg:inline">
                  Zdravo, {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium"
                >
                  <LogOut size={18} className="mr-2" />
                  <span className="hidden sm:inline">Odjava</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <User size={18} className="mr-2" />
                Prijava
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link 
              href="/add-item" 
              onClick={closeMobileMenu}
              className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <Plus size={18} className="mr-3" />
              Dodaj Item
            </Link>

            <Link
              href="/my-items"
              onClick={closeMobileMenu}
              className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <Package size={18} className="mr-3" />
              Moji Itemi
            </Link>

            <Link 
              href="/my-bookings" 
              onClick={closeMobileMenu}
              className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <Calendar size={18} className="mr-3" />
              Moje Rezervacije
            </Link>

            <Link 
              href="/conversations" 
              onClick={closeMobileMenu}
              className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <MessageSquare size={18} className="mr-3" />
              Razgovori
            </Link>


            {session?.user && (
              <div className="px-4 py-3">
                <NotificationWrapper />
              </div>
            )}

            {status === 'loading' ? (
              <div className="px-4 py-3 text-gray-500">Učitavanje...</div>
            ) : session?.user ? (
              <div className="space-y-2 px-4">
                <div className="text-sm text-gray-700 font-medium py-2">
                  Zdravo, {session.user.name || session.user.email}
                </div>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    signOut();
                  }}
                  className="flex items-center w-full px-4 py-3 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium"
                >
                  <LogOut size={18} className="mr-3" />
                  Odjava
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                onClick={closeMobileMenu}
                className="flex items-center mx-4 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <User size={18} className="mr-3" />
                Prijava
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
