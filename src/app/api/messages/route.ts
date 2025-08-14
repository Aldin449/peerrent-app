import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '../../../../src/lib/prisma';
import { pusherServer } from '../../../../src/lib/pusher';

// ========================================
// API RUTA ZA PORUKE - GLAVNI KONTROLER
// ========================================
// Ova ruta je SRŽ cijelog sistema poruka - sve poruke idu kroz nju
// Imamo dvije glavne metode:
// 1. POST - za slanje nove poruke
// 2. GET - za dohvaćanje postojećih poruka

// ========================================
// POST METODA - SLANJE NOVE PORUKE
// ========================================
// Ova metoda se poziva kada korisnik želi poslati poruku
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // KORAK 1: DOHVAĆANJE SESIJE
    // ========================================
    // Provjeravamo da li je korisnik ulogovan
    // auth() funkcija dohvaća podatke o trenutnoj sesiji
    const session = await auth();
    if (!session?.user?.id) {
      // Ako nema sesije, vratimo grešku 401 (Unauthorized)
      return NextResponse.json({ error: 'Niste autorizovani' }, { status: 401 });
    }

    // ========================================
    // KORAK 2: PARSIRANJE PODATAKA
    // ========================================
    // Iz request body-ja izvlačimo podatke koje je korisnik poslao
    // request.json() pretvara JSON string u JavaScript objekat
    const { itemId, content, recipientId } = await request.json();
    
    // ========================================
    // KORAK 3: VALIDACIJA PODATAKA
    // ========================================
    // Provjeravamo da li su svi potrebni podaci prisutni
    // itemId = ID predmeta o kojem se razgovara
    // content = sadržaj poruke
    // recipientId = ID korisnika koji prima poruku
    if (!itemId || !content || !recipientId) {
      return NextResponse.json(
        { error: 'Nedostaju potrebni podaci: itemId, content, recipientId' }, 
        { status: 400 }
      );
    }

    // ========================================
    // KORAK 4: PROVJERA POSTOJANJA PREDMETA
    // ========================================
    // Provjeravamo da li predmet zaista postoji u bazi
    // select: { ownerId: true } znači da dohvaćamo samo ownerId (štedimo bandwidth)
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { ownerId: true } // Samo nam treba ownerId za provjeru
    });

    if (!item) {
      return NextResponse.json({ error: 'Predmet nije pronađen' }, { status: 404 });
    }

    // ========================================
    // KORAK 5: PROVJERA AUTORIZACIJE
    // ========================================
    // Samo vlasnik predmeta ili kupac mogu slati poruke
    // isOwner = da li je trenutni korisnik vlasnik predmeta
    // isRecipient = da li je trenutni korisnik primalac poruke
    const isOwner = session.user.id === item.ownerId;
    const isRecipient = session.user.id === recipientId;
    
    // Ako nije ni vlasnik ni primalac, ne može slati poruke
   /* if (!isOwner && !isRecipient) {
      return NextResponse.json(
        { error: 'Niste autorizovani da slate poruke za ovaj predmet' }, 
        { status: 403 }
      );
    }*/

    // ========================================
    // KORAK 6: DEBUG LOGGING
    // ========================================
    console.log('API Debug - POST message:', {
      itemId,
      content: content.trim(),
      senderId: session.user.id,
      recipientId,
      sessionUser: session.user
    });

    // ========================================
    // KORAK 7: KREIRANJE PORUKE U BAZI
    // ========================================
    // Sada kreiramo poruku u bazi podataka
    // Prisma ORM automatski generiše SQL INSERT naredbu
    const message = await prisma.message.create({
      data: {
        content: content.trim(),           // Sadržaj poruke (trim() uklanja whitespace)
        itemId,                           // ID predmeta o kojem se razgovara
        senderId: session.user.id,        // ID pošiljaoca (trenutni korisnik)
        recipientId,                      // ID primaoca poruke
      },
      include: {
        // ========================================
        // DOHVAĆANJE POVEZANIH PODATAKA
        // ========================================
        // include znači da ćemo dohvatiti i podatke o pošiljaocu i primaocu
        // Ovo je potrebno za slanje preko Pushera (real-time)
        sender: {
          select: {
            id: true,      // ID pošiljaoca
            name: true,    // Ime pošiljaoca
            email: true,   // Email pošiljaoca
          },
        },
        recipient: {
          select: {
            id: true,      // ID primaoca
            name: true,    // Ime primaoca
            email: true,   // Email primaoca
          },
        },
      },
    });

    // ========================================
    // KORAK 8: REAL-TIME OBJAVLJIVANJE
    // ========================================
    // Pusher je servis koji omogućava real-time komunikaciju
    // trigger() šalje događaj svim korisnicima koji slušaju taj kanal
    // `item-${itemId}` je ime kanala (svaki predmet ima svoj kanal)
    // 'new-message' je ime događaja
    await pusherServer.trigger(`item-${itemId}`, 'new-message', {
      id: message.id,                    // ID poruke
      content: message.content,          // Sadržaj poruke
      itemId: message.itemId,            // ID predmeta
      createdAt: message.createdAt.toISOString(), // Vrijeme kreiranja (ISO format)
      sender: message.sender,            // Podaci o pošiljaocu
      recipient: message.recipient,      // Podaci o primaocu
    });

    // ========================================
    // KORAK 9: USPJEŠAN ODGOVOR
    // ========================================
    // Vraćamo kreiranu poruku korisniku
    // NextResponse.json() automatski postavlja Content-Type: application/json
    return NextResponse.json(message);
    
  } catch (error) {
    // ========================================
    // GREŠKA - ERROR HANDLING
    // ========================================
    // Ako dođe do bilo kakve greške, uhvatimo je i vratimo korisniku
    console.error('Greška pri slanju poruke:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju poruke' }, 
      { status: 500 }
    );
  }
}

