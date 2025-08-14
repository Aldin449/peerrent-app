import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma"; 
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {

    const session = await getServerSession(authOptions);

    if (!session || !session?.user?.email) {
        return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { 
            email: session.user.email,
            isDeleted: false
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    await prisma.notification.updateMany({
        where: { userId: user.id, isSeen: false },
        data: { isSeen: true }, 
    });

    return NextResponse.json({ success: true });
}