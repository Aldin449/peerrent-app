import { notFound } from 'next/navigation';
import { auth } from '../../../../auth';
import prisma from '../../../../src/lib/prisma';
import ClientItemPage from './ClientItemPage';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function ItemPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        notFound();
    }

    const item = await prisma.item.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!item) {
        notFound();
    }

    // Check if item is currently rented
    const activeBooking = await prisma.booking.findFirst({
        where: {
            itemId: id,
            status: 'APPROVED',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
        },
    });

    const isCurrentlyRented = !!activeBooking;

    return (
        <ClientItemPage 
            item={item}
            isCurrentlyRented={isCurrentlyRented}
            currentUserId={session.user.id}
        />
    );
}