// ========================================
// GET METODA - DOHVAĆANJE PORUKA
// ========================================
// Ova metoda se poziva kada korisnik želi vidjeti postojeće poruke
export async function GET(request: NextRequest) {
  try {
    // ========================================
    // KORAK 1: DOHVAĆANJE SESIJE
    // ========================================
    // Ista provjera kao i u POST metodi
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niste autorizovani' }, { status: 401 });
    }

    // ========================================
    // KORAK 2: PARSIRANJE URL PARAMETARA
    // ========================================
    // searchParams dohvaća parametre iz URL-a (npr. ?itemId=123&otherUserId=456)
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');           // ID predmeta (OBAVEZAN)
    const otherUserId = searchParams.get('otherUserId'); // ID drugog korisnika (OPCIONALAN)
    
    // ========================================
    // KORAK 3: VALIDACIJA PARAMETARA
    // ========================================
    // itemId je obavezan - bez njega ne možemo dohvatiti poruke
    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId je obavezan parametar' }, 
        { status: 400 }
      );
    }

    // ========================================
    // KORAK 4: PROVJERA POSTOJANJA PREDMETA
    // ========================================
    // Ista provjera kao i u POST metodi
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { ownerId: true }
    });

    if (!item) {
      return NextResponse.json({ error: 'Predmet nije pronađen' }, { status: 404 });
    }

    // ========================================
    // KORAK 5: PROVJERA AUTORIZACIJE
    // ========================================
    // Samo vlasnik predmeta ili kupac mogu vidjeti poruke
    const isOwner = session.user.id === item.ownerId;
    const isRecipient = session.user.id === otherUserId;
    
    /*if (!isOwner && !isRecipient) {
      return NextResponse.json(
        { error: 'Niste autorizovani da vidite poruke za ovaj predmet' }, 
        { status: 403 }
      );
    }*/

    // ========================================
    // KORAK 6: KONSTRUIRANJE QUERY-A - FLEKSIBILNO
    // ========================================
    // Različito ponašanje ovisno o tome da li je otherUserId prisutan
    
    let whereClause: any;
    
    if (otherUserId) {
      // ========================================
      // SPECIFIČAN RAZGOVOR - između dva korisnika
      // ========================================
      // otherUserId postoji = tražimo poruke između dva specifična korisnika
      whereClause = {
        itemId,  // Mora biti za taj predmet
        OR: [    // OR znači "ILI" - jedna od ove dvije uslove mora biti ispunjena
          // Uslov 1: Poruke koje je trenutni korisnik poslao otherUserId-u
          {
            senderId: session.user.id,      // Pošiljaoc je trenutni korisnik
            recipientId: otherUserId,       // Primalac je otherUserId
          },
          // Uslov 2: Poruke koje je otherUserId poslao trenutnom korisniku
          {
            senderId: otherUserId,          // Pošiljaoc je otherUserId
            recipientId: session.user.id,   // Primalac je trenutni korisnik
          },
        ],
      };
    } else {
      // ========================================
      // VLASNIK PREDMETA - vidi sve poruke za taj predmet
      // ========================================
      // Ako nema otherUserId, samo vlasnik može vidjeti sve poruke
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Samo vlasnik predmeta može vidjeti sve poruke' }, 
          { status: 403 }
        );
      }
      
      // Vlasnik vidi sve poruke gdje je on pošiljaoc ILI primalac
      whereClause = {
        itemId,
        OR: [
          { senderId: session.user.id },    // Poruke koje je vlasnik poslao
          { recipientId: session.user.id }, // Poruke koje je vlasnik primio
        ],
      };
    }

    // ========================================
    // KORAK 7: DEBUG LOGGING
    // ========================================
    console.log('API Debug - GET messages:', {
      itemId,
      otherUserId,
      currentUserId: session.user.id,
      isOwner,
      whereClause,
    });

    // ========================================
    // KORAK 7: DOHVAĆANJE PORUKA
    // ========================================
    // Sada dohvaćamo poruke iz baze podataka
    const messages = await prisma.message.findMany({
      where: {
        ...whereClause,
        AND: [
          {
            sender: {
              isDeleted: false
            }
          },
          {
            recipient: {
              isDeleted: false
            }
          }
        ]
      },
      orderBy: { createdAt: 'asc' }, // Starije poruke prvo
      include: {
        // ========================================
        // DOHVAĆANJE POVEZANIH PODATAKA
        // ========================================
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
    });

    // ========================================
    // KORAK 9: DEBUG LOGGING REZULTATA
    // ========================================
    console.log('API Debug - Messages found:', {
      count: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        content: m.content.substring(0, 50) + '...',
        senderId: m.senderId,
        recipientId: m.recipientId,
        itemId: m.itemId,
        createdAt: m.createdAt
      }))
    });

    // ========================================
    // KORAK 10: USPJEŠAN ODGOVOR
    // ========================================
    // Vraćamo listu poruka korisniku
    return NextResponse.json(messages);
    
  } catch (error) {
    // ========================================
    // GREŠKA - ERROR HANDLING
    // ========================================
    // Ista logika kao i u POST metodi
    console.error('Greška pri dohvaćanju poruka:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju poruka' }, 
      { status: 500 }
    );
  }
}
