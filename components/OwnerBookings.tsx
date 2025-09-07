import { auth } from '../auth';
import prisma from '../src/lib/prisma';
import { format } from 'date-fns';
import ClientBookingAction from './ClientBookingAction';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    pricePerDay: number;
  };
  user: {
    name: string | null;
    email: string;
  };
}

async function getOwnerBookings(userId: string): Promise<Booking[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      item: {
        ownerId: userId
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          pricePerDay: true,
        }
      },
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  return bookings.map(booking => ({
    ...booking,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    createdAt: booking.createdAt.toISOString(),
  }));
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'text-green-600 bg-green-100';
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100';
    case 'DECLINED':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Odobreno';
    case 'PENDING':
      return 'Na čekanju';
    case 'DECLINED':
      return 'Odbijeno';
    default:
      return status;
  }
}

export default async function OwnerBookings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="max-w-4xl mx-auto mt-10 text-center text-gray-600">
        <p>Morate biti prijavljeni da vidite rezervacije.</p>
      </div>
    );
  }

  const bookings = await getOwnerBookings(session.user.id);

  if (bookings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-10 text-center text-gray-600">
        <p>Nemate rezervacija za svoje iteme.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Rezervacije za moje iteme</h2>
      <div className="space-y-4 bg-white rounded-lg">
        {bookings.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{booking.item.title}</h3>
                <p className="text-sm text-gray-600">
                  Rezervisao: {booking.user.name || 'Nepoznat'} ({booking.user.email})
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Početak:</p>
                <p className="font-medium">{format(new Date(booking.startDate), 'dd.MM.yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500">Kraj:</p>
                <p className="font-medium">{format(new Date(booking.endDate), 'dd.MM.yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500">Cijena:</p>
                <p className="font-medium">{booking.item.pricePerDay} KM/dan</p>
              </div>
            </div>
            
           
            
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Kreirano: {format(new Date(booking.createdAt), 'dd.MM.yyyy HH:mm')}
              </p>
               {/* Show action buttons only for pending bookings */}
              {booking.status === 'PENDING' && (
                <ClientBookingAction 
                  bookingId={booking.id} 
                  itemId={booking.item.id} 
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 