import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email je obavezan" }, { status: 400 });
    }

    // Pronađi korisnika po email adresi
    const user = await prisma.user.findUnique({
      where: { 
        email: email,
        isDeleted: false
      },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        emailVerified: false 
      });
    }

    return NextResponse.json({
      exists: true,
      emailVerified: user.emailVerified
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
