import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';
import { useDeleteItem } from '../../hooks/useDeleteItems';

type Props = { itemId: string, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }

const DeleteItemModal = ({ itemId, isOpen, setIsOpen }: Props) => {

    const router = useRouter();

    const { mutate, isPending } = useDeleteItem();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(itemId);
        setIsOpen(false);
        router.push("/my-items");
    }

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-black text-2xl font-bold">Da li ste sigurni da želite obrisati ovaj predmet?</h2>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Zatvori"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex items-center justify-center gap-4">
                    <button type="submit" disabled={isPending} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 cursor-pointer">
                        {isPending ? "Brisanje..." : "Obriši predmet"}
                    </button>
                    <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">
                        Odustani
                    </button>
                </form>
            </div>
        </div>
    )
}

export default DeleteItemModal
