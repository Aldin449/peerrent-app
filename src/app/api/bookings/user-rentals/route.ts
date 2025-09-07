import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
  }

  try {
    // Dohvati paginacijske parametre iz URL-a
    // page - trenutna stranica (default: 1)
    // limit - koliko stavki po stranici (default: 10)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Izračunaj skip vrijednost za Prisma query
    // skip = (trenutna_stranica - 1) * broj_stavki_po_stranici
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        isDeleted: false
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Dohvati ukupan broj rezervacija za paginaciju
    // Ovo je potrebno da znamo koliko stranica imamo ukupno
    const totalRentals = await prisma.booking.count({
      where: {
        userId: user.id, // Korisnik je onaj koji je iznajmio predmet
      }
    });

    // Dohvati rezervacije sa paginacijom
    // skip - preskoči prvih N stavki
    // take - uzmi samo N stavki
    const userRentals = await prisma.booking.findMany({
      where: {
        userId: user.id, // Korisnik je onaj koji je iznajmio predmet
      },
      orderBy: { createdAt: 'desc' }, // Sortiraj po datumu kreiranja (najnovije prvo)
      skip: skip, // Preskoči prvih N stavki
      take: limit, // Uzmi samo N stavki
      include: {
        item: {
          include: {
            user: {
              select: { name: true, email: true, profilePicture: true }
            }
          }
        }
      }
    });

    // Format the response
    const formattedRentals = userRentals.map(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = booking.item.pricePerDay * totalDays;
      
      return {
        id: booking.id,
        itemId: booking.item.id,
        itemTitle: booking.item.title,
        itemDescription: booking.item.description,
        itemLocation: booking.item.location,
        itemImages: booking.item.images ? JSON.parse(booking.item.images) : [],
        itemCategory: booking.item.category,
        ownerName: booking.item.user.name || 'Anoniman',
        ownerEmail: booking.item.user.email,
        ownerProfilePicture: booking.item.user.profilePicture,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        status: booking.status,
        isCompleted: booking.isCompleted,
        completedAt: booking.completedAt,
        totalDays,
        totalCost,
        pricePerDay: booking.item.pricePerDay
      };
    });

    // Separate active and completed rentals
    const activeRentals = formattedRentals.filter(rental => 
      rental.status === 'PENDING' || rental.status === 'APPROVED'
    );
    const completedRentals = formattedRentals.filter(rental => 
      rental.status === 'COMPLETED'
    );
    const cancelledRentals = formattedRentals.filter(rental => 
      rental.status === 'REJECTED' || rental.status === 'CANCELLED'
    );

    // Izračunaj paginacijske metapodatke
    const totalPages = Math.max(Math.ceil(totalRentals / limit), 1); // Minimalno 1 stranica
    const hasNextPage = page < totalPages; // Ima li sljedeću stranicu
    const hasPrevPage = page > 1; // Ima li prethodnu stranicu

    return NextResponse.json({
      // Paginirani podaci
      rentals: formattedRentals, // Samo trenutna stranica rezervacija
      
      // Paginacijski metapodaci
      pagination: {
        currentPage: page, // Trenutna stranica
        totalPages: totalPages, // Ukupan broj stranica
        totalRentals: totalRentals, // Ukupan broj rezervacija
        limit: limit, // Broj stavki po stranici
        hasNextPage: hasNextPage, // Ima li sljedeću stranicu
        hasPrevPage: hasPrevPage, // Ima li prethodnu stranicu
        nextPage: hasNextPage ? page + 1 : null, // Broj sljedeće stranice
        prevPage: hasPrevPage ? page - 1 : null // Broj prethodne stranice
      },
      
      // Kategorizirani podaci (samo za trenutnu stranicu)
      activeRentals,
      completedRentals,
      cancelledRentals,
      
      // Brojčani podaci za trenutnu stranicu
      totalActive: activeRentals.length,
      totalCompleted: completedRentals.length,
      totalCancelled: cancelledRentals.length
    });

  } catch (error) {
    console.error('Error fetching user rentals:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju vaših iznajmljivanja' }, { status: 500 });
  }
}
