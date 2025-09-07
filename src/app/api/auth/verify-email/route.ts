import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token nije prosleđen" }, { status: 400 });
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Token nije validan" }, { status: 400 });
  }

  if (verificationToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token je istekao" }, { status: 400 });
  }

  // Verifikuj korisnika
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: true },
  });

  // Obriši token
  await prisma.emailVerificationToken.delete({
    where: { token },
  });

  return NextResponse.json({ message: "Email je uspešno verifikovan" }, { status: 200 });
}
