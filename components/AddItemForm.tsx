'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Upload, 
  MapPin, 
  Euro, 
  Phone, 
  Tag, 
  FileText, 
  Package,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCreateItem } from '../hooks/useCreateItems';

interface NewItem {
    title: string;
    description: string;
    location: string;
    pricePerDay: number;
    phoneNumber: string;
    category: string;
}

const AddItemForm = () => {
    // State za podatke forme - svi podaci koje korisnik unosi
    const [formData, setFormData] = useState<NewItem>({
        title: '',
        description: '',
        location: '',
        pricePerDay: 0,
        phoneNumber: '',
        category: ''
    });
    
    // State za slike - fajlovi koje korisnik odabere
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State za validaciju i poruke korisniku
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDragOver, setIsDragOver] = useState(false);

    const { mutate, isPending } = useCreateItem();

    // Funkcija za ažuriranje podataka forme kada korisnik tipka
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Očisti grešku za ovo polje kada korisnik počne tipkati
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pricePerDay' ? parseFloat(value) || 0 : value,
        }));
    };

    // Funkcija za validaciju slika - provjerava tip i veličinu
    const validateFiles = (files: File[]): File[] => {
        const validFiles: File[] = [];
        const errors: string[] = [];
        
        files.forEach(file => {
            // Provjeri da li je slika
            if (!file.type.startsWith('image/')) {
                errors.push(`${file.name} nije slika.`);
                return;
            }
            
            // Provjeri veličinu (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                errors.push(`${file.name} je prevelika (maksimalno 5MB).`);
                return;
            }
            
            validFiles.push(file);
        });
        
        if (errors.length > 0) {
            setErrors(prev => ({ ...prev, images: errors.join(' ') }));
        } else {
            setErrors(prev => ({ ...prev, images: '' }));
        }
        
        return validFiles;
    };

    // Funkcija za dodavanje slika (iz file input-a ili drag & drop)
    const addImages = (newFiles: File[]) => {
        const validFiles = validateFiles(newFiles);
        
        if (validFiles.length > 0) {
            setImages(prev => [...prev, ...validFiles]);
            
            // Kreiraj preview slike
            const previews = validFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...previews]);
        }
    };

    // Handler za file input
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            addImages(Array.from(files));
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        addImages(files);
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

    // Funkcija za validaciju forme - provjerava sva polja
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        // Provjeri naziv
        if (!formData.title.trim()) {
            newErrors.title = 'Naziv je obavezan.';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Naziv mora imati najmanje 3 karaktera.';
        }
        
        // Provjeri opis
        if (!formData.description.trim()) {
            newErrors.description = 'Opis je obavezan.';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Opis mora imati najmanje 10 karaktera.';
        }
        
        // Provjeri lokaciju
        if (!formData.location.trim()) {
            newErrors.location = 'Lokacija je obavezna.';
        }
        
        // Provjeri cijenu
        if (formData.pricePerDay <= 0) {
            newErrors.pricePerDay = 'Cijena mora biti veća od 0.';
        }
        
        // Provjeri broj telefona
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Broj telefona je obavezan.';
        } else if (!/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phoneNumber.trim())) {
            newErrors.phoneNumber = 'Unesite valjan broj telefona.';
        }
        
        // Provjeri kategoriju
        if (!formData.category) {
            newErrors.category = 'Kategorija je obavezna.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handler za slanje forme
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        // Validiraj formu
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const data = new FormData();
        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('location', formData.location.trim());
        data.append('pricePerDay', String(formData.pricePerDay));
        data.append('phoneNumber', formData.phoneNumber);
        data.append('category', formData.category);

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
                    phoneNumber: '',
                    category: ''
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
    }, [imagePreviews]); // Add imagePreviews to dependency array to prevent memory leaks

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header sa ikonom i naslovom */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
                    <Package className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Dodaj novi predmet</h2>
                <p className="text-gray-600">Popunite podatke o predmetu koji želite iznajmiti</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Naziv predmeta */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        Naziv predmeta *
                    </label>
                    <input
                        type="text"
                        name="title"
                        placeholder="Unesite naziv predmeta"
                        value={formData.title}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                            errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                    />
                    {errors.title && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {errors.title}
                        </div>
                    )}
                </div>

                {/* Opis predmeta */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        Opis predmeta *
                    </label>
                    <textarea
                        name="description"
                        placeholder="Detaljno opišite predmet, njegovo stanje i kako se koristi"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                    />
                    <div className="flex justify-between items-center">
                        {errors.description ? (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {errors.description}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500">
                                {formData.description.length}/500 karaktera
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid za lokaciju i cijenu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lokacija */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MapPin className="w-4 h-4" />
                            Lokacija *
                        </label>
                        <input
                            type="text"
                            name="location"
                            placeholder="Grad, adresa ili općina"
                            value={formData.location}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                                errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        />
                        {errors.location && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {errors.location}
                            </div>
                        )}
                    </div>

                    {/* Cijena po danu */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Euro className="w-4 h-4" />
                            Cijena po danu (€) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="pricePerDay"
                                placeholder="0.00"
                                value={formData.pricePerDay || ''}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-4 py-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                                    errors.pricePerDay ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                €
                            </div>
                        </div>
                        {errors.pricePerDay && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {errors.pricePerDay}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid za telefon i kategoriju */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Broj telefona */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Phone className="w-4 h-4" />
                            Broj telefona *
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="+387 XX XXX XXX"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                                errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        />
                        {errors.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {errors.phoneNumber}
                            </div>
                        )}
                    </div>

                    {/* Kategorija */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Tag className="w-4 h-4" />
                            Kategorija *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                                errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <option value="">Odaberite kategoriju</option>
                            <option value="electronics">📱 Elektronika</option>
                            <option value="tools">🔧 Alati</option>
                            <option value="vehicles">🚗 Vozila</option>
                            <option value="furniture">🪑 Namještaj</option>
                            <option value="sports">⚽ Sport</option>
                            <option value="clothing">👕 Odjeća</option>
                            <option value="books">📚 Knjige</option>
                            <option value="home">🏠 Kuća i vrt</option>
                            <option value="other">📦 Ostalo</option>
                        </select>
                        {errors.category && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {errors.category}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload slika */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Upload className="w-4 h-4" />
                        Slike predmeta
                    </label>
                    
                    {/* Drag & Drop zona */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDragOver 
                                ? 'border-emerald-400 bg-emerald-50' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragOver ? 'Spustite slike ovdje' : 'Kliknite ili povucite slike ovdje'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Maksimalno 5MB po slici • JPG, PNG, GIF
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {errors.images && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {errors.images}
                        </div>
                    )}
                </div>

                {/* Preview slika */}
                {imagePreviews.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">Odabrane slike ({imagePreviews.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviews.map((src, i) => (
                                <div key={i} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                        <Image
                                            src={src}
                                            alt={`Preview ${i + 1}`}
                                            width={200}
                                            height={200}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        onClick={() => deleteImage(i)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit dugme */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isPending || isSubmitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isPending || isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Dodavanje predmeta...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Dodaj predmet
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddItemForm;
