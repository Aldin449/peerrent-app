'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCreateItem } from '../hooks/useCreateItems';

interface NewItem {
    title: string;
    description: string;
    location: string;
    pricePerDay: number;
    phoneNumber:string;
}

const AddItemForm = () => {
    const [formData, setFormData] = useState<NewItem>({
        title: '',
        description: '',
        location: '',
        pricePerDay: 0,
        phoneNumber:''
    });
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { mutate, isPending } = useCreateItem();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pricePerDay' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // Convert FileList to File[] and validate files
            const fileArray = Array.from(files).filter(file => {
                // Check file type
                if (!file.type.startsWith('image/')) {
                    alert('Molimo odaberite samo slike.');
                    return false;
                }
                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Slike moraju biti manje od 5MB.');
                    return false;
                }
                return true;
            });

            setImages(fileArray);

            // Create previews from the files
            const previews = fileArray.map((file) => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };

    const deleteImage = (i: number) => {
        // Remove from image previews
        const tempArray = [...imagePreviews];
        const removedPreview = tempArray.splice(i, 1)[0];
        setImagePreviews(tempArray);

        // Remove from images (File[] array)
        const tempArray2 = [...images];
        tempArray2.splice(i, 1);
        setImages(tempArray2);

        // Clean up the URL
        if (removedPreview) {
            URL.revokeObjectURL(removedPreview);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        // Basic validation
        if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
            alert('Molimo popunite sva obavezna polja.');
            return;
        }

        if (formData.pricePerDay <= 0) {
            alert('Cijena mora biti veća od 0.');
            return;
        }

        setIsSubmitting(true);

        const data = new FormData();
        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('location', formData.location.trim());
        data.append('pricePerDay', String(formData.pricePerDay));
        data.append('phoneNumber', formData.phoneNumber)

        // Only append images if there are any
        if (images.length > 0) {
            images.forEach((image) => {
                data.append('images', image);
            });
        }

        mutate(data, {
            onSuccess: () => {
                setFormData({
                    title: '',
                    description: '',
                    location: '',
                    pricePerDay: 0,
                    phoneNumber:''
                });
                setImages([]);
                setImagePreviews([]);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Cleanup URL.createObjectURL on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
            <input
                type="text"
                name="title"
                placeholder="Naziv"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 rounded"
            />
            <textarea
                name="description"
                placeholder="Opis"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 rounded"
                rows={3}
            />
            <input
                type="text"
                name="location"
                placeholder="Lokacija"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 rounded"
            />
            <input
                type="text"
                name="pricePerDay"
                placeholder="Cijena po danu"
                value={formData.pricePerDay}
                onChange={handleChange}
                required
                min={0}
                className="w-full border px-4 py-2 rounded"
            />
            <input
                type="text"
                name="phoneNumber"
                placeholder="Broj telefona"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 rounded"
            />
            <div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border px-4 py-2 rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                    Maksimalno 5MB po slici. Podržani formati: JPG, PNG, GIF
                </p>
            </div>

            {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, i) => (
                        <div key={i} className='relative'>
                            <Image
                                src={src}
                                alt={`Preview ${i}`}
                                width={128}
                                height={128}
                                className="object-cover rounded border"
                            />
                            <button
                                type="button"
                                className='absolute top-2 right-2 text-white bg-red-500 rounded-full p-1 hover:bg-red-600'
                                onClick={() => deleteImage(i)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending || isSubmitting}
                className="bg-black text-white px-4 py-2 w-full rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800"
            >
                {isPending || isSubmitting ? 'Dodavanje...' : 'Dodaj Item'}
            </button>
        </form>
    );
};

export default AddItemForm;
