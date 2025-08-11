import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ========================================
// INBOX VIEW - PRIKAZ SVIH KORISNIKA KOJI SU POSLALI PORUKE
// ========================================
// Ova komponenta prikazuje listu svih korisnika koji su poslali poruke trenutnom korisniku
// Korisnik može odabrati korisnika da vidi sve poruke s njim

interface InboxUser {
  userId: string;
  userName: string | null;
  userEmail: string;
  lastMessage: {
    content: string;
    createdAt: string;
    itemId: string;
    itemTitle: string;
  };
  messageCount: number;
  items: Array<{
    itemId: string;
    itemTitle: string;
  }>;
}

// ========================================
// HOOK ZA DOHVAĆANJE INBOX-A
// ========================================
function useInbox() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: async (): Promise<InboxUser[]> => {
      const response = await axios.get('/api/messages/inbox');
      return response.data;
    },
    staleTime: 30000, // 30 sekundi
  });
}

// ========================================
// GLAVNA KOMPONENTA
// ========================================
export default function InboxView( { isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void } ) {
  const { data: inboxUsers = [], isLoading, error } = useInbox();
  // ========================================
  // LOADING STANJE
  // ========================================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Učitavanje inbox-a...</span>
      </div>
    );
  }

  // ========================================
  // ERROR STANJE
  // ========================================
  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Greška pri učitavanju inbox-a
        </div>
        <div className="text-gray-600">
          Pokušajte ponovo kasnije
        </div>
      </div>
    );
  }

  // ========================================
  // PRAZNO STANJE
  // ========================================
  if (inboxUsers.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 text-lg mb-2">
          📭 Inbox je prazan
        </div>
        <div className="text-gray-400">
          Još niste primili nijednu poruku
        </div>
      </div>
    );
  }

  // ========================================
  // FORMATIRANJE DATUMA
  // ========================================
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('hr-HR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('hr-HR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="bg-white rounded-lg shadow-sm border">
             {/* ========================================
           HEADER - NASLOV INBOX-A
           ======================================== */}
       <div className="px-6 py-4 border-b border-gray-200">
         <h2 className="text-xl font-semibold text-gray-900">
           📬 Inbox - Poruke od korisnika
         </h2>
         <p className="text-sm text-gray-600 mt-1">
           {inboxUsers.length} korisnika vam je poslalo poruke. Kliknite na korisnika da otvorite razgovor ispod.
         </p>
       </div>

      {/* ========================================
          LISTA KORISNIKA
          ======================================== */}
      <div className="divide-y divide-gray-200">
        {inboxUsers.map((user) => (
          <div key={user.userId} className="p-4 hover:bg-gray-50 transition-colors">
            {/* ========================================
                LINK ZA OTVARANJE RAZGOVORA
                ======================================== */}
            <Link
              href={`/items/${user.lastMessage.itemId}?otherUserId=${user.userId}`}
              className="block"
            >
              <div className="flex items-start space-x-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                {/* ========================================
                    AVATAR/INICIJALI
                    ======================================== */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>

                {/* ========================================
                    PODACI O KORISNIKU I PORUCI
                    ======================================== */}
                <div className="flex-1 min-w-0">
                  {/* Ime korisnika */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.userName || 'Nepoznati korisnik'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(user.lastMessage.createdAt)}
                    </span>
                  </div>

                  {/* Email korisnika */}
                  <p className="text-xs text-gray-500 truncate">
                    {user.userEmail}
                  </p>

                  {/* Zadnja poruka */}
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {user.lastMessage.content}
                  </p>

                  {/* Predmet i broj poruka */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {user.lastMessage.itemTitle}
                      </span>
                      {user.items.length > 1 && (
                        <span className="text-xs text-gray-500">
                          +{user.items.length - 1} više predmeta
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {user.messageCount} poruk{user.messageCount === 1 ? 'a' : user.messageCount < 5 ? 'e' : 'a'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
