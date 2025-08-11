// hooks/useSendMessage.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import type { ChatMessage } from './useItemMessages';

// ========================================
// TIPOVI - STRUKTURA PODATAKA ZA SLANJE PORUKE
// ========================================
// Payload = podaci koje šaljemo na server
type Payload = { 
  itemId: string;        // ID predmeta o kojem se razgovara
  content: string;       // Sadržaj poruke (tekst koji je korisnik napisao)
  recipientId: string    // ID korisnika koji prima poruku
};

// ========================================
// GLAVNI HOOK - UPRAVLJA SLANJEM PORUKA S OPTIMISTIČNIM AŽURIRANJIMA
// ========================================
// Ova funkcija kreira hook koji omogućava slanje poruka
// Optimistična ažuriranja znače da se poruka prikazuje odmah, prije server odgovora
export function useSendMessage(
  itemId: string,         // ID predmeta
  otherUserId?: string,   // ID drugog korisnika (OPCIONALAN - za slanje poruka)
  currentUser?: {         // Podaci o trenutnom korisniku
    id: string;           // ID korisnika
    name?: string | null; // Ime korisnika (može biti null)
    email: string         // Email korisnika
  }
) {
  // ========================================
  // REACT QUERY CLIENT - ZA DIREKTNO UPRAVLJANJE CACHE-OM
  // ========================================
  // queryClient omogućava nam da direktno manipulišemo cache-om
  // Ovo je potrebno za optimistična ažuriranja
  const qc = useQueryClient();

  // ========================================
  // REACT QUERY MUTATION - ZA SLANJE PORUKA
  // ========================================
  // useMutation je React Query hook za mutacije (promjene podataka)
  // Mutacija = operacija koja mijenja podatke (npr. slanje poruke)
  return useMutation({
    // ========================================
    // KLJUČ MUTACIJE - JEDINSTVEN ZA SVAKI RAZGOVOR - STVARNO 1-ON-1
    // ========================================
    // mutationKey omogućava React Query da prati ovu mutaciju
    // Različit za svaki razgovor (itemId + otherUserId kombinacija)
    mutationKey: ['send-message', itemId, otherUserId],
    
    // ========================================
    // FUNKCIJA MUTACIJE - ŠALJE PORUKU NA SERVER
    // ========================================
    // mutationFn je funkcija koja se poziva kada trebamo poslati poruku
    // Ona šalje HTTP POST zahtjev na /api/messages endpoint
    mutationFn: async ({ itemId, content, recipientId }: Payload & { recipientId: string }) => {
      // ========================================
      // DEBUG LOGGING
      // ========================================
      console.log('useSendMessage - Sending message:', { itemId, content, recipientId });
      
      const res = await axios.post('/api/messages', { itemId, content, recipientId });
      
      // ========================================
      // DEBUG LOGGING RESPONSE
      // ========================================
      console.log('useSendMessage - Server response:', res.data);
      
      return res.data as ChatMessage;  // Vraća odgovor sa servera
    },
    
    // ========================================
    // OPTIMISTIČNO AŽURIRANJE - PRIKAŽI PORUKU ODMAH
    // ========================================
    // onMutate se poziva PRIJE nego što se pošalje zahtjev na server
    // Ovo omogućava da korisnik vidi poruku odmah, bez čekanja
    onMutate: async ({ content }) => {
      // ========================================
      // DEBUG LOGGING
      // ========================================
      console.log('useSendMessage - onMutate called:', { content, itemId, otherUserId, currentUser });
      
      // ========================================
      // KLJUČ ZA CACHE - ISTI KAO U USEITEMMESSAGES - STVARNO 1-ON-1
      // ========================================
      // Moramo koristiti isti ključ da bi ažuriranja bila sinhronizovana
      const key = ['item-messages', itemId, otherUserId];
      
      // ========================================
      // DEBUG LOGGING CACHE KEY
      // ========================================
      console.log('useSendMessage - Cache key:', key);
      
      // ========================================
      // OTKAŽI TRENUTNE QUERY-EVE - DA NE BI DOŠLO DO KONFLIKTA
      // ========================================
      // cancelQueries sprječava da se stari podaci refetch-uju
      // Ovo je važno jer ne želimo da se naši optimistični podaci prepišu
      await qc.cancelQueries({ queryKey: key });

      // ========================================
      // SAČUVAJ STARE PODATKE - ZA ROLLBACK AKO NEŠTO NE USPIJE
      // ========================================
      // Ako nešto ne uspije, možemo vratiti stare podatke
      const prev = qc.getQueryData<ChatMessage[]>(key);
      
      // ========================================
      // DEBUG LOGGING PREVIOUS DATA
      // ========================================
      console.log('useSendMessage - Previous data from cache:', prev);

      // ========================================
      // KREIRAJ PRIVREMENU PORUKU - S TEMP ID-OM I TRENUTNIM VREMENOM
      // ========================================
      // Ova poruka će biti prikazana korisniku odmah
      // Kasnije će biti zamijenjena pravom porukom sa servera
      const temp: ChatMessage = {
        id: `temp-${Date.now()}`,                    // Privremeni ID (kasnije će biti zamijenjen)
        content,                                      // Sadržaj poruke
        itemId,                                       // ID predmeta
        createdAt: new Date().toISOString(),          // Trenutno vrijeme
        sender: {
          id: currentUser?.id ?? 'me',                // ID trenutnog korisnika
          name: currentUser?.name ?? null,            // Ime trenutnog korisnika
          email: currentUser?.email ?? 'ja@me',       // Email trenutnog korisnika
        },
        recipient: {
          id: 'temp-recipient',                       // Privremeni ID primaoca
          name: null,                                 // Ne znamo ime primaoca
          email: 'temp@recipient.com',                // Privremeni email
        },
      };

      console.log('useSendMessage - Created temp message:', temp);
      
      // ========================================
      // DODAJ PRIVREMENU PORUKU U CACHE - KORISNIK VIDI PORUKU ODMAH
      // ========================================
      // setQueryData direktno ažurira cache bez poziva servera
      // Korisnik vidi poruku odmah, što daje bolje korisničko iskustvo
      qc.setQueryData<ChatMessage[]>(key, (old) => (old ? [...old, temp] : [temp]));

      // ========================================
      // VRATI KONTEKST - ZA ROLLBACK I ZAMJENU
      // ========================================
      // Ovi podaci će nam trebati u onSuccess i onError
      return { prev, tempId: temp.id };
    },
    
    // ========================================
    // USPJEŠNO SLANJE - ZAMIJENI PRIVREMENU PORUKU PRAVOM
    // ========================================
    // onSuccess se poziva kada server uspješno odgovori
    // Sada trebamo zamijeniti privremenu poruku pravom
    onSuccess: (serverMsg, _vars, ctx) => {
      const key = ['item-messages', itemId, otherUserId];
      
      // ========================================
      // DEBUG LOGGING
      // ========================================
      console.log('useSendMessage - onSuccess called:', { 
        serverMsg, 
        tempId: ctx?.tempId, 
        key 
      });
      
      // ========================================
      // AŽURIRAJ CACHE - UKLONI PRIVREMENU, DODAJ SERVER PORUKU
      // ========================================
      qc.setQueryData<ChatMessage[]>(key, (old) => {
        if (!old) return [serverMsg];  // Ako nema starih poruka, vrati samo server poruku
        
        // ========================================
        // DEBUG LOGGING OLD DATA
        // ========================================
        console.log('useSendMessage - Old data from cache:', old);
        
        // ========================================
        // UKLONI PRIVREMENU PORUKU - PO TEMP ID-U
        // ========================================
        // filter() kreira novi niz bez privremene poruke
        const filtered = old.filter((m) => m.id !== ctx?.tempId);
        
        // ========================================
        // DEBUG LOGGING FILTERED DATA
        // ========================================
        console.log('useSendMessage - Data after filtering temp message:', filtered);
        
        // ========================================
        // DODAJ SERVER PORUKU - S PRAVIM ID-OM I PODACIMA
        // ========================================
        // Sada imamo poruku sa pravim ID-om i svim podacima sa servera
        const newMessages = [...filtered, serverMsg];
        
        // ========================================
        // DEBUG LOGGING NEW MESSAGES
        // ========================================
        console.log('useSendMessage - New messages array:', newMessages);
        
        // ========================================
        // SORTIRAJ PO VREMENU - OSIGURAJ PRAVILAN REDOSLIJED
        // ========================================
        // Poruke moraju biti sortirane po vremenu kreiranja
        const sortedMessages = newMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // ========================================
        // DEBUG LOGGING FINAL RESULT
        // ========================================
        console.log('useSendMessage - Final sorted messages, count:', sortedMessages.length);
        
        return sortedMessages;
      });
    },
    
    // ========================================
    // GREŠKA PRI SLANJU - VRATI STARO STANJE
    // ========================================
    // onError se poziva ako dođe do greške pri slanju
    // U tom slučaju trebamo vratiti stare podatke
    onError: (_err, _vars, ctx) => {
      const key = ['item-messages', itemId, otherUserId];
      
      // ========================================
      // DEBUG LOGGING
      // ========================================
      console.log('useSendMessage - onError called:', { 
        error: _err, 
        context: ctx, 
        key 
      });
      
      // ========================================
      // ROLLBACK - VRATI STARO STANJE AKO GA IMAMO
      // ========================================
      // Ako imamo stare podatke, vratimo ih
      // Ovo će ukloniti privremenu poruku koju smo dodali
      if (ctx?.prev) {
        console.log('useSendMessage - Rolling back to previous data');
        qc.setQueryData(key, ctx.prev);
      } else {
        console.log('useSendMessage - No previous data to rollback to');
      }
      
      // ========================================
      // USER FEEDBACK - PRIKAŽI GREŠKU KORISNIKU
      // ========================================
      // toast je biblioteka za prikazivanje notifikacija
      // Korisnik će vidjeti da je došlo do greške
      toast.error('Slanje poruke nije uspjelo.');
    },
  });
}
