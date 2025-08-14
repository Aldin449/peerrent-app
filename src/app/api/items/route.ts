import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // AUTOMATIC CLEANUP: Delete expired items before showing user's items
  // This ensures users only see their items that are actually available
  try {
    const itemsToDelete = await prisma.item.findMany({
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

    if (itemsToDelete.length > 0) {
      // Delete in correct order due to foreign key constraints
      await prisma.booking.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.notification.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.message.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.item.deleteMany({
        where: { id: { in: itemsToDelete.map(item => item.id) } }
      });
      
      console.log(`Auto-deleted ${itemsToDelete.length} expired items from user items API`);
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
