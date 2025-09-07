import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;

    const ratingsReceived = await prisma.userRating.findMany({
        where:{
            toUserId:id
        },
        include:{
            fromUser:true
        }
    })

    return NextResponse.json(ratingsReceived, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {

    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    const { id } = params;
    const { rating, comment } = await request.json();

    const existingRating = await prisma.userRating.findFirst({
        where: {
            toUserId: id,
            fromUserId: session.user.id
        }
    })

    console.log(existingRating, 'existingRating')
    if (existingRating) {
        console.log('tu sam')
        await prisma.userRating.update({
            where: { id: existingRating.id },
            data: {
                rating,
                comment
            }
        })
        revalidatePath(`/profile/${id}`);
    } else {
        await prisma.userRating.create({
            data: {
                toUserId: id,
                fromUserId: session.user.id,
                comment,
                rating
            }
        })
    }


    const allRatings = await prisma.userRating.findMany({
        where: {
            toUserId: id
        },
        select: { rating: true }
    })

    const averageRating = allRatings.reduce((sum, rating) => sum + rating.rating, 0) / allRatings.length;

    await prisma.user.update({
        where: { id },
        data: {
            averageRating: Math.round(averageRating * 100) / 100,
            ratingsCount: allRatings.length
        }
    });

    revalidatePath(`/users/${id}`);
    revalidatePath(`/profile/${id}`);

    return NextResponse.json({ message: 'Uspješno ste ostavili recenziju' }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { toUserId: string, id: string } }) {

    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 });
    }

    const { id, toUserId } = params;

    const existingRating = await prisma.userRating.findFirst({
        where: {
            fromUserId: session.user.id,
            toUserId: toUserId
        }
    })

    if (!existingRating) {
        return NextResponse.json({ error: 'Nemate recenziju za ovog korisnika' }, { status: 400 });
    }

    await prisma.userRating.delete({
        where: { id }
    })

    return NextResponse.json({ message: 'Uspješno ste obrisali recenziju' }, { status: 200 });
}