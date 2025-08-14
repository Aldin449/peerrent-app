'use client';

import React from 'react';
import { useDeleteUser } from '../../hooks/useUser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

type Props = { title: string; isOpen: boolean; setIsOpen: (isOpen: boolean) => void };

const DeleteConfirmationModal = ({ title, isOpen, setIsOpen }: Props) => {

    const router = useRouter();

    const { mutate, isPending } = useDeleteUser({
        onSuccess: () => {
            toast.success("Profil uspješno obrisan");
            signOut({
                redirect:false,
                callbackUrl:"/"
            });
            setIsOpen(false);
            router.push("/");
        }
    })

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-black text-2xl font-bold">{title}</h2>
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
                        {isPending ? "Brisanje..." : "Obriši korisnika"}
                    </button>
                    <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">
                        Odustani
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
