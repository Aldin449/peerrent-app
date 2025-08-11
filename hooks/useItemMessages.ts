// hooks/useItemMessages.ts
'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { pusherClient } from '@/lib/pusherClient';

// ========================================
// TIPOVI - DEFINIŠEMO STRUKTURU PODATAKA ZA PORUKE
// ========================================
// TypeScript tipovi omogućavaju nam da definišemo strukturu podataka
// Ovo pomaže u otkrivanju grešaka prije nego što se kod izvrši

export interface ChatUser {
  id: string;           // ID korisnika (jedinstveni identifikator)
  name: string | null;  // Ime korisnika (može biti null ako nije postavljeno)
  email: string;        // Email korisnika (uvijek postoji, obavezan)
}

export interface ChatMessage {
  id: string;           // Jedinstveni ID poruke (generiše baza podataka)
  content: string;      // Sadržaj poruke (tekst koji je korisnik napisao)
  itemId: string;       // ID predmeta o kojem se razgovara
  createdAt: string;    // Vrijeme kreiranja (ISO string format)
  sender: ChatUser;     // Korisnik koji je poslao poruku
  recipient: ChatUser;  // Korisnik koji prima poruku
}

// ========================================
// FUNKCIJA ZA DOHVAĆANJE PORUKA - POJEDNOSTAVLJENO
// ========================================
// Ova funkcija se poziva kada trebamo dohvatiti poruke sa servera
const fetchMessages = async (itemId: string, otherUserId?: string): Promise<ChatMessage[]> => {
  // ========================================
  // DEBUG LOGGING
  // ========================================
  console.log('useItemMessages - fetchMessages called:', { itemId, otherUserId });
  
  // ========================================
  // KONSTRUIRAJ URL PARAMETRE - FLEKSIBILNO
  // ========================================
  // URLSearchParams je JavaScript klasa za rad s query parametrima
  const params = new URLSearchParams({ itemId });  // itemId je obavezan
  
  // otherUserId je OPCIONALAN - ako postoji, dohvaćamo specifičan razgovor
  // Ako ne postoji, vlasnik vidi sve poruke za taj predmet
  if (otherUserId) {
    params.append('otherUserId', otherUserId);
  }
  
  // ========================================
  // DEBUG LOGGING URL
  // ========================================
  const url = `/api/messages?${params.toString()}`;
  console.log('useItemMessages - API URL:', url);
  
  // ========================================
  // POZIV API-JA - DOHVAĆA PORUKE SA SERVERA
  // ========================================
  // axios.get() šalje HTTP GET zahtjev na server
  // `/api/messages?${params.toString()}` konstruiše URL s parametrima
  // res.data sadrži odgovor sa servera (listu poruka)
  const res = await axios.get(url);
  
  // ========================================
  // DEBUG LOGGING RESPONSE
  // ========================================
  console.log('useItemMessages - API response:', {
    status: res.status,
    dataLength: res.data?.length,
    data: res.data
  });
  
  return res.data;
};

