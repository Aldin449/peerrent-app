import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { addHours } from "date-fns";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email je obavezan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email, isDeleted: false },
  });

  if (!user) {
    return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
  }

  // Obriši stare tokene
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  // Generiši novi token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = addHours(new Date(), 1);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Slanje emaila (Ethereal/nodemailer za lokalni dev)
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

  return NextResponse.json({ message: "Email za verifikaciju je poslat" }, { status: 200 });
}
