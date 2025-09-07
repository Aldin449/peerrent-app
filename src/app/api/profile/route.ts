import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: session.user.id,
        isDeleted: false 
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        phoneNumber: true,
        location: true,
        profilePicture: true,
        createdAt: true,
        averageRating: true,
        ratingsCount: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ 
      error: 'Greška pri dohvatanju profila' 
    }, { status: 500 });
  }
}
