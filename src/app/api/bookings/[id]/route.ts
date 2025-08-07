import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { pusherServer } from '@/lib/pusher';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params;
    const { status } = await request.json();

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId.id },
        include: { item: true }
    })

    if (!booking) {
        return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
    }

    if (booking.item.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Nemaš ovlasti za ovu rezervaciju' }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId.id },
        data: { status },
        include: {
            item: {
                include: {
                    user: true
                }
            }
        }
    })

    const ownerEmail = updatedBooking.item.user.email;

    await pusherServer.trigger(
        `user-${ownerEmail}`, 'booking-updated', {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        itemId: updatedBooking.itemId,
    })

    return NextResponse.json(updatedBooking, { status: 200 });
}