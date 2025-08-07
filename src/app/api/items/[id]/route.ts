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

  const statusOfBooking = await prisma.booking.findFirst({
    where: {
      itemId: id,
    }
  });

  const {status} = statusOfBooking || {};
  

  return NextResponse.json({item, status});
}
