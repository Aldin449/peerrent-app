import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Pagination from './Pagination';
import { format } from 'date-fns';
import prisma from '../src/lib/prisma';
import { auth } from '../auth';


interface Item {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    location: string;
    images: string[];
    pricePerDay: number;
    createdAt: string;
    isRented: boolean;
}

interface MyItemsProps {
    searchParams?: Promise<{
        page?: string;
    }>;
}

async function getMyItems(userId: string, page: number) {
    const limit = 6;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.item.findMany({
            where: {
                ownerId: userId,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.item.count({
            where: {
                ownerId: userId,
            },
        }),
    ]);

    return {
        items: items.map(item => ({
            ...item,
            images: item.images ? JSON.parse(item.images) : [],
            createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
        })),
        total,
        totalPages: Math.ceil(total / limit),
    };
}



export default async function MyItems({ searchParams }: MyItemsProps) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return (
            <div className="max-w-4xl mx-auto mt-10 text-center text-gray-600">
                <p>Morate biti prijavljeni da vidite svoje iteme.</p>
                <Link
                    href="/login"
                    className="mt-4 inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Prijavi se
                </Link>
            </div>
        );
    }

    const params = await searchParams;
    const page = parseInt(params?.page || '1');
    const { items, total, totalPages } = await getMyItems(session.user.id, page);

    if (!items || items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto mt-10 text-center text-gray-600">
                <p>Nemate dodanih itema.</p>
                <Link
                    href="/add-item"
                    className="mt-4 inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Dodaj prvi item
                </Link>
            </div>
        );
    }


    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {items.map((item: Item) => {
                    return(
                    <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="border rounded-lg p-4 shadow hover:shadow-md transition block"
                    >
                        {item.images && item.images.length > 0 && (
                            <div className="relative mb-3">
                                <Image
                                    src={item.images[0]}
                                    alt={item.title}
                                    width={300}
                                    height={200}
                                    className="w-full h-48 object-cover rounded"
                                />
                                {item.isRented && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                                        Iznajmljeno
                                    </div>
                                )}
                            </div>
                        )}
                        <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                        <p className="text-sm text-gray-600 mb-1 line-clamp-2">{item.description}</p>
                        <p className="text-sm text-gray-500">📍 {item.location}</p>
                        <p className="text-sm font-semibold text-green-600">💰 {item.pricePerDay} KM/dan</p>
                        <p className="text-xs text-gray-400 mt-2">
                            Dodano: {format(new Date(item.createdAt), 'dd.MM.yyyy')}
                        </p>
                    </Link>
                )})}
            </div>
            <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                searchParams={params}
            />
        </div>
    );
}
