import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PATCH(request:NextRequest){
    const session = await getServerSession(authOptions);

    if(!session?.user.email) {
        return NextResponse.json({error: "Niste prijavljeni"}, {status: 401});
    }

    const { currentPassword, newPassword,confirmPassword} = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: "Sva polja su obavezna" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where:{id: session.user.id}
    })

    if (!user) {
        return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    if (newPassword !== confirmPassword) {
        return NextResponse.json({error: "Nova lozinka i potvrda lozinke se ne podudaraju"}, {status: 400});
    }

    // Verify current password
    const isCurrentPasswordValid = user.password && await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Trenutna lozinka nije tačna" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: {id:user.id},
        data:{ password: hashedPassword }
    })

    return NextResponse.json({ message: "Lozinka je uspešno promenjena" }, { status: 200 });
}