import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

// This endpoint handles when an item owner approves or declines a booking request
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = await request.json();

  // Validate that status is either APPROVED or DECLINED
  if (!status || !['APPROVED', 'DECLINED'].includes(status)) {
    return NextResponse.json({ error: 'Neispravan status' }, { status: 400 });
  }

  try {
    // Get the booking with all related data (item, user details)
    // We need this to check permissions and send notifications
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            user: true
          }
        },
        user: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
    }

    // Security check: Only the item owner can approve/decline bookings
    if (booking.item.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Nemate dozvolu za ovu akciju' }, { status: 403 });
    }

    // Prevent double-processing: Only pending bookings can be updated
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Rezervacija je već obrađena' }, { status: 400 });
    }

    // Update the booking status (APPROVED or DECLINED)
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        item: true,
        user: true
      }
    });

    // STEP 1: Handle rental status updates based on the new booking status
    if (status === 'APPROVED') {
      // If booking is approved, check if it's currently active
      // A booking is "active" if today falls between start and end date
      const isCurrentlyActive = new Date() >= booking.startDate && new Date() <= booking.endDate;
      
      if (isCurrentlyActive) {
        // Mark the item as rented since it has an active approved booking
        await prisma.item.update({
          where: { id: booking.itemId },
          data: { isRented: true }
        });
      }
    } else if (status === 'DECLINED') {
      // If booking is declined, check if this was the only active booking
      // We need to see if there are any other approved bookings that are currently active
      const activeBookings = await prisma.booking.findMany({
        where: {
          itemId: booking.itemId,
          status: 'APPROVED',
          AND: [
            { startDate: { lte: new Date() } }, // Start date is today or in the past
            { endDate: { gte: new Date() } }    // End date is today or in the future
          ]
        }
      });

      // If no active bookings remain, check if any bookings have ended
      if (activeBookings.length === 0) {
        // Look for any approved bookings that have ended (past their end date)
        const expiredBookings = await prisma.booking.findMany({
          where: {
            itemId: booking.itemId,
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past
          }
        });

        if (expiredBookings.length > 0) {
          // STEP 2: Delete the item completely if it has expired bookings
          // This is the main deletion logic - if rental period is over, delete everything
          
          // Delete all bookings for this item first (due to database relationships)
          await prisma.booking.deleteMany({
            where: { itemId: booking.itemId }
          });

          // Delete all notifications related to this item
          await prisma.notification.deleteMany({
            where: { itemId: booking.itemId }
          });

          // Delete all messages related to this item
          await prisma.message.deleteMany({
            where: { itemId: booking.itemId }
          });

          // Finally delete the item itself
          await prisma.item.delete({
            where: { id: booking.itemId }
          });
        } else {
          // If no expired bookings, just mark the item as available
          await prisma.item.update({
            where: { id: booking.itemId },
            data: { isRented: false }
          });
        }
      }
    }

    // STEP 3: Create notification for the person who requested the booking
    const notificationMessage = status === 'APPROVED' 
      ? `Vaša rezervacija za "${booking.item.title}" je odobrena!`
      : `Vaša rezervacija za "${booking.item.title}" je odbijena.`;

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        message: notificationMessage,
        bookingId: booking.id,
        itemId: booking.itemId,
        startDate: booking.startDate,
        endDate: booking.endDate,
      }
    });

    // STEP 4: Send real-time notification using Pusher
    // This allows the user to see the notification immediately without refreshing
    await pusherServer.trigger(`user-${booking.user.email}`, 'booking-status-update', {
      message: notificationMessage,
      bookingId: booking.id,
      itemId: booking.itemId,
      status: status,
      itemTitle: booking.item.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: notificationMessage
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Greška prilikom ažuriranja statusa' },
      { status: 500 }
    );
  }
} 