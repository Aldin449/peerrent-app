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
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        isDeleted: false
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Get all bookings where user is the renter (not the owner)
    const userRentals = await prisma.booking.findMany({
      where: {
        userId: user.id, // User is the one who rented the item
      },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({
      allRentals: formattedRentals,
      activeRentals,
      completedRentals,
      cancelledRentals,
      totalRentals: formattedRentals.length,
      totalActive: activeRentals.length,
      totalCompleted: completedRentals.length,
      totalCancelled: cancelledRentals.length
    });

  } catch (error) {
    console.error('Error fetching user rentals:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju vaših iznajmljivanja' }, { status: 500 });
  }
}
