import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET endpoint: Shows current rental status statistics
// This helps us see how many items are rented vs available
export async function GET(request: NextRequest) {
  try {
    // Count how many items are currently rented
    const rentedItems = await prisma.item.count({
      where: { isRented: true }
    });

    // Count how many items are available for rent
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

// POST endpoint: Updates rental status and deletes expired items
// This is the main function that cleans up expired rentals
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Find items that should be marked as "rented"
    // These are items with approved bookings that are currently active (today falls between start and end date)
    const itemsToRent = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            AND: [
              { startDate: { lte: new Date() } }, // Start date is today or in the past
              { endDate: { gte: new Date() } }    // End date is today or in the future
            ]
          }
        }
      },
      select: { id: true } // Only get the ID, we don't need other data
    });

    // STEP 2: Find items that should be DELETED
    // These are items with approved bookings where the end date has passed (rental period is over)
    const itemsToDelete = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past (rental has ended)
          }
        }
      },
      select: { id: true } // Only get the ID
    });

    // STEP 3: Update items to "rented" status
    // Mark items as rented if they have active bookings
    if (itemsToRent.length > 0) {
      await prisma.item.updateMany({
        where: {
          id: { in: itemsToRent.map(item => item.id) }
        },
        data: { isRented: true }
      });
    }

    // STEP 4: Delete expired items and all their related data
    // We need to delete in a specific order due to database relationships (foreign keys)
    let deletedCount = 0;
    if (itemsToDelete.length > 0) {
      
      // Delete bookings first - we can't delete an item if it has bookings
      // This is because of database foreign key constraints
      await prisma.booking.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Delete notifications related to these items
      // Clean up any notifications about these items
      await prisma.notification.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Delete messages related to these items
      // Clean up any chat messages about these items
      await prisma.message.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Finally delete the items themselves
      // Now it's safe to delete because all related data is gone
      const deleteResult = await prisma.item.deleteMany({
        where: {
          id: { in: itemsToDelete.map(item => item.id) }
        }
      });
      
      deletedCount = deleteResult.count;
    }

    // Return success response with summary
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