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

export default async function ItemPage({ params }: Props) {

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

    const statusOfBooking = await prisma.booking.findFirst({
        where: {
            itemId: id,
        }
    });
    const {status} = statusOfBooking || {};


console.log(item, session);

function getStatusColor(status:string | undefined) {
    switch(status){
        case 'PENDING':
            return 'text-yellow-600 bg-yellow-100';
        case 'APPROVED':
            return 'text-green-600 bg-green-100';
        case 'DECLINED':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
}

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
                <div className="space-y-2 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">{item.title}</h1>
                        <p className="text-gray-600 text-lg">{item.description}</p>
                    </div>
                    <p className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>{status === 'PENDING' ? 'Na čekanju' : status === 'APPROVED' ? 'Odobreno' : 'Odbijeno'}</p>
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
                {item.ownerId !== session?.user?.id && <BookingForm itemId={item.id} />}
            </div>
        </div>
    );
}
