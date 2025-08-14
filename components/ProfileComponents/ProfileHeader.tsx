'use client';
import { Edit, Key, Trash2 } from 'lucide-react'
import React, { FunctionComponent, useState } from 'react'
import { updateUser } from '@/app/actions/userActions'
import EditProfileModal from '../Modals/EditProfileModal';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface ProfileHeaderProps {
    user: {
        createdAt: Date | null;
        name: string | null;
        email: string | null;
    } | null;
}

const ProfileHeader: FunctionComponent<ProfileHeaderProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gray-900 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                    {user?.name?.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                    <p className="text-gray-300">{user?.email}</p>
                    <p className="text-gray-400">Član od: {user?.createdAt ?
                        format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: hr }) :
                        'Nepoznato'
                    }</p>
                </div>
            </div>
            <EditProfileModal name={user.name || ""} email={user.email || ""} isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="flex space-x-3 mt-4">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center space-x-2" onClick={() => setIsOpen(!isOpen)}>
                    <Edit size={16} />
                    <span>Uredi Profil</span>
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded flex items-center space-x-2">
                    <Key size={16} />
                    <span>Promijeni Lozinku</span>
                </button>
                <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center space-x-2">
                    <Trash2 size={16} />
                    <span>Obriši Account</span>
                </button>
            </div>
        </div>
    )
}

export default ProfileHeader