// ========================================
// GLAVNI HOOK - UPRAVLJA DOHVAĆANJEM PORUKA I REAL-TIME AŽURIRANJIMA
// ========================================
// Hook je React funkcija koja omogućava da komponente koriste state i side effects
export function useItemMessages(itemId: string, otherUserId?: string) {
  // ========================================
  // REACT QUERY CLIENT - ZA CACHE I UPRAVLJANJE PODACIMA
  // ========================================
  const queryClient = useQueryClient();                    // React Query client za cache
  
  // ========================================
  // NEXT AUTH SESIJA - TRENUTNI KORISNIK
  // ========================================
  const { data: session } = useSession();                 // Trenutna sesija korisnika

  // ========================================
  // REACT QUERY - DOHVAĆANJE I CACHE-IRANJE PORUKA
  // ========================================
  // useQuery je React Query hook koji upravlja dohvaćanjem podataka
  const query = useQuery({
    // ========================================
    // QUERY KEY - KLJUČ ZA CACHE - STVARNO 1-ON-1
    // ========================================
    // queryKey je jedinstveni identifikator za ovaj query
    // Različit za svaki razgovor (itemId + otherUserId kombinacija)
    // Ovo omogućava da React Query zna kada treba refetch-ovati podatke
    queryKey: ['item-messages', itemId, otherUserId],
    
    // ========================================
    // QUERY FUNKCIJA - FUNKCIJA KOJA DOHVAĆA PODATKE
    // ========================================
    // queryFn je funkcija koja se poziva kada trebamo dohvatiti podatke
    queryFn: () => fetchMessages(itemId, otherUserId),
    
    // ========================================
    // STALE TIME - KOLIKO DUGO SU PODACI "SVJEŽI"
    // ========================================
    // staleTime: 60_000 znači 60 sekundi (1 minuta)
    // Nakon 1 minute, React Query će smatrati podatke "stale" (zastarjelim)
    // Ali neće ih automatski refetch-ovati dok korisnik ne napravi neku akciju
    staleTime: 60_000,
  });

  // ========================================
  // EFEKT - POSTAVLJANJE REAL-TIME SLUŠANJA PREKO PUSHERA
  // ========================================
  // useEffect se poziva kada se komponenta mount-uje ili kada se promijene dependencies
  useEffect(() => {
    // ========================================
    // RANIJI RETURN - AKO NEMA ITEM ID
    // ========================================
    if (!itemId) return;  // Ako nema itemId, ne možemo slušati

    // ========================================
    // PRETPLATA NA PUSHER KANAL - SVAKI PREDMET IMA SVOJ KANAL
    // ========================================
    // Pusher je servis koji omogućava real-time komunikaciju
    // subscribe() se pretplaćuje na kanal s imenom `item-${itemId}`
    // Svaki predmet ima svoj kanal (npr. item-123, item-456)
    const channel = pusherClient.subscribe(`item-${itemId}`);

    // ========================================
    // HANDLER ZA NOVE PORUKE - POZIVA SE KADA PUSHER POŠALJE DOGAĐAJ
    // ========================================
    // Ova funkcija se poziva svaki put kada Pusher pošalje 'new-message' događaj
    const handleNew = (msg: ChatMessage) => {
      // ========================================
      // KLJUČNA LOGIKA - SPRJEČAVANJE DUPLIKATA PORUKA
      // ========================================
      // Problem: kada pošaljemo poruku, ona se dodaje optimistično (odmah)
      // Ali Pusher također šalje događaj, što može dovesti do duplikata
      
      // ========================================
      // PROVJERA DA LI JE MOJA PORUKA
      // ========================================
      const currentUserEmail = session?.user?.email;
      const isMyMessage = currentUserEmail && msg.sender?.email === currentUserEmail;
      
      // ========================================
      // AKO JE MOJA PORUKA - PRESKAČEMO JE IZ PUSHERA
      // ========================================
      // Jer je već dodana kroz optimistično ažuriranje
      if (isMyMessage) {
        console.log('Preskačem svoju poruku iz Pushera da izbjegnem duplikate:', msg.content);
        return;
      }

      console.log('Dodajem novu poruku iz Pushera:', msg);
      
      // ========================================
      // AŽURIRAJ CACHE - DODAJ NOVU PORUKU U POSTOJEĆE
      // ========================================
      // setQueryData direktno ažurira cache bez poziva servera
      queryClient.setQueryData<ChatMessage[]>(['item-messages', itemId, otherUserId], (prev) => {
        // ========================================
        // AKO NEMA PRETHODNIH PORUKA
        // ========================================
        if (!prev) return [msg];  // Vrati samo ovu poruku
        
        // ========================================
        // PROVJERA DUPLIKATA - PO ID-U PORUKE
        // ========================================
        // some() vraća true ako bilo koja poruka ima isti ID
        if (prev.some((m) => m.id === msg.id)) {
          console.log('Poruka već postoji, preskačem:', msg.id);
          return prev;  // Vrati stare podatke bez promjene
        }
        
        // ========================================
        // DODAJ NOVU PORUKU I SORTIRAJ - PO VREMENU KREIRANJA
        // ========================================
        // Važno: sortiramo ascending (od najstarije do najnovije)
        // Ovo je važno jer želimo da poruke budu u pravom redoslijedu
        const newMessages = [...prev, msg].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        console.log('Ažurirana lista poruka, ukupan broj:', newMessages.length);
        return newMessages;
      });
    };

    // ========================================
    // BIND DOGAĐAJA - POVEŽI HANDLER SA PUSHER DOGAĐAJEM
    // ========================================
    // bind() povezuje funkciju handleNew sa 'new-message' događajem
    // Sada će se handleNew pozvati svaki put kada Pusher pošalje taj događaj
    channel.bind('new-message', handleNew);

    // ========================================
    // CLEANUP - ODJAVI SE KADA SE KOMPONENTA UNMOUNT-UJE
    // ========================================
    // Ova funkcija se poziva kada se komponenta unmount-uje
    // Ovo je važno da ne bi došlo do memory leak-a
    return () => {
      channel.unbind('new-message', handleNew);           // Odveži handler
      pusherClient.unsubscribe(`item-${itemId}`);         // Odjavi se sa kanala
    };
  }, [itemId, queryClient, session?.user?.email, otherUserId]); // Dependency array

  // ========================================
  // VRATI REACT QUERY OBJEKT - SADRŽI DATA, ISLOADING, ERROR, ITD.
  // ========================================
  // query objekat sadrži sve informacije o stanju query-ja:
  // - data: podaci (poruke)
  // - isLoading: da li se podaci učitavaju
  // - error: greška ako je došlo do nje
  // - refetch: funkcija za ponovno dohvaćanje
  return query;
}
