'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useItemMessages } from '../hooks/useItemMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import type { ChatMessage } from '../hooks/useItemMessages';
import { Send, MessageCircle } from 'lucide-react';

// ========================================
// MESSAGE INTERFACE KOMPONENTA - GLAVNI CHAT INTERFACE
// ========================================
// Ova komponenta je SRŽ cijelog sistema poruka u UI-u
// Ona se ponaša različito ovisno o tome da li je otherUserId definisan ili ne

// ========================================
// PROPS INTERFACE - PODACI KOJE KOMPONENTA PRIMA
// ========================================
interface MessageInterfaceProps {
  itemId: string;                    // ID predmeta o kojem se razgovara
  itemTitle: string;                 // Naslov predmeta za prikaz u header-u
  otherUserId?: string;              // ID korisnika s kojim razgovaramo (OPCIONALNO!)
  otherUserName?: string;            // Ime korisnika s kojim razgovaramo
  otherUserEmail?: string;           // Email korisnika s kojim razgovaramo
  isOpen: boolean;                   // Da li je chat otvoren
  setIsOpen: (isOpen: boolean) => void; // Funkcija za otvaranje/zatvaranje chat-a
}

// ========================================
// GLAVNA KOMPONENTA
// ========================================
export default function MessageInterface({ 
  itemId, 
  itemTitle, 
  otherUserId, 
  otherUserName, 
  otherUserEmail,
  isOpen,
  setIsOpen
}: MessageInterfaceProps) {
  // ========================================
  // HOOKS - DOHVAĆANJE PODATAKA I FUNKCIONALNOSTI
  // ========================================
  const { data: session } = useSession();                    // Trenutni korisnik (NextAuth)           // Da li je chat otvoren (local state)
  const [message, setMessage] = useState('');               // Tekst poruke koju pišemo (local state)
  const messagesEndRef = useRef<HTMLDivElement>(null);      // Referenca za scroll na dno
  
  // ========================================
  // CUSTOM HOOKS - LOGIKA IZ EXTERNAL FAJLOVA
  // ========================================
  // DOHVAĆANJE PORUKA - hook koji dohvaća poruke i sluša real-time događaje
  // otherUserId je opcionalan - ako postoji, dohvaćamo specifičan razgovor
  // Ako ne postoji, vlasnik vidi sve poruke za taj predmet
  const { data: messages = [], isLoading } = useItemMessages(itemId, otherUserId);
  
  // HOOK ZA SLANJE PORUKA - optimistična ažuriranja + server komunikacija
  // Možemo slati samo ako imamo otherUserId (specifičan primaoca)
  const sendMessage = useSendMessage(itemId, otherUserId, session?.user);
  
  // ========================================
  // IZVEDENE VARIJABLE - FLEKSIBILNO
  // ========================================
  const currentUserId = session?.user?.id;                  // ID trenutnog korisnika
  
  // Možemo slati poruke samo ako imamo primaoca (otherUserId)
  // Ako nema otherUserId, vlasnik vidi sve poruke ali ne može slati
  const canSendMessage = !!otherUserId;                     // Možemo slati samo ako imamo primaoca
  
  // ========================================
  // PORUKE ZA PRIKAZ - API VEĆ FILTRIRA, NE TREBAMO RUČNO
  // ========================================
  const conversationMessages = messages;
  
  // ========================================
  // DEBUG LOG - VIDIMO ŠTA SE DEŠAVA
  // ========================================
  console.log('MessageInterface debug:', {
    itemId,
    otherUserId,
    otherUserName,
    otherUserEmail,
    currentUserId,
    messagesCount: messages.length,
    conversationMessagesCount: conversationMessages.length,
    messages: messages.map(m => ({
      id: m.id,
      content: m.content.substring(0, 50) + '...',
      senderId: m.sender.id,
      recipientId: m.recipient.id,
      createdAt: m.createdAt
    })),
    isLoading
  });

  // ========================================
  // FUNKCIJA ZA SCROLL NA DNO - AUTOMATSKI SCROLL
  // ========================================
  // Ova funkcija se poziva kada se pojave nove poruke
  // scrollIntoView() automatski skroluje na taj element
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========================================
  // EFEKT - SCROLL NA DNO SVAKI PUT KADA SE PROMIJENE PORUKE
  // ========================================
  // useEffect se poziva svaki put kada se promijeni conversationMessages
  // Ovo osigurava da korisnik uvijek vidi najnovije poruke
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // ========================================
  // GLAVNA FUNKCIJA ZA SLANJE PORUKE
  // ========================================
  const handleSendMessage = async () => {
    // ========================================
    // PROVJERE - DA LI MOŽEMO SLATI
    // ========================================
    if (!message.trim() || !currentUserId) return;

    // ========================================
    // KLJUČNA PROVJERA - MOŽEMO LI SLATI PORUKU?
    // ========================================
    // Možemo slati samo ako imamo otherUserId (specifičan primaoca)
    if (!otherUserId) {
      console.log('Ne može slati poruku: nema primaoca (otherUserId).');
      return;
    }
    
    console.log('Slanje poruke:', {
      itemId,
      content: message.trim(),
      recipientId: otherUserId,
      currentUserId
    });

    try {
      // ========================================
      // POZIV HOOK-A - HOOK ĆE SE POBRINUTI ZA OPTIMISTIČNA AŽURIRANJA
      // ========================================
      const result = await sendMessage.mutateAsync({
        itemId,
        content: message.trim(),
        recipientId: otherUserId
      });
      console.log('Poruka uspješno poslana:', result);
      setMessage(''); // Očisti input nakon uspješnog slanja
    } catch (error) {
      console.error('Greška pri slanju poruke:', error);
    }
  };

  // ========================================
  // HANDLER ZA ENTER TASTERU - SLANJE NA ENTER
  // ========================================
  // Shift+Enter = novi red, Enter = pošalji poruku
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();  // Sprječava default ponašanje (novi red)
      handleSendMessage(); // Poziva funkciju za slanje
    }
  };

  // ========================================
  // RANIJI RETURN - AKO NEMA SESIJE, NE PRIKAZUJ NIŠTA
  // ========================================
  if (!session?.user) {
    return null;
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* ========================================
          HEADER - PRIKAZUJE KONTEKST RAZGOVORA
          ======================================== */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between cursor-pointer"  onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <div>
              {/* ========================================
                  DINAMIČKI NASLOV - RAZLIČIT OVISNO O KONTEKSTU
                  ======================================== */}
              <h3 className="font-semibold text-gray-900">
                Razgovor o: {itemTitle}
              </h3>
              {/* ========================================
                  DINAMIČKI OPIS - OBJAŠNJAVA ŠTA KORISNIK VIDI
                  ======================================== */}
              <p className="text-sm text-gray-600">
                Razgovor s korisnikom: {otherUserName || otherUserEmail}
              </p>
            </div>
          </div>
          {/* ========================================
              TOGGLE BUTTON - OTVARA/ZATVARA CHAT
              ======================================== */}
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* ========================================
          GLAVNI DIO - PORUKE I INPUT (VIDLJIV SAMO AKO JE OTVOREN)
          ======================================== */}
      {isOpen && (
        <>
          {/* ========================================
              LISTA PORUKA - SCROLLABLE CONTAINER
              ======================================== */}
          <div className="h-96 overflow-y-auto px-6 py-4 space-y-4">
            {/* ========================================
                LOADING STANJE - DOK SE UČITAVAJU PORUKE
                ======================================== */}
            {isLoading ? (
              <div className="text-center text-gray-500">Učitavanje poruka...</div>
            ) : conversationMessages.length === 0 ? (
              /* ========================================
                  PRAZNO STANJE - RAZLIČITO OVISNO O KONTEKSTU
                  ======================================== */
              <div className="text-center text-gray-500">
                Još nema poruka. Pošaljite prvu poruku!
              </div>
            ) : (
              /* ========================================
                  LISTA PORUKA - MAPIRANJE KROZ SVE PORUKE
                  ======================================== */
              conversationMessages.map((msg: ChatMessage) => {
                // ========================================
                // ODREDI DA LI JE MOJA PORUKA - ZA STILIZIRANJE
                // ========================================
                const isMyMessage = msg.sender.id === currentUserId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* ========================================
                        BUBBLES - RAZLIČITI STILOVI ZA MOJE I TUĐE PORUKE
                        ======================================== */}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMyMessage
                          ? 'bg-blue-600 text-white'    // Moje poruke - plave
                          : 'bg-gray-100 text-gray-900' // Tuđe poruke - sive
                      }`}
                    >
                      <div className="flex flex-col">
                        {/* ========================================
                            PRIKAZ IMENA POŠILJAOCA - POJEDNOSTAVLJENO
                            ======================================== */}
                        {/* Uvijek prikaži ime pošiljaoca za tuđe poruke */}
                        {!isMyMessage && (
                          <p className="text-xs text-gray-500 mb-1">
                            Od: {msg.sender.name || msg.sender.email}
                          </p>
                        )}
                        
                        {/* ========================================
                            SADRŽAJ PORUKE
                            ======================================== */}
                        <p className="text-sm">{msg.content}</p>
                        
                        {/* ========================================
                            VRIJEME - FORMATIRANO NA HRVATSKI
                            ======================================== */}
                        <p className={`text-xs mt-1 ${
                          isMyMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString('hr-HR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {/* ========================================
                INVISIBLE DIV - ZA SCROLL NA DNO
                ======================================== */}
            {/* Ova div je nevidljiva ali omogućava scroll na dno */}
            <div ref={messagesEndRef} />
          </div>

          {/* ========================================
              INPUT SEKCIJA - OMOGUĆENA SAMO AKO MOŽEMO SLATI
              ======================================== */}
          <div className="border-t px-6 py-4">
            <div className="flex space-x-3">
              {/* ========================================
                  TEXTAREA - UNOS PORUKE
                  ======================================== */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canSendMessage ? "Napišite poruku..." : "Nema primaoca za poruku..."}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={sendMessage.isPending || !canSendMessage} // ONAMOGUĆENO ako ne možemo slati
              />
              
              {/* ========================================
                  DUGME ZA SLANJE
                  ======================================== */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessage.isPending || !canSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
