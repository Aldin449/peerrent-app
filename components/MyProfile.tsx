

import { useSession } from 'next-auth/react';
import { Edit, Key, Trash2, Package, Calendar, MessageSquare, Bell } from 'lucide-react';
import ProfileTabs from './ProfileTabs';
import { auth } from '../auth';
import prisma from '@/lib/prisma';
import ProfileHeader from './ProfileComponents/ProfileHeader';

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
        id: session?.user?.id
      },
      select: {
        createdAt: true,
        name: true,
        email: true
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

  let totalEarnings = 0;
  completedBookings.forEach(booking => {
    const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
    totalEarnings += days * booking.item.pricePerDay;
  })

  return { totalEarnings, numberOfCompletedBookings: completedBookings.length };
}

export default async function ProfilePage() {

  const { items, total, user } = await getMyItems();
  const { totalEarnings, numberOfCompletedBookings } = await getNumberOfSuccessfulBookings();


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
          <div className="text-3xl font-bold text-green-600">{numberOfCompletedBookings}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <Calendar size={20} />
            <span>USPJEŠNE REZERVACIJE</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-purple-600">{totalEarnings} KM</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            💰
            <span>ZARADA</span>
          </div>
        </div>
      </div>

      {/* <ProfileTabs items={items}/> */}
    </div>
  );
}