'use client';

import React, {useState} from 'react';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {

    const router = useRouter();

    const [formData, setFormData] = useState({
        name:'',
        email:'',
        password:''
    })

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setErrorMsg('');

        const res = await fetch('/api/register',{
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        setLoading(false);

        if (data.error) {
            setErrorMsg(data.error)
        } else {
            router.push('/login')
        }
    }

  return (
     <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Registracija</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Ime"
          value={formData.name}
          onChange={handleChange}
          className="w-full border px-4 py-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border px-4 py-2"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Lozinka"
          value={formData.password}
          onChange={handleChange}
          className="w-full border px-4 py-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 w-full"
        >
          {loading ? 'Registrujem...' : 'Registruj se'}
        </button>

        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      </form>
    </div>
  )
}

export default RegisterPage
