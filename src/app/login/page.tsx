'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
      callbackUrl: '/',
    });
    if (res?.error) setError('Neispravan email ili lozinka');
    else router.push('/');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 mt-10">
      <input name="email" onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border px-4 py-2" placeholder="Email" />
      <input name="password" type="password" onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border px-4 py-2" placeholder="Lozinka" />
      <button className="w-full bg-black text-white py-2">Prijavi se</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
