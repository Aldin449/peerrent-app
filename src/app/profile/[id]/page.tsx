import React from 'react'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EnhancedUserRating from '../../../../components/EnhancedUserRating';
import Image from 'next/image';
import Pagination from '../../../../components/Pagination';

interface ProfilePageProps {
  params: {id: string};
  searchParams: {page: string};
}

const PAGE_SIZE = 6;

export default async function ProfilePage({params, searchParams}: ProfilePageProps)  {
  
  const {id} = await params
    const user = await prisma.user.findUnique({
        where:{id:id},
        include: {
            item: true,
            ratingsReceived: true,
        },
    })


    const ratingsReceived = await prisma.userRating.findMany({
      where:{toUserId:id},
      include:{
        fromUser:true,
      }
    })

    if (!user) {
        notFound()
    }

      // Broj itema radi paginacije
  const totalItems = await prisma.item.count({
    where: { ownerId: id },
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const rawPage = parseInt(searchParams?.page ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;

  const items = await prisma.item.findMany({
    where:{ownerId:id},
    orderBy:{createdAt:'desc'},
    take:PAGE_SIZE,
    skip:(page - 1) * PAGE_SIZE,
  })

    // Koristi postojeći averageRating iz User modela
    const averageRating = user.averageRating || 0

    // Formatiraj datum registracije
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('bs-BA', {
        year: 'numeric',
        month: 'long'
    }) : 'Nepoznato'

    console.log(items,'items')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-6">
            {/* Profile Avatar */}
            <div className="flex-shrink-0">
              {user.profilePicture ? <Image src={user.profilePicture} alt={user.name || 'Anonimni korisnik'} width={96} height={96} className='rounded-full' /> : 
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              }
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name || 'Anonimni korisnik'}</h1>
              <div className="flex items-center space-x-6 mt-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Član od {joinDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{averageRating.toFixed(1)} ({user.ratingsCount || 0} ocena)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Stats & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistike</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ukupno itema</span>
                  <span className="text-2xl font-bold text-blue-600">{user.item?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prosečna ocena</span>
                  <span className="text-2xl font-bold text-green-600">{averageRating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Broj ocena</span>
                  <span className="text-2xl font-bold text-purple-600">{user.ratingsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt informacije</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{user.email}</span>
                </div>
                {/*user.location && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{user.location}</span>
                  </div>
                )*/}
              </div>
            </div>
          </div>

          {/* Right Column - Items & Ratings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* User's Items */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Items ({user.item?.length || 0})</h3>
              </div>
              <div className="p-6 h-[290px] overflow-y-auto">
                {items && items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                    {items.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-blue-600 font-semibold">€{item.pricePerDay}/dan</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.isActive ? 'Aktivan' : 'Neaktivan'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Ovaj korisnik još nema objavljenih itema.</p>
                  </div>
                )}
              </div>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} searchParams={searchParams} />

            {/* User's Ratings */}
            <EnhancedUserRating user={user} ratingsReceived={ratingsReceived}/>
          </div>
        </div>
      </div>
    </div>
  )
}