import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { addHours } from "date-fns";
import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function POST(request:NextRequest){

    const {email} = await request.json();

    if(!email) {
        return NextResponse.json({error:'Email je obavezan'}, {status:400})
    }

    const user = await prisma.user.findUnique({
        where:{email:email, isDeleted:false}
    })

    if(!user) {
        return NextResponse.json({error:'Korisnik nije pronađen'}, {status:404})
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.passwordResetToken.deleteMany({
        where:{userId:user.id}
    })

    const expiresAt = addHours(new Date(), 1)

    await prisma.passwordResetToken.create({
        data:{
            userId:user.id,
            token,
            expiresAt
        }
    })

    // ----- NODemailer (Ethereal) za lokalni dev -----
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
      subject: 'Reset lozinke',
      html: `<p>Klikni na <a href=\"${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}\">ovaj link</a> za reset lozinke.</p>`,
    });
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    /*
    // ----- RESEND za produkciju -----
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'PeerRent <noreply@tvoj-domen.com>',
      to: [user.email],
      subject: 'Reset lozinke',
      html: `<p>Klikni na <a href=\"${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}\">ovaj link</a> za reset lozinke.</p>`,
    });
    */

    return NextResponse.json({message:'Email za resetovanje lozinke je poslat'}, {status:200})
}