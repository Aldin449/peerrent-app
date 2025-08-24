import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { addHours } from "date-fns";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try{
        const {email, password, name} = await request.json();

        if (!email || !password) {
            return NextResponse.json({error:'Email i šifra su obavezni'}, {status:400});
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
                isDeleted: false
            }
        });

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

        // --- Email verifikacija ---
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = addHours(new Date(), 1);
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        const info = await transporter.sendMail({
            from: 'PeerRent <no-reply@peerrent.com>',
            to: user.email,
            subject: 'Verifikacija email adrese',
            html: `<p>Klikni na <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}">ovaj link</a> da verifikuješ svoj nalog.</p>`,
        });
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        return NextResponse.json({success:true,user});
    } catch (error) {
        return NextResponse.json({error:'Greška na serveru'}, {status:500})
    }
}