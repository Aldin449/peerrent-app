'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ImageGallery from '../../../../components/ImageGallery';
import BookingForm from '../../../../components/BookingForm';
import MessageInterface from '../../../../components/MessageInterface';
import InboxView from '../../../../components/InboxView';
import Link from 'next/link';
import { useState } from 'react';
import { MessageCircle, MapPin, DollarSign, Phone, User, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import EditItemModal from '../../../../components/Modals/EditItemModal';
import DeleteItemModal from '../../../../components/Modals/DeleteItemModal';

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
    phoneNumber:string | null
}

interface ClientItemPageProps {
    item: Item;
    isCurrentlyRented: boolean;
    currentUserId: string;
}

function getRentalStatusColor(isRented: boolean) {
    return isRented ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200';
}

export default function ClientItemPage({ item, isCurrentlyRented, currentUserId }: ClientItemPageProps) {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const isOwner = currentUserId === item.ownerId;
    const [isOpen, setIsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const otherUserIdFromUrl = searchParams.get('otherUserId');

    let messageInterfaceOtherUserId: string | undefined;
    let messageInterfaceOtherUserName: string | undefined;
    let messageInterfaceOtherUserEmail: string | undefined;

    if (isOwner) {
        messageInterfaceOtherUserId = otherUserIdFromUrl || undefined;
    } else {
        messageInterfaceOtherUserId = item.ownerId;
        messageInterfaceOtherUserName = item.user.name || undefined;
        messageInterfaceOtherUserEmail = item.user.email;
    }

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
            <EditItemModal item={item} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}/>
            <DeleteItemModal itemId={item.id} isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen}/>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Item Details */}
                    <div className="space-y-6">
                        {/* Item Header */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                                        {item.title}
                                    </h1>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getRentalStatusColor(isCurrentlyRented)}`}>
                                        {isCurrentlyRented ? (
                                            <>
                                                <Clock className="w-4 h-4 mr-2" />
                                                Trenutno iznajmljeno
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Dostupno
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Image Gallery */}
                            {item.images && item.images.length > 0 && (
                                <div className="mb-6">
                                    <ImageGallery images={JSON.parse(item.images)} title={item.title} />
                                </div>
                            )}

                            {/* Item Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-t border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Lokacija</p>
                                        <p className="font-semibold text-gray-900">{item.location}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Cijena po danu</p>
                                        <p className="font-semibold text-green-600 text-lg">{item.pricePerDay} KM</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Phone className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Telefon</p>
                                        <p className="font-semibold text-gray-900">{item.phoneNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Vlasnik</p>
                                        <p className="font-semibold text-gray-900">
                                            {item.user.name || 'Nepoznat'} – {item.user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Owner Actions - Edit & Delete */}
                            {isOwner && (
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-center">
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Uredi
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Obriši
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Booking Form for Non-Owners */}
                            {!isOwner && !isCurrentlyRented && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <BookingForm itemId={item.id} />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Right Column - Messages & Contact */}
                    <div className="space-y-6">
                        {/* Messages Section */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                {isOwner ? (
                                    <>
                                        <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                                        Inbox i Razgovori
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                                        Razgovor s vlasnikom
                                    </>
                                )}
                            </h3>
                            
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {isOwner 
                                    ? 'Prikazane su sve poruke od korisnika koji su zainteresirani za vaš predmet. Kliknite na korisnika da otvorite razgovor ispod.'
                                    : 'Imate pitanja o ovom predmetu? Pošaljite poruku vlasniku direktno.'
                                }
                            </p>

                            {/* Inbox View for Owners */}
                            {isOwner && <InboxView isOpen={isOpen} setIsOpen={setIsOpen} />}
                            
                            {/* Message Interface for Selected User */}
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

                            {/* Chat Button for Non-Owners */}
                            {!isOwner && (
                                <div className="mt-6">
                                    <button
                                        onClick={() => setIsChatOpen(true)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 font-semibold"
                                    >
                                        <MessageCircle size={20} />
                                        <span>OTVORI CHAT</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <Phone className="w-5 h-5 mr-2 text-purple-600" />
                                Kontakt informacije
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {isOwner 
                                    ? 'Korisnici mogu kontaktirati vas direktno kroz poruke iznad.'
                                    : 'Za više informacija o ovom predmetu, kontaktirajte vlasnika direktno.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Interface for Non-Owners - Full Width Below */}
                {!isOwner && isChatOpen && (
                    <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <MessageInterface
                            itemId={item.id}
                            itemTitle={item.title}
                            otherUserId={item.ownerId}
                            otherUserName={item.user.name || undefined}
                            otherUserEmail={item.user.email}
                            isOpen={isChatOpen}
                            setIsOpen={setIsChatOpen}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
