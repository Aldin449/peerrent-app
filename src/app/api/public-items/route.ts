import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  // AUTOMATIC CLEANUP: Return expired items to available status
  // This ensures items can be re-rented after their rental period ends
  try {
    const expiredItems = await prisma.item.findMany({
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

    if (expiredItems.length > 0) {
      // Mark items as available again (not rented)
      await prisma.item.updateMany({
        where: { id: { in: expiredItems.map(item => item.id) } },
        data: { isRented: false }
      });

      // Mark expired bookings as completed
      await prisma.booking.updateMany({
        where: { 
          itemId: { in: expiredItems.map(item => item.id) },
          status: 'APPROVED',
          endDate: { lt: new Date() }
        },
        data: { 
          status: BookingStatus.COMPLETED,
          isCompleted: true,
          completedAt: new Date()
        }
      });
      
      console.log(`Auto-returned ${expiredItems.length} expired items to available status from public items API`);
    }
  } catch (error) {
    console.error('Error in automatic cleanup:', error);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const search = searchParams.get('search')?.trim() || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const category = searchParams.get('category');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build the database query conditions based on search term and filters
  const whereConditions: any[] = [];
  
  // Add search condition
  if (search) {
    whereConditions.push({
      OR: [
        { title: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }
  
  // Add price range conditions
  if (minPrice || maxPrice) {
    const priceCondition: any = {};
    if (minPrice) priceCondition.gte = parseFloat(minPrice);
    if (maxPrice) priceCondition.lte = parseFloat(maxPrice);
    whereConditions.push({ pricePerDay: priceCondition });
  }
  
  // Add category condition
  if (category) {
    whereConditions.push({ category });
  }
  
  // Always exclude rented items
  whereConditions.push({ isRented: false });
  
  // Always exclude items from deleted users
  whereConditions.push({
    user: { isDeleted: false }
  });

  const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Build sorting options
  const orderBy: any = {};
  switch (sortBy) {
    case 'price':
      orderBy.pricePerDay = sortOrder;
      break;
    case 'date':
      orderBy.createdAt = sortOrder;
      break;
    case 'title':
      orderBy.title = sortOrder;
      break;
    default:
      orderBy.createdAt = 'desc';
  }

  try {
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { 
              name: true, 
              email: true,
              averageRating: true,
              ratingsCount: true,
              emailVerified: true,
              createdAt: true
            },
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
