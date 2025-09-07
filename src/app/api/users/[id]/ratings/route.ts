import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch all ratings received by this user
    const ratingsReceived = await prisma.userRating.findMany({
      where: { toUserId: id },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            emailVerified: true,
            averageRating: true,
            ratingsCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(ratingsReceived, { status: 200 });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user ratings' },
      { status: 500 }
    );
  }
}
