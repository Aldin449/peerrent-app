const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance to connect to the database
const prisma = new PrismaClient();

// Main function to return expired items to available status
// This script finds items whose rental period has ended and makes them available again
async function cleanupExpiredItems() {
  try {
    console.log('Starting cleanup of expired items...');

    // STEP 1: Find all items that should be returned to available status
    // These are items with approved bookings where the end date has passed
    const expiredItems = await prisma.item.findMany({
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

    // STEP 2: Show what will be returned to available status (for transparency)
    console.log(`Found ${expiredItems.length} items to return to available status:`);
    expiredItems.forEach(item => {
      console.log(`- ${item.title} (ID: ${item.id}) - Ended: ${item.Booking[0]?.endDate}`);
    });

    // If no items to process, exit early
    if (expiredItems.length === 0) {
      console.log('No expired items found.');
      return;
    }

    // STEP 3: Return items to available status and mark bookings as completed
    
    // Mark items as available again (not rented)
    const updatedItems = await prisma.item.updateMany({
      where: {
        id: { in: expiredItems.map(item => item.id) }
      },
      data: { isRented: false }
    });

    // Mark expired bookings as completed
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        itemId: { in: expiredItems.map(item => item.id) },
        status: 'APPROVED',
        endDate: { lt: new Date() }
      },
      data: {
        status: 'COMPLETED',
        isCompleted: true,
        completedAt: new Date()
      }
    });

    // STEP 4: Show summary of what was processed
    console.log('\nCleanup completed successfully!');
    console.log(`- Returned ${updatedItems.count} items to available status`);
    console.log(`- Marked ${updatedBookings.count} bookings as completed`);

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