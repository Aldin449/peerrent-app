import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ImageGallery from '../../../../components/ImageGallery';
import BookingForm from '../../../../components/BookingForm';
import { auth } from '../../../../auth';

interface Props {
    params: {
        id: string;
    };
}

function getRentalStatusColor(isRented: boolean) {
    return isRented 
        ? 'text-red-600 bg-red-100' 
        : 'text-green-600 bg-green-100';
}

export default async function ItemPage({ params }: Props) {
    // AUTOMATIC CLEANUP: Delete expired items before showing item details
    // This ensures users don't see items that should be deleted
    try {
        const itemsToDelete = await prisma.item.findMany({
            where: {
                Booking: {
                    some: {
                        status: 'APPROVED',
                        endDate: { lt: new Date() } // End date is in the past
                    }
                }
            },
            select: { id: true }
        });

        if (itemsToDelete.length > 0) {
            // Delete in correct order due to foreign key constraints
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
            
            console.log(`Auto-deleted ${itemsToDelete.length} expired items from item page`);
        }
    } catch (error) {
        console.error('Error in automatic cleanup:', error);
    }

    const { id } = await params;
    const session = await auth();

    const item = await prisma.item.findUnique({
        where: { id: id },
        include: {
            user: {
                select: { name: true, email: true },
            },
        },
    });

    if (!item) {
        return notFound();
    }

    // Check if the item is currently rented (has an active approved booking)
    const activeBooking = await prisma.booking.findFirst({
        where: {
            itemId: id,
            status: 'APPROVED',
            AND: [
                { startDate: { lte: new Date() } },
                { endDate: { gte: new Date() } }
            ]
        }
    });

    const isCurrentlyRented = !!activeBooking;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
                <div className="space-y-2 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">{item.title}</h1>
                        <p className="text-gray-600 text-lg">{item.description}</p>
                    </div>
                    <p className={`px-3 py-1 rounded-full text-sm font-medium ${getRentalStatusColor(isCurrentlyRented)}`}>
                        {isCurrentlyRented ? 'Trenutno iznajmljeno' : 'Dostupno za iznajmljivanje'}
                    </p>
                </div>

                {/* Image Gallery */}
             {item.images && item.images.length > 0 && (
                <ImageGallery images={JSON.parse(item.images)} title={item.title} />
             )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    <div>
                        <p className="text-sm text-gray-500">📍 Lokacija</p>
                        <p className="text-base font-medium">{item.location}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">💰 Cijena po danu</p>
                        <p className="text-base font-medium text-green-600">{item.pricePerDay} KM</p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">👤 Vlasnik</p>
                    <p className="text-base font-medium">
                        {item.user.name || 'Nepoznat'} – {item.user.email}
                    </p>
                </div>

                <div className="pt-6">
                    <button className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition">
                        Pošalji poruku vlasniku
                    </button>
                </div>
                {item.ownerId !== session?.user?.id && !isCurrentlyRented && <BookingForm itemId={item.id} />}
            </div>
        </div>
    );
}
