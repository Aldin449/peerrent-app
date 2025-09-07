import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
  }

  try {
    const { name, bio, phoneNumber, location } = await request.json();

    // Validate input
    if (name && name.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Ime mora imati najmanje 2 karaktera' 
      }, { status: 400 });
    }

    if (bio && bio.length > 500) {
      return NextResponse.json({ 
        error: 'Bio ne može biti duži od 500 karaktera' 
      }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(phoneNumber !== undefined && { phoneNumber: phoneNumber.trim() }),
        ...(location !== undefined && { location: location.trim() })
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        phoneNumber: true,
        location: true,
        profilePicture: true,
        createdAt: true
      }
    });

    return NextResponse.json({ 
      message: 'Profil je uspješno ažuriran',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Greška pri ažuriranju profila' 
    }, { status: 500 });
  }
}
