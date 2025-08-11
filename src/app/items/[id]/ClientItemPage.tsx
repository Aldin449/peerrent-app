'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ImageGallery from '../../../../components/ImageGallery';
import BookingForm from '../../../../components/BookingForm';
import MessageInterface from '../../../../components/MessageInterface';
import InboxView from '../../../../components/InboxView';
import Link from 'next/link';
import { useState } from 'react';

interface Item {
    id: string;
    title: string;
    description: string;
    pricePerDay: number;
    location: string;
    images: string | null;
    ownerId: string;
    isRented: boolean;
    createdAt: Date | string | null;
    user: {
        name: string | null;
        email: string;
    };
}

interface ClientItemPageProps {
    item: Item;
    isCurrentlyRented: boolean;
    currentUserId: string;
}

function getRentalStatusColor(isRented: boolean) {
    return isRented ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
}

export default function ClientItemPage({ item, isCurrentlyRented, currentUserId }: ClientItemPageProps) {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const isOwner = currentUserId === item.ownerId;
    const [isOpen, setIsOpen] = useState(false);
    // Get otherUserId from URL query parameters
    const otherUserIdFromUrl = searchParams.get('otherUserId');

    // Determine the otherUserId to pass to MessageInterface - FLEKSIBILNO
    let messageInterfaceOtherUserId: string | undefined;
    let messageInterfaceOtherUserName: string | undefined;
    let messageInterfaceOtherUserEmail: string | undefined;

    if (isOwner) {
        // For owners, use the otherUserId from URL if present, otherwise undefined (shows all messages)
        messageInterfaceOtherUserId = otherUserIdFromUrl || undefined;
        // Note: For owners viewing specific conversations, we don't have the other user's name/email here
        // MessageInterface will need to fetch this information from the messages
    } else {
        // For non-owners, always use the item owner
        messageInterfaceOtherUserId = item.ownerId;
        messageInterfaceOtherUserName = item.user.name || undefined;
        messageInterfaceOtherUserEmail = item.user.email;
    }

    // ========================================
    // DEBUG LOGGING
    // ========================================
    console.log('ClientItemPage debug:', {
        itemId: item.id,
        isOwner,
        otherUserIdFromUrl,
        messageInterfaceOtherUserId,
        messageInterfaceOtherUserName,
        messageInterfaceOtherUserEmail,
        currentUserId,
        itemOwnerId: item.ownerId
    });

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 flex gap-10">
            <div className="w-1/2 bg-white shadow-xl rounded-2xl p-8 space-y-6 h-fit">
                <div className="space-y-2 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">{item.title}</h1>
                        <p className="text-gray-600 text-lg">{item.description}</p>
                    </div>
                    <p className={`px-3 py-1 rounded-full text-sm font-medium ${getRentalStatusColor(isCurrentlyRented)}`}>
                        {isCurrentlyRented ? 'Trenutno iznajmljeno' : 'Dostupno za iznajmljivanje'}
                    </p>
                </div>

                {/* Image Gallery */}
                {item.images && item.images.length > 0 && (
                    <ImageGallery images={JSON.parse(item.images)} title={item.title} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    <div>
                        <p className="text-sm text-gray-500">📍 Lokacija</p>
                        <p className="text-base font-medium">{item.location}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">💰 Cijena po danu</p>
                        <p className="text-base font-medium text-green-600">{item.pricePerDay} KM</p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">👤 Vlasnik</p>
                    <p className="text-base font-medium">
                        {item.user.name || 'Nepoznat'} – {item.user.email}
                    </p>
                </div>

                {!isOwner && !isCurrentlyRented && <BookingForm itemId={item.id} />}
            </div>
            
            <div className="w-1/2 space-y-6">
                {/* Messages section - Show for both owners and non-owners */}
                <div className="bg-white shadow-xl rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">
                        {isOwner ? '📬 Inbox i Razgovori' : '💬 Razgovor s vlasnikom'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {isOwner 
                            ? 'Prikazane su sve poruke od korisnika koji su zainteresirani za vaš predmet. Kliknite na korisnika da otvorite razgovor ispod.'
                            : 'Imate pitanja o ovom predmetu? Pošaljite poruku vlasniku direktno.'
                        }
                    </p>

                    {/* ========================================
                        INBOX VIEW - UVIJEK PRIKAZAN ZA VLASNIKA
                        ======================================== */}
                    {isOwner && <InboxView isOpen={isOpen} setIsOpen={setIsOpen} />}
                    
                    {/* ========================================
                        CHAT VIEW - PRIKAZAN KADA IMA SELEKTOVANOG KORISNIKA
                        ======================================== */}
                    {otherUserIdFromUrl && (
                        <div className="mt-6">
                            <MessageInterface
                                itemId={item.id}
                                itemTitle={item.title}
                                otherUserId={messageInterfaceOtherUserId}
                                otherUserName={messageInterfaceOtherUserName}
                                otherUserEmail={messageInterfaceOtherUserEmail}
                                isOpen={isOpen}
                                setIsOpen={setIsOpen}
                            />
                        </div>
                    )}
                </div>
                
                {/* Contact info */}
                <div className="bg-white shadow-xl rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">📞 Kontakt informacije</h3>
                    <p className="text-gray-600">
                        {isOwner 
                            ? 'Korisnici mogu kontaktirati vas direktno kroz poruke iznad.'
                            : 'Za više informacija o ovom predmetu, kontaktirajte vlasnika direktno.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
