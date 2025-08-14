import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface InboxItem {
  itemId: string;
  itemTitle: string;
}
// ========================================
// API RUTA ZA INBOX - LISTA KORISNIKA KOJI SU POSLALI PORUKE
// ========================================
// Ova ruta dohvaća sve korisnike koji su poslali poruke trenutnom korisniku
// Korisnik vidi listu svih korisnika s kojima je razgovarao

// ========================================
// GET METODA - DOHVAĆANJE INBOX-A
// ========================================
export async function GET(req: NextRequest) {
  try {
    // ========================================
    // KORAK 1: DOHVAĆANJE SESIJE
    // ========================================
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // ========================================
    // KORAK 2: DOHVAĆANJE SVIH PORUKA KOJE JE KORISNIK PRIMIO
    // ========================================
    const messages = await prisma.message.findMany({
      where: {
        recipientId: userId,  // Samo poruke koje je korisnik PRIMIO
        sender: {
          isDeleted: false // Exclude deleted users
        }
      },
      include: {
        sender: { 
          select: { 
            id: true,      // ID pošiljaoca
            name: true,    // Ime pošiljaoca
            email: true    // Email pošiljaoca
          }
        },
        item: { 
          select: { 
            id: true,      // ID predmeta
            title: true    // Naslov predmeta
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ========================================
    // KORAK 3: GRUPIRANJE PO KORISNICIMA (NE PO PREDMETIMA)
    // ========================================
    const usersMap = new Map();

    messages.forEach(message => {
      const senderId = message.senderId;
      
      if (!usersMap.has(senderId)) {
        // ========================================
        // NOVI KORISNIK - prvi put vidimo ovog pošiljaoca
        // ========================================
        usersMap.set(senderId, {
          userId: senderId,                    // ID korisnika
          userName: message.sender?.name ?? '',       // Ime korisnika
          userEmail: message.sender?.email ?? '',     // Email korisnika
          lastMessage: {                       // Podaci o zadnjoj poruci
            content: message.content,          // Sadržaj poruke
            createdAt: message.createdAt,      // Vrijeme poruke
            itemId: message.itemId,            // ID predmeta
            itemTitle: message.item.title      // Naslov predmeta
          },
          messageCount: 1,                     // Broj poruka od ovog korisnika
          items: [{                            // Lista predmeta o kojima je razgovarao
            itemId: message.itemId,
            itemTitle: message.item.title
          }]
        });
      } else {
        // ========================================
        // POSTOJEĆI KORISNIK - ažuriramo podatke
        // ========================================
        const userData = usersMap.get(senderId);
        
        // Ažuriramo zadnju poruku ako je ova novija
        if (new Date(message.createdAt) > new Date(userData.lastMessage.createdAt)) {
          userData.lastMessage = {
            content: message.content,
            createdAt: message.createdAt,
            itemId: message.itemId,
            itemTitle: message.item.title
          };
        }
        
        // Povećavamo broj poruka
        userData.messageCount += 1;
        
        // Dodajemo predmet ako već ne postoji
        const itemExists = userData.items.find((item: InboxItem) => item.itemId === message.itemId);
        if (!itemExists) {
          userData.items.push({
            itemId: message.itemId,
            itemTitle: message.item.title
          });
        }
      }
    });

    // ========================================
    // KORAK 4: KONVERTIRANJE U LISTU I SORTIRANJE
    // ========================================
    const inboxUsers = Array.from(usersMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    return NextResponse.json(inboxUsers);
    
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
