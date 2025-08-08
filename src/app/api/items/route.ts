import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const session = await getServerSession(authOptions);

  const skip = (page - 1) * limit;

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Nisi logovan" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Korisnik nije pronađen." }, { status: 404 });
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { 
        ownerId: user.id,
        // Only show items that are not rented
        isRented: false
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.item.count({
      where: { 
        ownerId: user.id,
        // Only show items that are not rented
        isRented: false
      },
    })
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  if (items.length === 0) {
    return NextResponse.json({ message: "Trenutno nemate nijedan item." }, { status: 200 });
  }

  return NextResponse.json({
    items,
    totalPages,
    page,
    total,
  });
}
