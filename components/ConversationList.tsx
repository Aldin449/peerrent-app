'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Clock, User } from 'lucide-react';
import Link from 'next/link';

// TIPOVI - struktura podataka za razgovore
interface Conversation {
  itemId: string;                    // ID predmeta o kojem se razgovara
  itemTitle: string;                 // Naslov predmeta
  otherUser: {                       // Korisnik s kojim razgovaramo
    id: string;                      // ID korisnika
    name: string | null;             // Ime (može biti null)
    email: string;                   // Email
  };
  lastMessage: {                     // Posljednja poruka u razgovoru
    content: string;                 // Sadržaj poruke
    createdAt: string;               // Vrijeme kreiranja
    senderId: string;                // ID pošiljaoca
  };
  unreadCount: number;               // Broj nepročitanih poruka
}

// KOMPONENTA ZA PRIKAZ LISTE RAZGOVORA
// Ovo je "ulazna tačka" za vlasnike da odaberu specifičan razgovor
export default function ConversationList() {
  // HOOKS - state i sesija
  const { data: session } = useSession();                    // Trenutna sesija korisnika
  const [conversations, setConversations] = useState<Conversation[]>([]); // Lista razgovora
  const [isLoading, setIsLoading] = useState(true);          // Loading stanje

  // EFEKT - dohvaćanje razgovora kada se komponenta mount-uje
  useEffect(() => {
    const fetchConversations = async () => {
      // PROVJERA - da li imamo korisnika
      if (!session?.user?.id) return;

      try {
        // POZIV API-JA - dohvaća sve razgovore za trenutnog korisnika
        const response = await fetch('/api/messages/conversations');
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data);  // Ažuriraj state
        }
      } catch (error) {
        console.error('Greška pri dohvaćanju razgovora:', error);
      } finally {
        setIsLoading(false);  // Završi loading
      }
    };

    // POZOVI FUNKCIJU - kada se promijeni session
    fetchConversations();
  }, [session?.user?.id]);

  // RANIJI RETURN - ako nema sesije, ne prikazuj ništa
  if (!session?.user) {
    return null;
  }

  // LOADING STANJE - prikaži skeleton dok se podaci učitavaju
  if (isLoading) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PRAZNO STANJE - ako nema razgovora
  if (conversations.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-6 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nema razgovora</h3>
        <p className="text-gray-500">
          Još niste imali razgovore o iznajmljivanju predmeta.
        </p>
      </div>
    );
  }

  // GLAVNI PRIKAZ - lista svih razgovora
  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* HEADER - naslov sekcije */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Moji razgovori</h3>
      </div>
      
      {/* LISTA RAZGOVORA - svaki razgovor je klikabilan link */}
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => (
          // KLJUČNI LINK - navigira na stranicu predmeta s otherUserId parametrom
          // Ovo omogućava vlasnicima da odaberu specifičan razgovor
          <Link
            key={`${conversation.itemId}-${conversation.otherUser.id}`}
            href={`/items/${conversation.itemId}?otherUserId=${conversation.otherUser.id}`}
            className="block hover:bg-gray-50 transition-colors"
          >
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* INFORMACIJE O PREDMETU */}
                  <div className="flex items-center space-x-3 mb-2">
                    <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      {/* NASLOV PREDMETA - glavna informacija */}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.itemTitle}
                      </p>
                    </div>
                  </div>

                  {/* INFORMACIJE O KORISNIKU */}
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {conversation.otherUser.name || conversation.otherUser.email}
                    </p>
                  </div>

                  {/* POSLJEDNJA PORUKA */}
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage.content}
                    </p>
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {new Date(conversation.lastMessage.createdAt).toLocaleDateString('hr-HR')}
                    </span>
                  </div>
                </div>

                {/* BROJ NEPROČITANIH PORUKA - ako ih ima */}
                {conversation.unreadCount > 0 && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
