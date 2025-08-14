'use server';

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "../../../auth";

export async function updateUser(formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            throw new Error('Nisi logovan');
        }

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;

        if (!name || !email) {
            throw new Error('Ime i email su obavezni');
        }

        // Update korisnika
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name, email }
        });


        console.log('Revalidating path...');
        revalidatePath('/my-profile');
        revalidateTag('user-profile'); 
        console.log('Path revalidated');

        await auth(); 
        return { success: true, message: "Podaci su uspješno ažurirani" };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Došlo je do greške' };
    }
}