import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
    const { password, confirmPassword, token } = await request.json();

    if (!password || !confirmPassword || !token) {
        return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 })
    }

    if (password !== confirmPassword) {
        return NextResponse.json({ error: 'Lozinke se ne poklapaju' }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
    })

    if (!resetToken) {
        return NextResponse.json({ error: 'Token nije validan' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Token je istekao' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.findUnique({
        where: { id: resetToken.userId },
    })

    if (!user) {
        return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 })
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    })

    await prisma.passwordResetToken.delete({
        where: { token }
    })

    return NextResponse.json({ message: 'Lozinka je uspešno promenjena' }, { status: 200 })

}