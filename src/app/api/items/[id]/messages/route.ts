// app/api/items/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // FIXED: Made params async for Next.js 15
) {
  // FIXED: Await params to fix Next.js 15 warning
  const { id: itemId } = await params;
  const { searchParams } = new URL(req.url);
  const take = Number(searchParams.get('take') ?? '20'); // koliko poruka po strani
  const cursor = searchParams.get('cursor'); // id poruke od koje nastavljamo
  const direction = (searchParams.get('direction') ?? 'backward').toLowerCase();

  // 1) Validacija da item postoji (brz fail)
  const exists = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: 'Item nije pronađen' }, { status: 404 });
  }

  // 2) Paginacija: default vraćamo najnovije → unazad (za "load older")
  //    Ako želiš strogo rastući prikaz u UI, sort možeš okrenuti u klijentu.
  // FIXED: Changed 'user' to 'sender' to match the Prisma schema
  const messages = await prisma.message.findMany({
    where: { itemId },
    orderBy: { createdAt: 'desc' },
    take: take + 1, // uzmi 1 više da znaš ima li next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, name: true, email: true } }, // pošiljalac - FIXED field name
    },
  });

  // 3) Računamo nextCursor (ako ima još)
  const hasMore = messages.length > take;
  const items = hasMore ? messages.slice(0, take) : messages;

  // (opciono) UI obično prikazuje poruke rastuće – možeš ih obrnuti ovdje:
  const data = direction === 'forward' ? [...items].reverse() : items;

  return NextResponse.json({
    data,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore,
  });
}
