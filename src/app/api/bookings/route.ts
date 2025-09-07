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
        where: { 
            email: session.user.email,
            isDeleted: false
        },
    })

    if (!user) {
        return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if user already has a pending or approved booking for THIS specific item
    const existingBookingForThisItem = await prisma.booking.findFirst({
        where:{
            itemId: itemId,
            userId: user.id,
            status: {
                in: ['PENDING', 'APPROVED'] // Only check active bookings
            }
        }
    })

    if (existingBookingForThisItem) {
        return NextResponse.json({error:'Već imate aktivnu rezervaciju za ovaj predmet'}, {status:400})
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const status = searchParams.get('status');

    if (!itemId) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const whereClause: any = { itemId };
    
    if (status) {
        whereClause.status = status;
    }

    const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            item: {
                select: {
                    id: true,
                    title: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return NextResponse.json(bookings);
}