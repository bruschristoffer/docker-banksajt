"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
  id: number;
  amount: number;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:3001/me/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Kunde inte hämta transaktioner");
        }
        return res.json();
      })
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Något gick fel");
        setLoading(false);
      });
  }, [router]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <header className="w-full bg-zinc-50 text-zinc-900">
        <span className="font-bold text-xl">Banken</span>
        <nav className="flex gap-6">
          <Link href="/account" className="font-medium">
            Mitt konto
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem("token");
              router.push("/login");
            }}
            className="font-medium"
          >
            Logga ut
          </button>
        </nav>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-4">Transaktioner</h1>
          <Link
            href="/account"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            Tillbaka till mitt konto
          </Link>
        </div>
        {loading ? (
          <p>Laddar transaktioner...</p>
        ) : error ? (
          <p>{error}</p>
        ) : transactions.length === 0 ? (
          <p>Inga transaktioner hittades.</p>
        ) : (
          <div className="w-full">
            <table className="min-w-full border border-zinc-300">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="border border-zinc-300 px-4 py-2 text-left">
                    Datum och tid
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-left">
                    Typ
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-left">
                    Belopp
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-zinc-300">
                    <td className="border border-zinc-300 px-4 py-2">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="border border-zinc-300 px-4 py-2">
                      {tx.amount > 0 ? "Insättning" : "Uttag"}
                    </td>
                    <td className="border border-zinc-300 px-4 py-2">
                      {Number(tx.amount).toFixed(2)} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
