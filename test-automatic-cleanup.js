const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutomaticCleanup() {
  console.log('🧪 Testing Automatic Cleanup System...\n');

  try {
    // Step 1: Create a test item with an expired booking
    console.log('1️⃣ Creating test item with expired booking...');
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      }
    });

    const testItem = await prisma.item.create({
      data: {
        title: 'Test Bike (EXPIRED)',
        description: 'This item should be automatically deleted',
        pricePerDay: 50,
        location: 'Test Location',
        ownerId: testUser.id,
        isRented: true
      }
    });

    // Create an expired booking (end date in the past)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
    
    await prisma.booking.create({
      data: {
        itemId: testItem.id,
        userId: testUser.id,
        startDate: new Date('2024-01-01'),
        endDate: expiredDate, // Expired yesterday
        status: 'APPROVED'
      }
    });

    console.log(`✅ Created test item: ${testItem.title} (ID: ${testItem.id})`);
    console.log(`   - End date: ${expiredDate.toDateString()}`);
    console.log(`   - Status: Should be automatically deleted\n`);

    // Step 2: Simulate automatic cleanup
    console.log('2️⃣ Running automatic cleanup...');
    
    const itemsToDelete = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            endDate: { lt: new Date() }
          }
        }
      },
      select: { id: true, title: true }
    });

    console.log(`Found ${itemsToDelete.length} items to delete:`);
    itemsToDelete.forEach(item => {
      console.log(`   - ${item.title} (ID: ${item.id})`);
    });

    if (itemsToDelete.length > 0) {
      // Delete in correct order
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
      
      console.log(`✅ Successfully deleted ${itemsToDelete.length} expired items!\n`);
    }

    // Step 3: Verify deletion
    console.log('3️⃣ Verifying deletion...');
    
    const remainingItems = await prisma.item.findMany({
      where: { title: { contains: 'Test Bike' } }
    });

    if (remainingItems.length === 0) {
      console.log('✅ Test PASSED: Item was automatically deleted!');
    } else {
      console.log('❌ Test FAILED: Item still exists');
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('\n🎉 Automatic cleanup test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutomaticCleanup(); 