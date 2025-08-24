'use client'
import React, { FunctionComponent, useState } from 'react'
import { useChangePassword } from '../../hooks/useResetPassword';
import { toast } from 'sonner';

type Props = { isOpen: boolean, setIsOpen: (isOpen: boolean) => void; }



const ChangePasswordModal: FunctionComponent<Props> = ({ isOpen, setIsOpen }) => {

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const { mutate, isPending } = useChangePassword({
        onSuccess: () => {
            toast.success('Lozinka je uspješno promjenjana')
        },
        onError: (error) => {
            toast.error(error.response.data.error)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(formData)

    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-black text-2xl font-bold">Promjena šifre</h2>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Zatvori"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-4">

                    <div className="mb-4 w-full">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Trenutna šifra
                        </label>
                        <input
                            type="text"
                            name="currentPassword"
                            id="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleOnChange}
                            className="mt-1 py-2 pl-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                            autoComplete="name"

                        />
                    </div>

                    <div className="mb-6 w-full">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            Nova šifra
                        </label>
                        <input
                            type="newPassword"
                            name="newPassword"
                            id="newPassword"
                            value={formData.newPassword}
                            onChange={handleOnChange}
                            className="mt-1 py-2 pl-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                            autoComplete="newPassword"

                        />
                    </div>
                    <div className="mb-6 w-full">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Potvrdite novu šifru
                        </label>
                        <input
                            type="confirmPassword"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleOnChange}
                            className="mt-1 py-2 pl-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                            autoComplete="confirmPassword"

                        />
                    </div>
                    <div className='flex items-center gap-5'>
                        <button type="submit" disabled={isPending} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 cursor-pointer">
                            {isPending ? "Mjenjanje..." : "Promjeni šifru"}
                        </button>
                        <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">
                            Odustani
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChangePasswordModal
