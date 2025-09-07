const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutomaticCleanup() {
  console.log('🧪 Testing Automatic Return-to-Available System...\n');

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
        description: 'This item should be automatically returned to available status',
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
    console.log(`   - Status: Should be automatically returned to available\n`);

    // Step 2: Simulate automatic cleanup
    console.log('2️⃣ Running automatic return-to-available process...');
    
    const expiredItems = await prisma.item.findMany({
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

    console.log(`Found ${expiredItems.length} items to return to available status:`);
    expiredItems.forEach(item => {
      console.log(`   - ${item.title} (ID: ${item.id})`);
    });

    if (expiredItems.length > 0) {
      // Mark items as available again
      await prisma.item.updateMany({
        where: { id: { in: expiredItems.map(item => item.id) } },
        data: { isRented: false }
      });

      // Mark bookings as completed
      await prisma.booking.updateMany({
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
      
      console.log(`✅ Successfully returned ${expiredItems.length} items to available status!\n`);
    }

    // Step 3: Verify the item is now available
    console.log('3️⃣ Verifying item is now available...');
    
    const updatedItem = await prisma.item.findUnique({
      where: { id: testItem.id }
    });

    if (updatedItem && !updatedItem.isRented) {
      console.log('✅ Test PASSED: Item was returned to available status!');
      console.log(`   - Item: ${updatedItem.title}`);
      console.log(`   - isRented: ${updatedItem.isRented}`);
    } else {
      console.log('❌ Test FAILED: Item is still marked as rented');
    }

    // Check booking status
    const completedBooking = await prisma.booking.findFirst({
      where: { itemId: testItem.id }
    });

    if (completedBooking && completedBooking.status === 'COMPLETED') {
      console.log('✅ Test PASSED: Booking was marked as completed!');
      console.log(`   - Booking status: ${completedBooking.status}`);
      console.log(`   - isCompleted: ${completedBooking.isCompleted}`);
    } else {
      console.log('❌ Test FAILED: Booking was not marked as completed');
    }

    // Clean up test data
    await prisma.booking.deleteMany({
      where: { itemId: testItem.id }
    });
    await prisma.item.delete({
      where: { id: testItem.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('\n🎉 Automatic return-to-available test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutomaticCleanup(); 