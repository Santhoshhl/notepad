'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="rounded-full bg-zinc-800 p-3 text-zinc-300">
            <Lock size={28} />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Private Vault</h1>
          <p className="text-sm text-zinc-400">Enter password to unlock your notes</p>
        </div>

        {error && <div className="mb-4 text-sm text-rose-500 text-center">{error}</div>}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition"
        >
          Unlock Vault
        </button>
      </form>
    </div>
  );
}