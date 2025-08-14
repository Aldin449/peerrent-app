import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(request:NextRequest){

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json({error:"Niste prijavljeni"},{status:401});
    }

    const {name,email} = await request.json();

    if(!name || !email){
        return NextResponse.json({error:"Niste unijeli sve podatke"},{status:400});
    }

    const user = await prisma.user.update({
        where:{id:session.user.id},
        data:{name,email}
    })
    
    return NextResponse.json({message:"Podaci su uspješno ažurirani", user},{status:200});

    
}