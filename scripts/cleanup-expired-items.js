const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance to connect to the database
const prisma = new PrismaClient();

// Main function to clean up expired items
// This script finds and deletes items whose rental period has ended
async function cleanupExpiredItems() {
  try {
    console.log('Starting cleanup of expired items...');

    // STEP 1: Find all items that should be deleted
    // These are items with approved bookings where the end date has passed
    const itemsToDelete = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past (rental has ended)
          }
        }
      },
      select: { 
        id: true,        // Item ID
        title: true,     // Item title for logging
        Booking: {
          where: {
            status: 'APPROVED',
            endDate: { lt: new Date() } // Only get expired bookings
          },
          select: {
            endDate: true // When the rental ended
          }
        }
      }
    });

    // STEP 2: Show what will be deleted (for transparency)
    console.log(`Found ${itemsToDelete.length} items to delete:`);
    itemsToDelete.forEach(item => {
      console.log(`- ${item.title} (ID: ${item.id}) - Ended: ${item.Booking[0]?.endDate}`);
    });

    // If no items to delete, exit early
    if (itemsToDelete.length === 0) {
      console.log('No expired items found.');
      return;
    }

    // STEP 3: Delete all related data in the correct order
    // We must delete in this order due to database foreign key constraints
    
    // Delete bookings first - we can't delete an item if it has bookings
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Delete notifications related to these items
    // Clean up any notifications about these items
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Delete messages related to these items
    // Clean up any chat messages about these items
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Finally delete the items themselves
    // Now it's safe to delete because all related data has been removed
    const deletedItems = await prisma.item.deleteMany({
      where: {
        id: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // STEP 4: Show summary of what was deleted
    console.log('\nCleanup completed successfully!');
    console.log(`- Deleted ${deletedItems.count} items`);
    console.log(`- Deleted ${deletedBookings.count} bookings`);
    console.log(`- Deleted ${deletedNotifications.count} notifications`);
    console.log(`- Deleted ${deletedMessages.count} messages`);

  } catch (error) {
    // If anything goes wrong, show the error
    console.error('Error during cleanup:', error);
  } finally {
    // Always close the database connection when done
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupExpiredItems(); 