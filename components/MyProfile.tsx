

import { useSession } from 'next-auth/react';
import { Edit, Key, Trash2, Package, Calendar, MessageSquare, Bell } from 'lucide-react';
import ProfileTabs from './ProfileTabs';
import { auth } from '../auth';
import prisma from '@/lib/prisma';

async function getMyItems() {
  const session = await auth();

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: {
        ownerId: session?.user?.id
      }
    }),
    prisma.item.count({
      where: {
        ownerId: session?.user?.id
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
    session
  };
}

async function getNumberOfSuccessfulBookings() {
  const session = await auth();

  const completedBookings = await prisma.booking.findMany({
    where:{
      item:{ownerId:session?.user?.id},
      status:'APPROVED',
      isCompleted:true,
    },
    include:{
      item:{select:{pricePerDay:true}}
    }
  })

  let totalEarnings = 0;
  completedBookings.forEach(booking => {
    const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
    totalEarnings += days * booking.item.pricePerDay;
  })

  return {totalEarnings, numberOfCompletedBookings:completedBookings.length};
}

export default async function ProfilePage() {

  const { items, total, session } = await getMyItems();
  const {totalEarnings, numberOfCompletedBookings} = await getNumberOfSuccessfulBookings();
  console.log(totalEarnings, numberOfCompletedBookings);
  // Mock podaci
  const mockData = {
    name: "Marko Petrović",
    email: "marko@example.com",
    joinDate: "Januar 2024",
    stats: {
      items: 5,
      bookings: 3,
      messages: 12
    },
    items: [
      {
        id: 1,
        title: "MacBook Pro 2023",
        location: "Beograd, Centar",
        price: 25,
        status: "Dostupna",
        image: "/placeholder.jpg"
      },
      {
        id: 2,
        title: "Canon EOS R5",
        location: "Beograd, Novi Beograd",
        price: 30,
        status: "Iznajmljena",
        image: "/placeholder.jpg"
      }
    ],
    bookings: [
      {
        id: 1,
        itemTitle: "MacBook Pro 2023",
        startDate: "15 Jan 2024",
        endDate: "20 Jan 2024",
        status: "Odobreno"
      },
      {
        id: 2,
        itemTitle: "Canon EOS R5",
        startDate: "25 Jan 2024",
        endDate: "30 Jan 2024",
        status: "Na čekanju"
      }
    ],
    notifications: [
      {
        id: 1,
        message: "Nova rezervacija za 'MacBook Pro 2023'",
        time: "2 sata prije",
        isRead: false
      },
      {
        id: 2,
        message: "Rezervacija odobrena",
        time: "1 dan prije",
        isRead: true
      }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header sekcija */}
      <div className="bg-gray-900 text-white rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
            {mockData.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
            <p className="text-gray-300">{session?.user?.email}</p>
            <p className="text-gray-400">Član od: {mockData.joinDate}</p>
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center space-x-2">
            <Edit size={16} />
            <span>Uredi Profil</span>
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded flex items-center space-x-2">
            <Key size={16} />
            <span>Promijeni Lozinku</span>
          </button>
          <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center space-x-2">
            <Trash2 size={16} />
            <span>Obriši Account</span>
          </button>
        </div>
      </div>

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

        {/*<div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-3xl font-bold text-purple-600">{mockData.stats.messages}</div>
          <div className="text-gray-600 flex items-center justify-center space-x-2 mt-2">
            <MessageSquare size={20} />
            <span>PORUKE</span>
          </div>
        </div>*/ }
      </div>

      {/* <ProfileTabs items={items}/> */}
    </div>
  );
}