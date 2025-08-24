'use client';
import { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useEditItem } from '../../hooks/useEditItem';

interface EditItemModalProps {
    item: {
        id: string;
        title: string;
        description: string;
        location: string;
        pricePerDay: number;
        phoneNumber: string | null;
        images: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
}

const EditItemModal = ({ item, isOpen, onClose }: EditItemModalProps) => {
    const [formData, setFormData] = useState({
        title: item.title,
        description: item.description,
        location: item.location,
        pricePerDay: item.pricePerDay,
        phoneNumber: item.phoneNumber
    });

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        item.images ? JSON.parse(item.images) : []
    );
    const [existingImages, setExistingImages] = useState<string[]>(
        item.images ? JSON.parse(item.images) : []
    );

    const { mutate, isPending } = useEditItem();

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: item.title,
                description: item.description,
                location: item.location,
                pricePerDay: item.pricePerDay,
                phoneNumber: item.phoneNumber
            });
            setImagePreviews(item.images ? JSON.parse(item.images) : []);
            setExistingImages(item.images ? JSON.parse(item.images) : []);
        }
    }, [isOpen, item]);

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
            const fileArray = Array.from(files).filter(file => {
                if (!file.type.startsWith('image/')) {
                    alert('Molimo odaberite samo slike.');
                    return false;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Slike moraju biti manje od 5MB.');
                    return false;
                }
                return true;
            });

            setImages(fileArray);
            const previews = fileArray.map((file) => URL.createObjectURL(file));
            setImagePreviews([...existingImages, ...previews]);
        }
    };
    console.log(images)

    const removeImage = (index: number) => {
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);

        if (index < existingImages.length) {
            // Remove from existing images
            const newExisting = [...existingImages];
            newExisting.splice(index, 1);
            setExistingImages(newExisting);
        } else {
            // Remove from new images
            const newImages = [...images];
            newImages.splice(index - existingImages.length, 1);
            setImages(newImages);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isPending) return;

        if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
            alert('Molimo popunite sva obavezna polja.');
            return;
        }

        if (formData.pricePerDay <= 0) {
            alert('Cijena mora biti veća od 0.');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('location', formData.location.trim());
        data.append('pricePerDay', String(formData.pricePerDay));
        data.append('phoneNumber', formData.phoneNumber || '');

        existingImages.forEach((image) => {
            data.append('existingImages', image);
        });

        if (images.length > 0) {
            images.forEach((image) => {
                data.append('images', image);
            });
        }

        mutate({ id: item.id, data }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Item</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Naslov
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Opis
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lokacija
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cijena po danu (KM)
                            </label>
                            <input
                                type="number"
                                name="pricePerDay"
                                value={formData.pricePerDay}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefon
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slike
                            </label>

                            {/* Existing Images */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {imagePreviews.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Images */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-gray-600">Kliknite da dodate nove slike</span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Otkaži
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Čuvam...' : 'Sačuvaj promjene'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;