import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: {id: session.user.id}
    })

    if(!user){
        return NextResponse.json({error:"Korisnik nije pronađen"}, {status:404})
    }

    // Soft delete the user
    await prisma.user.update({
        where: {
            id: session.user.id
        },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    })

    // Return success response
    // Note: The frontend will handle signOut and redirect
    return NextResponse.json({ message: "Profil uspjesno obrisan" }, { status: 200 })
}