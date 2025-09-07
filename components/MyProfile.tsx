import { Edit, Key, Trash2, Package, Calendar, MessageSquare, Bell } from 'lucide-react';
import { auth } from '../auth';
import prisma from '@/lib/prisma';
import ProfileHeader from './ProfileComponents/ProfileHeader';
import ProfileTabs from './ProfileTabs';
import { format } from 'date-fns';

async function getMyItems() {
  const session = await auth();

  const [items, total, user] = await Promise.all([
    prisma.item.findMany({
      where: {
        ownerId: session?.user?.id
      }
    }),
    prisma.item.count({
      where: {
        ownerId: session?.user?.id
      }
    }),
    prisma.user.findUnique({
      where: {
        id: session?.user?.id,
        isDeleted: false
      },
      select: {
        createdAt: true,
        name: true,
        email: true,
        bio: true,
        phoneNumber: true,
        location: true,
        profilePicture: true,
        averageRating: true,
        ratingsCount: true
      }
    })
  ])

  return {
    items: items.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
    })),
    total,
    session,
    user
  };
}

async function getNumberOfSuccessfulBookings() {
  const session = await auth();

  const completedBookings = await prisma.booking.findMany({
    where: {
      item: { ownerId: session?.user?.id },
      status: 'APPROVED',
      isCompleted: true,
    },
    include: {
      item: { select: { pricePerDay: true } }
    }
  })

  const currentllyBookedItems = await prisma.booking.count({
    where: {
      item: { ownerId: session?.user?.id },
      status: 'APPROVED',
      isCompleted: false
    }
  })

  let totalEarnings = 0;
  let currentMonthEarnings = 0;
  let monthlyEarnings: { [key: string]: number } = {};
  let longestBooking = 0;
  
  completedBookings.forEach(booking => {
    const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const bookingEarnings = days * booking.item.pricePerDay;
    if (days > longestBooking) {
      longestBooking = days
    }
    totalEarnings += bookingEarnings;

    // Zarada ovog meseca
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const bookingMonth = new Date(booking.endDate).getMonth();
    const bookingYear = new Date(booking.endDate).getFullYear();

    if (bookingMonth === currentMonth && bookingYear === currentYear) {
      currentMonthEarnings += bookingEarnings;
    }

    // Zarada po mesecima (za najbolji mesec)
    const monthKey = `${bookingYear}-${String(bookingMonth + 1).padStart(2, '0')}`;
    monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + bookingEarnings;
  });

  // Najbolji mesec
  const bestMonth = Object.entries(monthlyEarnings).reduce((best, [month, earnings]) =>
    earnings > best.earnings ? { month, earnings } : best,
    { month: '', earnings: 0 }
  );

  const numberOfCompletedBookings = completedBookings.length;
  const averageEarningsPerBooking = numberOfCompletedBookings > 0 ? totalEarnings / numberOfCompletedBookings : 0;

  return {
    totalEarnings,
    numberOfCompletedBookings: completedBookings.length,
    averageEarningsPerBooking,
    currentMonthEarnings,
    bestMonthEarnings: bestMonth.earnings,
    bestMonth: bestMonth.month,
    longestBooking: longestBooking,
    currentllyBookedItems: currentllyBookedItems
  };
}

export default async function ProfilePage() {

  const { items, total, user } = await getMyItems();
  const { totalEarnings, numberOfCompletedBookings, averageEarningsPerBooking, currentMonthEarnings, bestMonthEarnings, bestMonth, currentllyBookedItems, longestBooking } = await getNumberOfSuccessfulBookings();

  const bestMonthFormatted = bestMonth != '' ? format(new Date(bestMonth), 'MMMM yyyy') : '';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header sekcija */}
      <ProfileHeader user={user} />

      {/* Statistike */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-blue-600">{total}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <Package size={20} />
            <span>STVARI</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-blue-600">{currentllyBookedItems}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <Package size={20} />
            <span>TRENUTNO ZAUZETIH STAVKI</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-green-600">{numberOfCompletedBookings}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <Calendar size={20} />
            <span>USPJEŠNE REZERVACIJE</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-green-600">{longestBooking}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <Calendar size={20} />
            <span>NAJDUŽA REZERVACIJA (DANI)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-purple-600">{totalEarnings} KM</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            💰
            <span>ZARADA</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-orange-600">{averageEarningsPerBooking} KM</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            💰
            <span className='pl-2'>PROSEČNA ZARADA</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-teal-600">{currentMonthEarnings} KM</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            💰
            <span className='pl-2'>ZARADA OVOG MJESECA</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-yellow-600">{bestMonthEarnings} KM</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            💰
            <span className='pl-2'>NAJBOLJI MJESEC {bestMonthFormatted ? `- ${bestMonthFormatted}` : ''}</span>
          </div>
        </div>
      </div>

      <ProfileTabs items={items}/>
    </div>
  );
}