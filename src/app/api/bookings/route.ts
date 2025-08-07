import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session?.user?.email) {
        return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    const { itemId, startDate, endDate } = await request.json();

    if (!itemId || !startDate || !endDate) {
        return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 });
    }

    const isRented = await prisma.booking.findFirst({
        where: {
            itemId,
            status: 'APPROVED',
            OR: [{
                startDate: { lte: new Date(endDate) },
                endDate: { gte: new Date(startDate) },
            }]
        }

    })

    if (isRented) {
        return NextResponse.json({ error: 'Ovaj predmet je već iznajmljen u tom periodu' }, { status: 400 });
    }



    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user) {
        return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const booking = await prisma.booking.create({
        data: {
            itemId,
            userId: user.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'PENDING',
        },
        include: {
            item: {
                include: {
                    user: true
                }
            }
        }
    })

    const ownerEmail = booking.item.user.email;

    await pusherServer.trigger(`user-${ownerEmail}`, 'booking-request', {
        message: `Novi zahtjev za rezervaciju: ${booking.item.title}`,
        bookingId: booking.id,
        itemId: booking.item.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
    });

    await prisma.notification.create({
        data: {
            userId: booking.item.ownerId,
            message: `Novi zahtjev za rezervaciju: ${booking.item.title}`,
            bookingId: booking.id,
            itemId: booking.item.id,
            startDate: booking.startDate,
            endDate: booking.endDate,
        }
    })

    return NextResponse.json({ success: true, booking });
}