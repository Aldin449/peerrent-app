const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupExpiredItems() {
  try {
    console.log('Starting cleanup of expired items...');

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
      select: { 
        id: true,
        title: true,
        Booking: {
          where: {
            status: 'APPROVED',
            endDate: { lt: new Date() }
          },
          select: {
            endDate: true
          }
        }
      }
    });

    console.log(`Found ${itemsToDelete.length} items to delete:`);
    itemsToDelete.forEach(item => {
      console.log(`- ${item.title} (ID: ${item.id}) - Ended: ${item.Booking[0]?.endDate}`);
    });

    if (itemsToDelete.length === 0) {
      console.log('No expired items found.');
      return;
    }

    // Delete bookings first (due to foreign key constraints)
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Delete notifications related to these items
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Delete messages related to these items
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        itemId: { in: itemsToDelete.map(item => item.id) }
      }
    });

    // Finally delete the items
    const deletedItems = await prisma.item.deleteMany({
      where: {
        id: { in: itemsToDelete.map(item => item.id) }
      }
    });

    console.log('\nCleanup completed successfully!');
    console.log(`- Deleted ${deletedItems.count} items`);
    console.log(`- Deleted ${deletedBookings.count} bookings`);
    console.log(`- Deleted ${deletedNotifications.count} notifications`);
    console.log(`- Deleted ${deletedMessages.count} messages`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupExpiredItems(); 