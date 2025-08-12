// app/api/add-item/route.ts
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { parseFormData } from "@/lib/parseForm";
import { auth } from "../../../../auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const session = await auth();
    
    console.log("🔍 Session debug:", {
        hasSession: !!session,
        user: session?.user,
        email: session?.user?.email
    });

    if (!session?.user?.id) {
        console.log("❌ No session or user ID found");
        return NextResponse.json({ error: "Nisi logovan" }, { status: 401 });
    }

    try {

        const { fields, files } = await parseFormData(req);

        // validacija
        const { title, description, location, pricePerDay, phoneNumber } = fields;
        if (!title || !description || !location || !pricePerDay) {
            return NextResponse.json(
                { error: "Sva polja su obavezna" },
                { status: 400 }
            );
        }

        // Handle images - extract file paths
        let imagePaths: string[] = [];
        
        if (files.images && files.images.length > 0) {
            imagePaths = files.images
                .filter((file: any) => file && file.path && file.size > 0)
                .map((file: any) => file.path); // Store file paths
        } else {
            console.log("ℹ️ No images uploaded");
        }

        // napravi item - use session.user.id directly
        const itemData = {
            title,
            description,
            location,
            pricePerDay: parseFloat(pricePerDay),
            phoneNumber,
            images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null, // Store all images as JSON
            ownerId: session.user.id,
        };

        const item = await prisma.item.create({
            data: itemData,
        });

        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        console.error("❌ Greška prilikom kreiranja itema:", error);
        return NextResponse.json(
            { error: error.message || "Greška prilikom kreiranja itema" },
            { status: 500 }
        );
    }
}
