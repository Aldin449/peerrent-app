import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
    try{
        const {email, password, name} = await request.json();

        if (!email || !password) {
            return NextResponse.json({error:'Email i šifra su obavezni'}, {status:400});
        }

        const existingUser = await prisma.user.findUnique({where:{email}});

        if (existingUser) {
            return NextResponse.json({error:'Korisnik već postoji'},{status:400})
        }

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data:{
                email,
                password: hashedPassword,
                name
            }
        })

        return NextResponse.json({success:true,user});
    } catch (error) {
        return NextResponse.json({error:'Greška na serveru'}, {status:500})
    }
}