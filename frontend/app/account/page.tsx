'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
    const [amount, setAmount] = useState<number | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();
    

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://127.0.0.1:3001/me/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'}, body: JSON.stringify({token}),
        })
    .then((res) => {
        if (!res.ok) {
            throw new Error('Ej behörig');
        }
            return res.json();

        })
        .then((data) => {
            setAmount(data.amount);
        })
        .catch(() => router.push('/login'));

        }, [router]);

        const handleDeposit = async (e: React.FormEvent) => {
            e.preventDefault();
            const token = sessionStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }
            try {
                const res = await fetch('http://127.0.0.1:3001/me/accounts/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token, amount: Number(depositAmount) }),
                });

                if (res.ok) {

                const data = await res.json();
                setAmount(data.amount);
                setMessage('Insättniing lyckades!!!');
                setDepositAmount('');
                } else {
                    const err = await res.json();
                    setMessage(err.message || 'Gick inte att genomföra insättningen');
                }
            } catch (error) {
                setMessage('Något gick fel vid insättningen');
            }
        };
        return(
            <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center">
                <span className="font-bold text-xl">Banken </span>
                <nav className="flex gap-4">
                    <Link href="/" className="font-medium">Hem</Link>
                    <Link href="/login" onClick={() => sessionStorage.removeItem('token')} className="font-medium">
                        Logga ut
                    </Link>
                </nav>
            </header>

            <main className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-4">Mitt konto</h1>

                <div className="mb-4">
                    <span className="text-sm text-zinc-500">Aktuellt saldo</span>
                    <p className="text-3xl font-bold">{amount !== null ? `${amount} kr` : 'Laddar...'}</p>
                </div>

                <form onSubmit={handleDeposit} className="flex flex-col gap-2">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-zinc-700">
                            Belopp
                        </label>
                        <input
                            type="number"
                            id="amount"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                        Sätt in pengar
                    </button>
                </form>
                {message && <p className="mt-4 text-sm text-zinc-700">{message}</p>}
            </main>
        </div>
        )
}