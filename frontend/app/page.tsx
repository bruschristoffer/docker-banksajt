import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <header className="w-full bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-4">
          <nav className="flex gap-6">
            <Link href="/" className="font-medium">
              Hem
            </Link>
            <Link href="/login" className="font-medium">
              Logga in
            </Link>
            <Link href="/register" className="font-medium">
              Skapa användare
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
        <h1 className="text-4xl font-extrabold">Välkommen till banken mannen</h1>
        <p className="mt-4 max-w-lg text-lg text-zinc-600">
          Enkelt att hantera dina konton
        </p>
        <Link
          href="/register"
          className="mt-6 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Skapa användare
        </Link>
      </main>
    </div>
  );
}
