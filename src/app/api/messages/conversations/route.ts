import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ========================================
// API RUTA ZA KONVERZACIJE - LISTA RAZGOVORA
// ========================================
// Ova ruta dohvaća sve konverzacije za trenutnog korisnika
// Konverzacija = grupa poruka vezana za jedan predmet
// Korisnik vidi listu svih predmeta o kojima je razgovarao

// ========================================
// GET METODA - DOHVAĆANJE KONVERZACIJA
// ========================================
export async function GET(req: NextRequest) {
  try {
    // ========================================
    // KORAK 1: DOHVAĆANJE SESIJE
    // ========================================
    // Provjeravamo da li je korisnik ulogovan
    // getServerSession() je NextAuth funkcija za dohvaćanje sesije na serveru
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ========================================
    // KORAK 2: DOHVAĆANJE SVIH PORUKA KORISNIKA - POJEDNOSTAVLJENO
    // ========================================
    // Dohvaćamo sve poruke gdje je trenutni korisnik pošiljaoc ILI primalac
    const userId = session.user.id;

    // Prisma query - dohvaća poruke iz baze podataka
    const messages = await prisma.message.findMany({
      where: {
        // OR znači "ILI" - jedna od ove dvije uslove mora biti ispunjena
        OR: [
          { senderId: userId },      // Poruke koje je korisnik POSLAO
          { recipientId: userId }    // Poruke koje je korisnik PRIMIO
        ]
      },
      include: {
        // ========================================
        // DOHVAĆANJE POVEZANIH PODATAKA
        // ========================================
        // include znači da ćemo dohvatiti i podatke o korisnicima i predmetu
        sender: { 
          select: { 
            id: true,      // ID pošiljaoca
            name: true,    // Ime pošiljaoca
            email: true    // Email pošiljaoca
          } 
        },
        recipient: { 
          select: { 
            id: true,      // ID primaoca
            name: true,    // Ime primaoca
            email: true    // Email primaoca
          } 
        },
        item: { 
          select: { 
            id: true,      // ID predmeta
            title: true    // Naslov predmeta
          } 
        }
      },
      // ========================================
      // SORTIRANJE PORUKA
      // ========================================
      // orderBy: { createdAt: 'desc' } znači:
      // - desc = descending (opadajuće) = od najnovije do najstarije poruke
      // Ovo je važno jer želimo da najnoviji razgovori budu na vrhu liste
      orderBy: { createdAt: 'desc' }
    });

    // ========================================
    // KORAK 3: GRUPIRANJE PORUKA PO PREDMETIMA I KORISNICIMA - STVARNO 1-ON-1
    // ========================================
    // Sada trebamo grupisati poruke po predmetima I korisnicima da kreiramo stvarne 1-on-1 konverzacije
    // Map je JavaScript struktura podataka koja omogućava key-value parove
    const conversationsMap = new Map();

    // Prolazimo kroz svaku poruku i grupišemo je
    messages.forEach(message => {
      const itemId = message.itemId;  // ID predmeta
      
      // ========================================
      // ODREDIVANJE DRUGOG KORISNIKA - KLJUČNO ZA 1-ON-1
      // ========================================
      // otherUser = korisnik s kojim trenutni korisnik razgovara
      // Ako je trenutni korisnik pošiljaoc, otherUser je primalac
      // Ako je trenutni korisnik primalac, otherUser je pošiljaoc
      const otherUser = message.senderId === userId ? message.recipient : message.sender;
      
      // ========================================
      // KLJUČ ZA GRUPIRANJE - KOMBINACIJA PREDMETA I KORISNIKA
      // ========================================
      // Ovo je KLJUČNO - svaki razgovor je jedinstvena kombinacija predmeta + korisnika
      const conversationKey = `${itemId}-${otherUser.id}`;
      
      // ========================================
      // KREIRANJE ILI AŽURIRANJE KONVERZACIJE
      // ========================================
      if (!conversationsMap.has(conversationKey)) {
        // ========================================
        // NOVA KONVERZACIJA - prvi put vidimo ovu kombinaciju
        // ========================================
        conversationsMap.set(conversationKey, {
          itemId,                    // ID predmeta
          itemTitle: message.item.title,  // Naslov predmeta
          otherUser,                 // Podaci o drugom korisniku
          lastMessage: {             // Podaci o zadnjoj poruci
            content: message.content,        // Sadržaj poruke
            createdAt: message.createdAt,    // Vrijeme poruke
            senderId: message.senderId       // ID pošiljaoca
          },
          unreadCount: 0            // Broj nepročitanih poruka (za sada 0)
        });
      } else {
        // ========================================
        // POSTOJEĆA KONVERZACIJA - ažuriramo zadnju poruku
        // ========================================
        const conversation = conversationsMap.get(conversationKey);
        
        // Ažuriramo zadnju poruku ako je ova novija
        // new Date() pretvara string u Date objekat za poređenje
        if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
          conversation.lastMessage = {
            content: message.content,        // Sadržaj poruke
            createdAt: message.createdAt,    // Vrijeme poruke
            senderId: message.senderId       // ID pošiljaoca
          };
        }
      }
    });

    // ========================================
    // KORAK 4: KONVERTIRANJE U LISTU I SORTIRANJE
    // ========================================
    // Map.values() vraća sve vrijednosti iz Map-a
    // Array.from() pretvara to u običan niz
    const conversations = Array.from(conversationsMap.values())
      // ========================================
      // SORTIRANJE KONVERZACIJA
      // ========================================
      // Sortiramo po vremenu zadnje poruke (od najnovije do najstarije)
      // getTime() pretvara Date u broj (milisekunde od 1970.)
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    // ========================================
    // KORAK 5: USPJEŠAN ODGOVOR
    // ========================================
    // Vraćamo listu konverzacija korisniku
    return NextResponse.json(conversations);
    
  } catch (error) {
    // ========================================
    // GREŠKA - ERROR HANDLING
    // ========================================
    // Ako dođe do bilo kakve greške, uhvatimo je i vratimo korisniku
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
