'use client';

import React, { useState } from 'react';
import { updateUser } from '@/app/actions/userActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Props = { name: string; email: string; isOpen: boolean; setIsOpen: (isOpen: boolean) => void };

const EditProfileModal = ({ name, email, isOpen, setIsOpen }: Props) => {
  const { update: updateSession } = useSession();
  const [formData, setFormData] = useState({ name, email });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1) Ako server action očekuje FormData, najčistije je uzeti iz forme:
      const fd = new FormData(e.currentTarget); // koristi vrijednosti iz inputa
      // 2) Alternativa: ručno iz state-a
      // const fd = new FormData();
      // fd.append('name', formData.name);
      // fd.append('email', formData.email);

      const result = await updateUser(fd);
      if (result?.success) {
        toast.success(result.message ?? 'Profil ažuriran');
        setIsOpen(false);
        updateSession({ name: formData.name, email: formData.email });
      } else {
        toast.error(result?.message ?? 'Nešto je pošlo po zlu');
      }
    } catch (err) {
      toast.error('Greška pri spremanju');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-black text-2xl font-bold">Uredi Profil</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Zatvori"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Ime
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleOnChange}
              className="mt-1 py-2 pl-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
              autoComplete="name"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleOnChange}
              className="mt-1 py-2 pl-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Spremam…' : 'Spremi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
