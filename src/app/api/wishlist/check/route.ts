import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Check if item is in user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Check if item is in wishlist
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_itemId: {
          userId: session.user.id,
          itemId: itemId,
        },
      },
    });

    return NextResponse.json({ 
      isInWishlist: !!wishlistItem 
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to check wishlist' },
      { status: 500 }
    );
  }
}

