import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  // AUTOMATIC CLEANUP: Return expired items to available status
  // This ensures items can be re-rented after their rental period ends
  try {
    const expiredItems = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past
          }
        }
      },
      select: { id: true }
    });

    if (expiredItems.length > 0) {
      // Mark items as available again (not rented)
      await prisma.item.updateMany({
        where: { id: { in: expiredItems.map(item => item.id) } },
        data: { isRented: false }
      });

      // Mark expired bookings as completed
      await prisma.booking.updateMany({
        where: { 
          itemId: { in: expiredItems.map(item => item.id) },
          status: 'APPROVED',
          endDate: { lt: new Date() }
        },
        data: { 
          status: BookingStatus.COMPLETED,
          isCompleted: true,
          completedAt: new Date()
        }
      });
      
      console.log(`Auto-returned ${expiredItems.length} expired items to available status from user items API`);
    }
  } catch (error) {
    console.error('Error in automatic cleanup:', error);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const session = await getServerSession(authOptions);

  const skip = (page - 1) * limit;

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Nisi logovan" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { 
      email: session.user.email,
      isDeleted: false
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Korisnik nije pronađen." }, { status: 404 });
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { 
        ownerId: user.id,
        // Only show items that are not rented
        isRented: false
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.item.count({
      where: { 
        ownerId: user.id,
        // Only show items that are not rented
        isRented: false
      },
    })
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  if (items.length === 0) {
    return NextResponse.json({ message: "Trenutno nemate nijedan item." }, { status: 200 });
  }

  return NextResponse.json({
    items,
    totalPages,
    page,
    total,
  });
}
