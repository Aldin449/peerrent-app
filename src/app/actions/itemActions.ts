'use server'
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";

export async function editItem(itemId:string, data:FormData){
    const session = await auth(); 

    if (!session?.user.id) {
        throw new Error('Niste prijavljeni')
    }

    const id = itemId;

    const ownerOfItem = await prisma.item.findUnique({
        where:{id, ownerId:session.user.id}
    })

    if(!ownerOfItem){
        throw new Error('Niste vlasnik predmeta')
    }

    
}