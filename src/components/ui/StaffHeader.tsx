"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/barra/nuevo", label: "Nuevo pedido" },
  { href: "/barra", label: "Barra" },
  { href: "/inventario", label: "Inventario" },
  { href: "/dashboard", label: "Dashboard" },
];

export function StaffHeader({ activo }: { activo: string }) {
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
      <nav className="flex gap-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={activo === link.href ? "font-semibold" : "text-neutral-500"}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={cerrarSesion} className="text-sm text-neutral-500">
        Cerrar sesión
      </button>
    </header>
  );
}
