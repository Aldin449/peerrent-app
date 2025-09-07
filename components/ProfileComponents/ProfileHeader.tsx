'use client';
import { Edit, Key, Trash2, Camera, Star } from 'lucide-react'
import React, { FunctionComponent, useState, useRef } from 'react'
import { updateUser } from '@/app/actions/userActions'
import EditProfileModal from '../Modals/EditProfileModal';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import DeleteConfirmationModal from '../Modals/DeleteConfirmationModal';
import ChangePasswordModal from '../Modals/ChangePasswordModal';
import { useProfile, useUploadProfilePicture } from '../../hooks/useProfile';
import TrustIndicators from '../TrustIndicators';
import Image from 'next/image';

interface ProfileHeaderProps {
    user: {
        createdAt: Date | null;
        name: string | null;
        email: string | null;
        bio?: string | null;
        phoneNumber?: string | null;
        location?: string | null;
        profilePicture?: string | null;
        averageRating?: number | null;
        ratingsCount?: number | null;
        emailVerified?: boolean;
    } | null;
}

const ProfileHeader: FunctionComponent<ProfileHeaderProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { data: profileData, isLoading: profileLoading } = useProfile();
    const uploadProfilePicture = useUploadProfilePicture();

    if (!user) {
        return null;
    }
    console.log('profileData', profileData);

    const displayUser = profileData || user;
    // Ispisujemo displayUser u konzolu radi debugovanja i provjere podataka korisnika
    console.log('displayUser', displayUser);

    // Dohvatamo profilnu sliku korisnika, ako postoji
    const profilePicture = displayUser.profilePicture;

    // Pošto TypeScript tip displayUser možda nema direktno polja averageRating i ratingsCount,
    // koristimo opcionalno vezivanje (optional chaining) i fallback vrijednost 0.
    // Ovo osigurava da ne dobijemo grešku ako polje ne postoji ili je undefined/null.
    const averageRating = (displayUser as { averageRating?: number | null })?.averageRating ?? 0;
    const ratingsCount = (displayUser as { ratingsCount?: number | null })?.ratingsCount ?? 0;

    // Funkcija za upload profilne slike
    // event: React.ChangeEvent<HTMLInputElement> - događaj koji se dešava kada korisnik izabere fajl
    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // Dohvatamo prvi fajl iz liste izabranih fajlova (ako postoji)
        const file = event.target.files?.[0];
        if (file) {
            await uploadProfilePicture.mutateAsync(file);
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl p-8 mb-6 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Profile Picture Section */}
                <div className="relative group flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-3xl font-bold shadow-lg">
                        {profilePicture ? (
                            <Image
                                src={profilePicture}
                                alt={displayUser.name || 'Profile'}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            displayUser.name?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                    
                    {/* Camera overlay */}
                    <button
                        onClick={handleCameraClick}
                        disabled={uploadProfilePicture.isPending}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                        <Camera size={24} />
                    </button>
                    
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                    />
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                    {/* Name and Rating Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-white">
                            {displayUser.name || 'Anonimni korisnik'}
                        </h1>
                        
                        {/* Rating Section - Clean and Spacious */}
                        {averageRating && averageRating > 0 && (
                            <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            className={`${
                                                star <= Math.round(averageRating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-white font-semibold text-sm">
                                    {averageRating.toFixed(1)}
                                </span>
                                <span className="text-gray-300 text-sm">
                                    ({ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'})
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Email */}
                    <p className="text-gray-300 text-lg mb-3">{displayUser.email}</p>
                    
                    {/* Bio */}
                    {displayUser.bio && (
                        <p className="text-gray-400 mb-4 max-w-2xl leading-relaxed">{displayUser.bio}</p>
                    )}
                    
                    {/* Additional Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Član od: {displayUser.createdAt ?
                                format(new Date(displayUser.createdAt), 'dd MMMM yyyy', { locale: hr }) :
                                'Nepoznato'
                            }</span>
                        </div>
                        
                        {displayUser.location && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{displayUser.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-6">
                        <TrustIndicators
                            userData={{
                                emailVerified: (displayUser as { emailVerified?: boolean })?.emailVerified ?? false,
                                phoneNumber: displayUser.phoneNumber,
                                location: displayUser.location,
                                averageRating: averageRating,
                                ratingsCount: ratingsCount,
                                createdAt: displayUser.createdAt,
                                itemCount: 0, // This would need to be passed from parent or fetched
                                bookingCount: 0, // This would need to be passed from parent or fetched
                                messageCount: 0 // This would need to be passed from parent or fetched
                            }}
                            showScore={true}
                            showBadges={true}
                            maxBadges={3}
                            size="sm"
                        />
                    </div>
                </div>
            </div>
            <EditProfileModal name={user.name || ""} email={user.email || ""} isOpen={isOpen} setIsOpen={setIsOpen} />
            <DeleteConfirmationModal title="Jeste li sigurni da želite obrisati svoj profil" isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} />
            <ChangePasswordModal isOpen={changePasswordModal} setIsOpen={setChangePasswordModal}/>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-700">
                <button 
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Edit size={18} />
                    <span>Uredi Profil</span>
                </button>
                <button 
                    className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    onClick={() => setChangePasswordModal(true)}
                >
                    <Key size={18} />
                    <span>Promijeni Lozinku</span>
                </button>
                <button 
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    onClick={() => setDeleteModalOpen(true)}
                >
                    <Trash2 size={18} />
                    <span>Obriši Account</span>
                </button>
            </div>
        </div>
    )
}

export default ProfileHeader
