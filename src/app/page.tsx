import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-neutral-500">
        Escanea el código QR de tu mesa para ver el menú.
      </p>
      <Link href="/login" className="text-sm text-neutral-400 underline">
        Acceso staff
      </Link>
    </main>
  );
}
