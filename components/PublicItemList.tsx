import { Suspense } from 'react';
import Pagination from './Pagination';
import LoadingComponent from './Loader';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '../src/lib/prisma';

interface Item {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerDay: number;
  ownerId: string;
  images: string[];
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string | null;
}

interface PublicItemListProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
  }>;
}

async function getItems(page: number, search: string) {
  const limit = 6;
  const skip = (page - 1) * limit;

  const whereClause = search.toLocaleLowerCase().trim()
    ? {
        OR: [
          { title: { contains: search } },
          { location: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.item.count({
      where: whereClause,
    }),
  ]);

  return {
    items: items.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      createdAt: item.createdAt?.toISOString() || null,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function PublicItemList({ searchParams }: PublicItemListProps) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const search = params?.search || '';

  const { items, total, totalPages } = await getItems(page, search);

  return (
    <div className="p-4 space-y-6">
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="Pretraži po nazivu ili lokaciji..."
          defaultValue={search}
          className="flex-1 border px-4 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Pretraži
        </button>
      </form>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: Item) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="border rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition block"
          >
            {item.images && item.images.length > 0 && (
              <div className="mb-3">
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
            <h2 className="font-semibold text-lg">{item.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            <p className="text-sm mt-2">📍 {item.location}</p>
            <p className="text-sm font-semibold text-green-600">💰 {item.pricePerDay} KM/dan</p>
          </Link>
        ))}
      </div>

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        searchParams={params}
      />
    </div>
  );
}
