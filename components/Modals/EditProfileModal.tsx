'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';

type Props = { name: string; email: string; isOpen: boolean; setIsOpen: (isOpen: boolean) => void };

const EditProfileModal = ({ name, email, isOpen, setIsOpen }: Props) => {
  const { update: updateSession } = useSession();
  const { data: profileData } = useProfile();
  const updateProfile = useUpdateProfile();
  const [formData, setFormData] = useState({ 
    name: name || '', 
    email: email || '',
    bio: '',
    phoneNumber: '',
    location: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Update form data when profile data loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        bio: profileData.bio || '',
        phoneNumber: profileData.phoneNumber || '',
        location: profileData.location || ''
      });
    }
  }, [profileData]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
        location: formData.location
      });
      
      setIsOpen(false);
      updateSession({ name: formData.name, email: formData.email });
    } catch (err) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-gray-900 text-2xl font-bold">Uredi Profil</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Zatvori"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Ime *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleOnChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleOnChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              value={formData.bio}
              onChange={handleOnChange}
              rows={3}
              maxLength={500}
              placeholder="Kratko opišite sebe..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 karaktera</p>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Broj telefona
            </label>
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleOnChange}
              placeholder="+387 XX XXX XXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lokacija
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleOnChange}
              placeholder="Grad, država"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={isSaving || updateProfile.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isSaving || updateProfile.isPending ? 'Spremam…' : 'Spremi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
