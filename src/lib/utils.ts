import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import prisma from "./prisma"

// Utility function to combine CSS classes with Tailwind CSS
// This helps merge conflicting Tailwind classes properly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Main function to update rental status for ALL items in the database
// This is used for bulk updates and cleanup operations
export async function updateItemRentalStatus() {
  try {
    // STEP 1: Find items that should be marked as "rented"
    // These are items with approved bookings that are currently active
    // "Active" means today falls between the start and end date of the booking
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
      select: { id: true } // Only get the ID to save memory
    });

    // STEP 2: Find items that should be DELETED
    // These are items with approved bookings where the rental period has ended
    // "Ended" means the end date is in the past
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
    // We must delete in a specific order due to database foreign key constraints
    let deletedCount = 0;
    if (itemsToDelete.length > 0) {
      
      // Delete bookings first - we can't delete an item if it has bookings
      // This is because of database foreign key constraints (referential integrity)
      await prisma.booking.deleteMany({
        where: {
          itemId: { in: itemsToDelete.map(item => item.id) }
        }
      });

      // Delete notifications related to these items
      // Clean up any notifications about these items to avoid orphaned data
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
      // Now it's safe to delete because all related data has been removed
      const deleteResult = await prisma.item.deleteMany({
        where: {
          id: { in: itemsToDelete.map(item => item.id) }
        }
      });
      
      deletedCount = deleteResult.count;
    }

    // Log the results for monitoring
    console.log(`Updated ${itemsToRent.length} items to rented, deleted ${deletedCount} expired items`);
    
    // Return summary of what was done
    return { rented: itemsToRent.length, deleted: deletedCount };
  } catch (error) {
    console.error('Error updating item rental status:', error);
    return { rented: 0, deleted: 0 };
  }
}

// Function to update rental status for a SINGLE item
// This is used when a specific item's booking status changes
export async function updateItemRentalStatusForItem(itemId: string) {
  try {
    // Check if this item has any active approved bookings
    // "Active" means today falls between start and end date
    const activeBooking = await prisma.booking.findFirst({
      where: {
        itemId,
        status: 'APPROVED',
        AND: [
          { startDate: { lte: new Date() } }, // Start date is today or in the past
          { endDate: { gte: new Date() } }    // End date is today or in the future
        ]
      }
    });

    // Check if this item has any expired approved bookings
    // "Expired" means the end date is in the past
    const expiredBooking = await prisma.booking.findFirst({
      where: {
        itemId,
        status: 'APPROVED',
        endDate: { lt: new Date() } // End date is in the past
      }
    });

    // If there are expired bookings, delete the item completely
    if (expiredBooking) {
      // Delete all related data in the correct order (due to foreign key constraints)
      
      // Delete all bookings for this item first
      await prisma.booking.deleteMany({
        where: { itemId }
      });

      // Delete all notifications related to this item
      await prisma.notification.deleteMany({
        where: { itemId }
      });

      // Delete all messages related to this item
      await prisma.message.deleteMany({
        where: { itemId }
      });

      // Finally delete the item itself
      await prisma.item.delete({
        where: { id: itemId }
      });

      return 'deleted'; // Return special value to indicate item was deleted
    } else {
      // If no expired bookings, just update the rental status
      // Mark as rented if there's an active booking, available if not
      await prisma.item.update({
        where: { id: itemId },
        data: { isRented: !!activeBooking }
      });

      return !!activeBooking; // Return true if rented, false if available
    }
  } catch (error) {
    console.error('Error updating item rental status for item:', error);
    return false;
  }
}

// Simple automatic cleanup function that can be called from anywhere
// This ensures expired items are deleted whenever the app is used
export async function automaticCleanup() {
  try {
    // Find items that should be deleted (expired rentals)
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
      
      console.log(`🔄 Automatic cleanup: Deleted ${itemsToDelete.length} expired items`);
      return itemsToDelete.length;
    }
    
    return 0;
  } catch (error) {
    console.error('Error in automatic cleanup:', error);
    return 0;
  }
}
