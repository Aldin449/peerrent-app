import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { addHours } from "date-fns";
import nodemailer from "nodemailer";

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
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    // Provjeri da li je već verifikovan
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email je već verifikovan" }, { status: 400 });
    }

    // Obriši stare verifikacijske tokene
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Kreiraj novi verifikacijski token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = addHours(new Date(), 1);
    
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Pošalji email
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

    return NextResponse.json({ 
      message: "Verifikacijski email je poslat. Provjerite svoju email poštu." 
    });

  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
