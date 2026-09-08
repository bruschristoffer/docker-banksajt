'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://127.0.0.1:3001/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok && data.token) {
                sessionStorage.setItem('token', data.token);
                router.push('/account');
            } else {
                setMessage(data.message || 'Felaktigt användarnamn eller lösenord');
            }
        } catch {
            setMessage('Något gick fel vid inloggningen.');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center">
                <span className="font-bold text-xl">Banken </span>
                <nav className="flex gap-4">
                    <Link href="/" className="font-medium">Hem</Link>
                    <Link href="/login" className="font-medium">
                        Logga in
                    </Link>
                    <Link href="/register" className="font-medium">
                        Skapa användare
                    </Link>
                </nav>
            </header>

            <main className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-4">Logga in</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-2">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
                            Användarnamn
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                            Lösenord
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                        Logga in
                    </button>
                </form>
                {message && <p className="mt-4 text-sm text-zinc-700">{message}</p>}
            </main>
        </div>
    );
}