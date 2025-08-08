import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const rentedItems = await prisma.item.count({
      where: { isRented: true }
    });

    const availableItems = await prisma.item.count({
      where: { isRented: false }
    });

    return NextResponse.json({
      success: true,
      rentedItems,
      availableItems,
      totalItems: rentedItems + availableItems
    });

  } catch (error) {
    console.error('Error getting rental status:', error);
    return NextResponse.json(
      { error: 'Failed to get rental status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get all items that should be marked as rented (have active approved bookings)
    const itemsToRent = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            AND: [
              { startDate: { lte: new Date() } },
              { endDate: { gte: new Date() } }
            ]
          }
        }
      },
      select: { id: true }
    });

    // Get all items that should be deleted (rental period has ended)
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

    // Update items to rented status
    if (itemsToRent.length > 0) {
      await prisma.item.updateMany({
        where: {
          id: { in: itemsToRent.map(item => item.id) }
        },
        data: { isRented: true }
      });
    }

    // Delete items whose rental period has ended
    let deletedCount = 0;
    if (itemsToDelete.length > 0) {
      // Delete bookings first (due to foreign key constraints)
      await prisma.booking.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Delete notifications related to these items
      await prisma.notification.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Delete messages related to these items
      await prisma.message.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Finally delete the items
      const deleteResult = await prisma.item.deleteMany({
        where: {
          id: { in: itemsToDelete.map(item => item.id) }
        }
      });
      
      deletedCount = deleteResult.count;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${itemsToRent.length} items to rented, deleted ${deletedCount} expired items`,
      rented: itemsToRent.length,
      deleted: deletedCount
    });

  } catch (error) {
    console.error('Error updating rental status:', error);
    return NextResponse.json(
      { error: 'Failed to update rental status' },
      { status: 500 }
    );
  }
} 