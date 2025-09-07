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

    // Get completed bookings (rental history)
    const rentalHistory = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      include: {
        item: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    // Format the response
    const formattedHistory = rentalHistory.map(booking => ({
      id: booking.id,
      itemTitle: booking.item.title,
      itemDescription: booking.item.description,
      itemLocation: booking.item.location,
      itemImages: booking.item.images ? JSON.parse(booking.item.images) : [],
      ownerName: booking.item.user.name || 'Anoniman',
      startDate: booking.startDate,
      endDate: booking.endDate,
      completedAt: booking.completedAt,
      totalDays: Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      totalCost: booking.item.pricePerDay * Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      history: formattedHistory,
      totalRentals: formattedHistory.length
    });

  } catch (error) {
    console.error('Error fetching rental history:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju istorije' }, { status: 500 });
  }
}
