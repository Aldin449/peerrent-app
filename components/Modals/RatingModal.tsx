'use client'
import React, { FunctionComponent, useState } from 'react'
import { useRateUser } from '../../hooks/useRating';
import { Loader2, Star, X, MessageSquare } from 'lucide-react';

type Props = { id: string, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }

const RatingModal: FunctionComponent<Props> = ({ id, isOpen, setIsOpen }) => {
    const [formData, setFormData] = useState({
        rating: 0,
        comment: ''
    })

    const { mutate, isPending } = useRateUser();

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value })
    }

    const handleRatingChange = (rating: number) => {
        setFormData({ ...formData, rating })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutate({ ...formData, userId: id })
        setIsOpen(false);
        setFormData({ rating: 0, comment: '' })
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Ostavi recenziju</h2>
                            <p className="text-sm text-gray-500">Ocijeni ovog korisnika</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating Stars */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Ocjena</label>
                        <div className="flex justify-center items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingChange(star)}
                                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                                        formData.rating >= star
                                            ? 'border-yellow-400 bg-yellow-50 text-yellow-500'
                                            : 'border-gray-200 bg-white text-gray-300 hover:border-yellow-300'
                                    }`}
                                >
                                    <Star 
                                        className={`w-6 h-6 mx-auto ${
                                            formData.rating >= star ? 'fill-current' : ''
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>

                        {formData.rating > 0 && (
                            <div className="text-center">
                                <span className="text-lg font-semibold text-gray-900">
                                    {formData.rating === 1 && 'Loše'}
                                    {formData.rating === 2 && 'Može bolje'}
                                    {formData.rating === 3 && 'Dobro'}
                                    {formData.rating === 4 && 'Vrlo dobro'}
                                    {formData.rating === 5 && 'Odlično!'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-3">
                        <label htmlFor="comment" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>Komentar</span>
                        </label>
                        <textarea
                            id="comment"
                            name="comment"
                            value={formData.comment}
                            onChange={handleOnChange}
                            placeholder="Podijeli svoje iskustvo sa ovim korisnikom..."
                            className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        />
                        <div className="text-xs text-gray-500 text-right">
                            {formData.comment.length}/500
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={formData.rating === 0 || isPending}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                            formData.rating === 0 || isPending
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                    >
                        {isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Slanje...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <Star className="w-4 h-4" />
                                <span>Pošalji recenziju</span>
                            </div>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-500 text-center">
                        Vaša recenzija će biti javno vidljiva i pomoći će drugim korisnicima
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RatingModal