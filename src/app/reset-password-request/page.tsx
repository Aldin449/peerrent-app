"use client";
import { useState } from "react";
import { useResetPasswordRequest } from "../../../hooks/useResetPassword";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordRequestPage() {
    const [email, setEmail] = useState("");

    const { mutate, isPending } = useResetPasswordRequest({
        onSuccess: () => {
            toast.success('Email za resetovanje lozinke je poslat')
        },
        onError: () => {
            toast.error('Korisnik nije pronađen')
        }
    })
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        mutate(email)
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Zaboravljena lozinka</h1>
                    <p className="text-gray-600">Unesite svoj email da pošaljemo link za resetovanje</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email adresa
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="unesite@email.com"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Slanje...
                            </div>
                        ) : (
                            'Pošalji link za reset'
                        )}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <Link 
                        href="/login" 
                        className="inline-flex items-center text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Nazad na prijavu
                    </Link>
                </div>
            </div>
        </div>
    );
}
