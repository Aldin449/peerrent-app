import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

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

  return NextResponse.json(item);
}
