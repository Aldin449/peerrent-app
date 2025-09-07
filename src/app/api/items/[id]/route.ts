import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { parseFormData } from '@/lib/parseForm';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, name: true }
      }
    }
  });

  if (!item) {
    return NextResponse.json({ error: 'Item nije pronađen.' }, { status: 404 });
  }

  // Check if the item is currently rented using the isRented field
  const isCurrentlyRented = item.isRented;

  // Dodajemo cache kontrolu za bolje performanse
  return NextResponse.json(item, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Last-Modified': new Date().toUTCString()
    }
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  const { id } = params;

  try {
    const { fields, files } = await parseFormData(request);
    const { title, description, location, pricePerDay, phoneNumber, existingImages } = fields;


    if (!title || !description || !location || !pricePerDay) {
      return NextResponse.json({ error: 'Sva polja su obavezna' })
    }

    const ownerOfItem = await prisma.item.findUnique({
      where: { id, ownerId: session.user.id }
    })

    if (!ownerOfItem) {
      return NextResponse.json({ error: 'Niste vlasnik predmeta' }, { status: 404 })
    }

    let finalImages: string[] = [];

    // ✅ Koristi existingImages iz forme (slike koje nisi obrisao)
    if (existingImages) {
      const existingArray = Array.isArray(existingImages) ? existingImages : [existingImages];
      finalImages.push(...existingArray);
      console.log('Added existing images from form:', existingArray);
    }

    // Dodaj nove slike
    if (files.images && files.images.length > 0) {
      const newImagePaths = files.images
        .filter((file: any) => file && file.path && file.size > 0)
        .map((file: any) => file.path);
      finalImages.push(...newImagePaths);
      console.log('Added new images:', newImagePaths);
    }

    console.log('Final images array:', finalImages);

    // Validate pricePerDay is a valid number
    const price = parseFloat(pricePerDay);
    if (isNaN(price) || price <= 0) {
        return NextResponse.json(
            { error: "Neispravna cijena - mora biti pozitivan broj" },
            { status: 400 }
        );
    }

    const updatedItem = await prisma.item.update({
        where: { id },
        data: {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            pricePerDay: price, // Use validated price instead of parseFloat directly
            phoneNumber,
            images: finalImages.length > 0 ? JSON.stringify(finalImages) : null,
        },
    });

    // Osvježavamo sve relevantne putanje za automatsko osvježavanje
    revalidatePath(`/items/${id}`);
    revalidatePath('/my-items');
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Uspješno ste ažurirali predmet', item: updatedItem }, { status: 200 })
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Greška prilikom update-a itema" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  const { id } = params;

  try {
    const existingItem = await prisma.item.findUnique({
      where: { id, ownerId: session.user.id }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item nije pronađen ili niste vlasnik' }, { status: 404 })
    }

    const activeBookings = await prisma.booking.findFirst({
      where: { itemId: id, status: { in: ['APPROVED', 'PENDING'] } }
    })

    if (activeBookings) {
      return NextResponse.json(
        { error: "Ne možete obrisati item sa aktivnim rezervacijama" },
        { status: 400 }
      );
    }

    await prisma.item.delete({
      where: { id }
    })

    // Osvježavamo putanje nakon brisanja
    revalidatePath('/my-items');
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Item je uspješno obrisan' })
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Greška prilikom brisanja itema" },
      { status: 500 }
    );
  }
}