import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = await request.json();

  if (!status || !['APPROVED', 'DECLINED'].includes(status)) {
    return NextResponse.json({ error: 'Neispravan status' }, { status: 400 });
  }

  try {
    // Get the booking with item and user details
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

    // Check if the current user is the owner of the item
    if (booking.item.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Nemate dozvolu za ovu akciju' }, { status: 403 });
    }

    // Check if booking is still pending
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Rezervacija je već obrađena' }, { status: 400 });
    }

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        item: true,
        user: true
      }
    });

    // Update the item's rental status based on the new booking status
    if (status === 'APPROVED') {
      // Check if this booking is currently active (overlaps with current date)
      const isCurrentlyActive = new Date() >= booking.startDate && new Date() <= booking.endDate;
      
      if (isCurrentlyActive) {
        await prisma.item.update({
          where: { id: booking.itemId },
          data: { isRented: true }
        });
      }
    } else if (status === 'DECLINED') {
      // Check if this was the only active booking for this item
      const activeBookings = await prisma.booking.findMany({
        where: {
          itemId: booking.itemId,
          status: 'APPROVED',
          AND: [
            { startDate: { lte: new Date() } },
            { endDate: { gte: new Date() } }
          ]
        }
      });

      // If no active bookings remain, check if any bookings have ended
      if (activeBookings.length === 0) {
        const expiredBookings = await prisma.booking.findMany({
          where: {
            itemId: booking.itemId,
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past
          }
        });

        if (expiredBookings.length > 0) {
          // Delete the item and all related data
          await prisma.booking.deleteMany({
            where: { itemId: booking.itemId }
          });

          await prisma.notification.deleteMany({
            where: { itemId: booking.itemId }
          });

          await prisma.message.deleteMany({
            where: { itemId: booking.itemId }
          });

          await prisma.item.delete({
            where: { id: booking.itemId }
          });
        } else {
          // Mark item as available if no expired bookings
          await prisma.item.update({
            where: { id: booking.itemId },
            data: { isRented: false }
          });
        }
      }
    }

    // Create notification for the requester
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

    // Send real-time notification to the requester
    await pusherServer.trigger(`user-${booking.user.email}`, 'booking-status-update', {
      message: notificationMessage,
      bookingId: booking.id,
      itemId: booking.itemId,
      status: status,
      itemTitle: booking.item.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
    });

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