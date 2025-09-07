'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const res = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
      callbackUrl: '/',
    });
    
    if (res?.error) {
      // Provjeri da li je problem sa verifikacijom emaila
      try {
        const checkUserResponse = await fetch('/api/auth/check-user-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        if (checkUserResponse.ok) {
          const userData = await checkUserResponse.json();
          if (userData.exists && !userData.emailVerified) {
            setError('Molimo verifikujte svoj email prije prijave. Provjerite svoju email poštu za verifikacijski link.');
            setShowResendLink(true);
          } else {
            setError('Neispravan email ili lozinka');
            setShowResendLink(false);
          }
        } else {
          setError('Neispravan email ili lozinka');
          setShowResendLink(false);
        }
      } catch {
        setError('Neispravan email ili lozinka');
      }
    } else {
      router.push('/');
    }
    
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Molimo unesite email adresu');
      return;
    }

    setIsResendingVerification(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setError('Verifikacijski email je poslat. Provjerite svoju email poštu.');
        setShowResendLink(false);
      } else {
        setError(data.error || 'Greška pri slanju verifikacijskog emaila');
      }
    } catch {
      setError('Greška pri slanju verifikacijskog emaila');
    }

    setIsResendingVerification(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dobrodošli nazad</h1>
          <p className="text-gray-600">Prijavite se na svoj nalog</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email adresa
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="unesite@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Lozinka
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`border rounded-lg p-4 ${error.includes('verifikujte') || error.includes('poslat') ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-medium ${error.includes('verifikujte') || error.includes('poslat') ? 'text-blue-600' : 'text-red-600'}`}>
                {error}
              </p>
              {showResendLink && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium underline disabled:opacity-50"
                >
                  {isResendingVerification ? 'Šaljem...' : 'Pošaljite ponovo verifikacijski email'}
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={20} />
                Prijavljujem...
              </div>
            ) : (
              'Prijavi se'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-gray-600">
            Nemate nalog?{' '}
            <Link 
              href="/register" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Registrujte se
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            <Link 
              href="/reset-password-request" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Zaboravili ste lozinku?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
