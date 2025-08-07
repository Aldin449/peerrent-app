// app/api/bookings/owner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.email || !session?.user.email) {
        return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
        where: { email: session?.user.email }
    })

    if (!owner) {
        return NextResponse.json({ error: 'Korisnik nije pronađen.' }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
        where: {
            item: {
                ownerId: owner.id
            }

        },
        orderBy: { createdAt: 'desc' },
        include: {
            item: true,
            user: {
                select: { name: true, email: true },
            },
        }
    })

    return NextResponse.json(bookings);
}