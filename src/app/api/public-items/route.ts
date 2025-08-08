import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const search = searchParams.get('search')?.trim() || '';

  const skip = (page - 1) * limit;

  // Optimize search query
  const whereClause = search
    ? {
        AND: [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { location: { contains: search, mode: 'insensitive' as const} },
              { description: { contains: search, mode: 'insensitive' as const} },
            ],
          },
          {
            // Only show items that are not rented
            isRented: false
          }
        ]
      }
    : {
        // Only show items that are not rented
        isRented: false
      };

  try {
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

    // Parse images for each item
    const itemsWithParsedImages = items.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
    }));

    const response = NextResponse.json({
      data: itemsWithParsedImages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
